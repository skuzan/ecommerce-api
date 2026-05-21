import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import type {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
} from "../schemas/productSchemas.js";
import path from "node:path";
import fs from "node:fs/promises";
import { decodeCursor, encodeCursor } from "../utils/cursor.js";

type SearchProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  rank: number;
};

function buildProductWhere(filters: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.producerId) {
    where.producerId = filters.producerId;
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    where.tags = { some: { id: { in: filters.tagIds } } };
  }

  if (filters.search) {
    where.OR = [
      {
        name: { contains: filters.search, mode: "insensitive" },
      },
      {
        description: { contains: filters.search, mode: "insensitive" },
      },
    ];
  }

  const minPrice = filters.minPrice;
  const maxPrice = filters.maxPrice;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
      ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
    };
  }

  return where;
}

export const productService = {
  findAll: async (filters: ProductQuery) => {
    const where = buildProductWhere(filters);

    const total = await prisma.product.count({ where });
    const data = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        category: {
          select: { id: true, name: true },
        },
        producer: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
      },
      orderBy: { [filters.sort]: filters.order },
      take: filters.limit,
      skip: (filters.page - 1) * filters.limit,
    });

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },

  findAllWithCursor: async (filters: ProductQuery) => {
    const where = buildProductWhere(filters);
    const limit = filters.limit;

    if (filters.cursor) {
      const decode = decodeCursor(filters.cursor);
      if (!decode) {
        throw new ValidationError("Geçersiz Cursor", {
          cursor: ["cursor parametresi zorunludur"],
        });
      }

      where.OR = [
        { createdAt: { lt: new Date(decode.createdAt) } },
        {
          createdAt: new Date(decode.createdAt),
          id: { lt: decode.id },
        },
      ];
    }
    const rows = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        producer: { select: { id: true, name: true } },
        tags: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];

    const nextCursor =
      hasMore && last
        ? encodeCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null;

    return {
      data,
      meta: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  },

  findById: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        producer: true,
        tags: { where: { deletedAt: null } },
      },
    });
    if (!product) throw new NotFoundError("Ürün");
    return product;
  },

  create: async (input: CreateProductInput & { ownerId: string }) => {
    return prisma.product.create({
      data: {
        name: input.name,
        ...(input.description !== undefined && {
          description: input.description,
        }),
        price: input.price,
        stock: input.stock ?? 0,
        ownerId: input.ownerId,
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.producerId !== undefined && { producerId: input.producerId }),
        ...(input.tagIds && {
          tags: { connect: input.tagIds.map((id) => ({ id })) },
        }),
      },
      include: {
        category: true,
        producer: true,
        tags: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  },

  update: async (id: string, input: UpdateProductInput) => {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.price !== undefined) data.price = input.price;
    if (input.stock !== undefined) data.stock = input.stock;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.producerId !== undefined) data.producerId = input.producerId;
    if (input.tagIds !== undefined) {
      data.tags = { set: input.tagIds.map((id) => ({ id })) };
    }

    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, producer: true, tags: true },
    });
  },

  addTags: async (productId: string, tagIds: string[]) => {
    return prisma.product.update({
      where: { id: productId },
      data: {
        tags: { connect: tagIds.map((id) => ({ id })) },
      },
      include: { tags: true },
    });
  },

  removeTags: async (productId: string, tagIds: string[]) => {
    return prisma.product.update({
      where: { id: productId },
      data: {
        tags: { disconnect: tagIds.map((id) => ({ id })) },
      },
      include: { tags: true },
    });
  },

  setTags: async (productId: string, tagIds: string[]) => {
    return prisma.product.update({
      where: { id: productId },
      data: {
        tags: { set: tagIds.map((id) => ({ id })) },
      },
      include: { tags: true },
    });
  },

  remove: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundError("Ürün");
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  restore: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError("Ürün");
    }

    if (!product.deletedAt) {
      throw new ConflictError("Ürün zaten aktif");
    }

    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        category: true,
        producer: true,
        tags: { where: { deletedAt: null } },
      },
    });
  },

  findDeleted: async () => {
    return prisma.product.findMany({
      where: { deletedAt: { not: null } },
      include: { category: true, producer: true },
      orderBy: { deletedAt: "desc" },
    });
  },
  setImage: async (id: string, imageUrl: string) => {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    const updated = await prisma.product.update({
      where: { id },
      data: { imageUrl },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      const oldPath = path.resolve(`.${existing.imageUrl}`);
      await fs.unlink(oldPath).catch(() => {
        // Dosya zaten yoksa veya silinememişse sessiz geç —
        // DB tutarlı, disk best-effort
      });
    }

    return updated;
  },

  search: async (
    q: string,
    page: number,
    limit: number,
  ): Promise<{ data: SearchProduct[]; total: number }> => {
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRaw<SearchProduct[]>(Prisma.sql`
    SELECT
      "id",
      "name",
      "description",
      "price",
      "imageUrl",
      ts_rank("searchVector", websearch_to_tsquery('turkish_unaccent', ${q})) AS "rank"
    FROM "products"
    WHERE "deletedAt" IS NULL
      AND "isActive" = true
      AND "searchVector" @@ websearch_to_tsquery('turkish_unaccent', ${q})
    ORDER BY "rank" DESC, "createdAt" DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

    const totalResult = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "products"
    WHERE "deletedAt" IS NULL
      AND "isActive" = true
      AND "searchVector" @@ websearch_to_tsquery('turkish_unaccent', ${q})
  `);

    return {
      data: rows,
      total: Number(totalResult[0]?.count ?? 0),
    };
  },
};
