import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";

export const wishlistService = {
  list: async (userId: string) => {
    return prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isActive: true,
          },
        },
      },
    });
  },

  add: async (userId: string, productId: string) => {
    // Ürün gerçekten var mı? (silinmiş ürüne favorileme anlamsız)
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundError("Ürün");

    try {
      return await prisma.wishlistItem.create({
        data: { userId, productId },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Bu ürün zaten favorilerinde");
      }
      throw err;
    }
  },

  remove: async (userId: string, productId: string) => {
    const result = await prisma.wishlistItem.deleteMany({
      where: { userId, productId },
    });
    if (result.count === 0) {
      throw new NotFoundError("Favori kayıt");
    }
  },
};