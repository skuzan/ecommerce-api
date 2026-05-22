import { prisma } from "../config/database.js";
import type { UpsertReviewInput } from "../schemas/reviewSchemas.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import { decodeCursor, encodeCursor } from "../utils/cursor.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ValidationError } from "../utils/errors.js";

export const reviewService = {
  upsert: async (
    userId: string,
    productId: string,
    input: UpsertReviewInput,
  ) => {
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundError("Ürün");
    }

    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      return await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: input.rating,
          ...(input.comment !== undefined && { comment: input.comment }),
          deletedAt: null,
        },
      });
    }

    return await prisma.review.create({
      data: {
        userId,
        productId,
        rating: input.rating,
        ...(input.comment !== undefined && { comment: input.comment }),
      },
    });
  },

  findAllByProduct: async (
    productId: string,
    cursor: string | undefined,
    limit: number,
  ) => {
    const where: Prisma.ReviewWhereInput = {
      productId,
      deletedAt: null,
    };

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded)
        throw new ValidationError("Geçersiz cursor", {
          /* ... */
        });
      where.OR = [
        { createdAt: { lt: new Date(decoded.createdAt) } },
        {
          createdAt: new Date(decoded.createdAt),
          id: { lt: decoded.id },
        },
      ];
    }

    const rows = await prisma.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null;

    return { data, meta: { limit, nextCursor, hasMore } };
  },

  getStats: async (productId: string) => {
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundError("Ürün");

    const [aggregate, distribution] = await Promise.all([
      prisma.review.aggregate({
        where: { productId, deletedAt: null },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId, deletedAt: null },
        _count: true,
        orderBy: { rating: "desc" },
      }),
    ]);

    return {
      avgRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count,
      distribution: distribution.map((d) => ({
        rating: d.rating,
        count: d._count,
      })),
    };
  },

  remove: async (userId: string, role: string, reviewId: string) => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, deletedAt: true },
    });
    if (!review || review.deletedAt) {
      throw new NotFoundError("Yorum");
    }

    if (review.userId !== userId && role !== "admin") {
      throw new ForbiddenError("Sadece kendi yorumunu silebilirsin");
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
  },
};
