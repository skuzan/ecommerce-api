import { prisma } from "../config/database.js";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/addressSchemas.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

const addressSelect = {
  id: true,
  title: true,
  fullName: true,
  phone: true,
  city: true,
  district: true,
  fullAddress: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const addressService = {
  findAll: async (userId: string) => {
    return prisma.address.findMany({
      where: { userId, deletedAt: null },
      select: addressSelect,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  findById: async (userId: string, id: string) => {
    const address = await prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
      select: addressSelect,
    });
    if (!address) throw new NotFoundError("Adres");
    return address;
  },

  create: async (userId: string, input: CreateAddressInput) => {
    return prisma.$transaction(async (tx) => {
      const addressCount = await tx.address.count({
        where: { userId, deletedAt: null },
      });
      const isDefault = input.isDefault || addressCount === 0;

      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, deletedAt: null, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          title: input.title,
          fullName: input.fullName,
          phone: input.phone,
          city: input.city,
          district: input.district,
          fullAddress: input.fullAddress,
          isDefault,
        },
        select: addressSelect,
      });
    });
  },

  update: async (userId: string, id: string, input: UpdateAddressInput) => {
    const existing = await prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundError("Adres");

    return prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, deletedAt: null, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.fullName !== undefined && { fullName: input.fullName }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.city !== undefined && { city: input.city }),
          ...(input.district !== undefined && { district: input.district }),
          ...(input.fullAddress !== undefined && {
            fullAddress: input.fullAddress,
          }),
          ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        },
        select: addressSelect,
      });
    });
  },

  remove: async (userId: string, id: string) => {
    const address = await prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, isDefault: true },
    });
    if (!address) throw new NotFoundError("Adres");

    await prisma.address.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });
  },

  setDefault: async (userId: string, id: string) => {
    const address = await prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });
    if (!address) throw new NotFoundError("Adres");

    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
        select: addressSelect,
      });
    });
  },

  restore: async (userId: string, id: string) => {
    const address = await prisma.address.findFirst({
      where: { id, userId },
      select: { id: true, deletedAt: true },
    });
    if (!address) throw new NotFoundError("Adres");
    if (!address.deletedAt) throw new ConflictError("Bu adres zaten aktif");

    return prisma.address.update({
      where: { id },
      data: { deletedAt: null },
      select: addressSelect,
    });
  },

  findDeleted: async (userId: string) => {
    return prisma.address.findMany({
      where: { userId, deletedAt: { not: null } },
      select: addressSelect,
      orderBy: { deletedAt: "desc" },
    });
  },
};
