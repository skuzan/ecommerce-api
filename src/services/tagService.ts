import { ConflictError, NotFoundError } from "../utils/errors.js";
import { prisma } from "../config/database.js";
import type { CreateTagInput, UpdateTagInput } from "../schemas/tagSchemas.js";


export const tagService = {
  findAll: async () => {
    return prisma.tag.findMany({
      where: { deletedAt: null },
      include: { products: { where: { deletedAt: null } } },
      orderBy: { name: "asc" },
    });
  },

  findById: async (id: string) => {
    const tag = await prisma.tag.findUnique({
      where: { id, deletedAt: null },
      include: { products: { where: { deletedAt: null } } },
    });
    if (!tag) throw new NotFoundError("Etiket");
    return tag;
  },

  create: async (input: CreateTagInput) => {
    return prisma.tag.create({
      data: { name: input.name },
    });
  },

  update: async (id: string, input: UpdateTagInput) => {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;

    return prisma.tag.update({
      where: { id },
      data,
    });
  },

  remove: async (id: string) => {
    const tag = await prisma.tag.findUnique({ where: { id, deletedAt: null } });
    if (!tag) throw new NotFoundError("Etiket");
    await prisma.tag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

    restore: async (id: string) => {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundError("Etiket");
    if (!tag.deletedAt) throw new ConflictError("Bu etiket zaten aktif");

    return prisma.tag.update({
      where: { id },
      data: { deletedAt: null },
      include: { products: { where: { deletedAt: null } } },
    });
  },

  findDeleted: async () => {
    return prisma.tag.findMany({
      where: { deletedAt: { not: null } },
      include: { products: { where: { deletedAt: null } } },
      orderBy: { deletedAt: "desc" },
  })
}
};
