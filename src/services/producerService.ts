import { prisma } from "../config/database.js";
import type { CreateProducerInput, UpdateProducerInput } from "../schemas/producerSchemas.js";
import { NotFoundError } from "../utils/errors.js";

export const producerService = {
  findAll: async () => {
    return prisma.producer.findMany({
      where: { deletedAt: null },
      include: { products: { where: { deletedAt: null } } },
      orderBy: { name: "asc" },
    });
  },
  findById: async (id: string) => {
    const producer = await prisma.producer.findUnique({
      where: { id, deletedAt: null },
      include: { products: { where: { deletedAt: null } } },
    });
    if (!producer) throw new NotFoundError("Üretici");
    return producer;
  },
  create: async (input: CreateProducerInput) => {
    return prisma.producer.create({
      data: {
        name: input.name,
        ...(input.city !== undefined && { city: input.city }),
      },
    });
  },
  update: async (id: string, input: UpdateProducerInput) => {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.city !== undefined) data.city = input.city;

    return prisma.producer.update({
      where: { id },
      data,
    });
  },
  remove: async (id: string) => {
    const producer = await prisma.producer.findUnique({ where: { id, deletedAt: null } });
    if (!producer) throw new NotFoundError("Üretici");
    await prisma.producer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
