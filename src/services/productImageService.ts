import path from "node:path"
import { prisma } from "../config/database.js"
import fs from "node:fs/promises";
import { NotFoundError, ValidationError } from "../utils/errors.js";

const MAX_IMAGES_PER_PRODUCT = 10;

async function cleanupFiles(files: Express.Multer.File[]) {
    await Promise.all(
        files.map((f) => fs.unlink(path.resolve(f.path)).catch(() => {
            //sessiz geç
        }))
    )
}

export const productImageService = {
    addMany: async (
        productId: string, files: Express.Multer.File[]
    ) => {

        const product = await prisma.product.findUnique({
            where: { id: productId, deletedAt: null },
            select: {
                id: true,
                _count: {
                    select: { images: true }
                }
            }
        })

        if (!product) {
            await cleanupFiles(files)
            throw new NotFoundError("Ürün")
        }

        if (product._count.images + files.length > MAX_IMAGES_PER_PRODUCT) {
            await cleanupFiles(files)
            throw new ValidationError("Görsel Limiti aşıldı", {
                images: [
                    `Ürün başına maksimum ${MAX_IMAGES_PER_PRODUCT} görsel,` +
                    `mevcut ${product._count.images}, yeni ${files.length}`
                ]
            })
        }

        const last = await prisma.productImage.findFirst({
            where: {
                productId
            },
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true }
        })
        const baseOrder = (last?.sortOrder ?? -1) + 1

        try {
            const created = await prisma.$transaction(
                files.map((f, i) =>
                    prisma.productImage.create({
                        data: {
                            productId,
                            url: `uploads/products/${f.filename}`,
                            sortOrder: baseOrder + i
                        }
                    })

                )
            )
            return created
        } catch (err) {
            await cleanupFiles(files)
            throw err
        }
    },

    remove: async (productId: string, imageId: string) => {
        const image = await prisma.productImage.findUnique({
            where: { id: imageId },
            select: {
                id: true, productId: true, url: true
            }
        })

        if (!image) {
            throw new NotFoundError("Görsel")
        }

        if (image.productId !== productId) {
            throw new NotFoundError("Görsel")
        }

        await prisma.productImage.delete({
            where: { id: imageId }
        })

        const diskPath = path.resolve(`.${image.url}`)
        await fs.unlink(diskPath).catch(() => { })

        return { id: imageId }
    }
}