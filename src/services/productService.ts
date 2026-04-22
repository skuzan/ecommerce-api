import { ConflictError, NotFoundError } from "../utils/errors.js";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import type { CreateProductInput, ProductQuery, UpdateProductInput } from "../schemas/productSchemas.js";

export const productService = {
  findAll: async (filters: ProductQuery) => {
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

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      };
    }

    const total = await prisma.product.count({ where });
    const data = await prisma.product.findMany({
      where,
      include: {
        category: true,
        producer: true,
        tags: { where: { deletedAt: null } },
      },
      orderBy: {
        createdAt: "desc",
      },
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

  create: async (input: CreateProductInput) => {
    return prisma.product.create({
      data: {
        name: input.name,
        ...(input.description !== undefined && {
          description: input.description,
        }),
        price: input.price,
        stock: input.stock ?? 0,
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.producerId !== undefined && { producerId: input.producerId }),
        ...(input.tagIds && {
          tags: { connect: input.tagIds.map((id) => ({ id })) },
        }),
      },
      include: { category: true, producer: true, tags: true },
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
};
