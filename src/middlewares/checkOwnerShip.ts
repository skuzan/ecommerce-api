import { type RequestHandler } from "express"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../utils/errors.js"
import { prisma } from "../config/database.js"


type ResourceType = "product"


export const checkOwnership = (resource: ResourceType): RequestHandler =>
    asyncHandler(async (req, _res, next) => {
        if (!req.user) {
            throw new UnauthorizedError("Önce giriş yapmalısınız");
        }

        // ADMIN bypass — sahiplik kontrolü ADMIN'i durdurmaz
        if (req.user.role === "ADMIN") return next();

        const { id } = req.params;
        if (!id) throw new NotFoundError("Kaynak");

        if (resource === "product") {
            const product = await prisma.product.findFirst({
                where: { id, deletedAt: null },
                select: { id: true, ownerId: true },
            });
            if (!product) throw new NotFoundError("Ürün");
            if (product.ownerId !== req.user.userId) {
                throw new ForbiddenError("Bu kaynak üzerinde yetkiniz yok");
            }
        }

        next();
    });