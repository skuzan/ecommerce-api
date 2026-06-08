import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/addressSchemas.js";

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
} satisfies Prisma.AddressSelect;

export const addressService = {
  list: async (userId: string) => {
    return prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: addressSelect,
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
    try {
      return await prisma.$transaction(async (tx) => {
        // Bu user'ın hiç adresi yoksa otomatik default
        const count = await tx.address.count({
          where: { userId, deletedAt: null },
        });
        const shouldBeDefault = input.isDefault === true || count === 0;

        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { userId, isDefault: true, deletedAt: null },
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
            isDefault: shouldBeDefault,
          },
          select: addressSelect,
        });
      });
    } catch (err) {
      // Partial unique index race condition — defense in depth
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Aynı anda başka bir varsayılan adres ayarlandı");
      }
      throw err;
    }
  },

  update: async (userId: string, id: string, input: UpdateAddressInput) => {
    const existing = await prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, isDefault: true },
    });
    if (!existing) throw new NotFoundError("Adres");

    const willBecomeDefault =
      input.isDefault === true && !existing.isDefault;

    // exactOptionalPropertyTypes: yalnızca tanımlı alanları data'ya yaz.
    const data: Prisma.AddressUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.city !== undefined) data.city = input.city;
    if (input.district !== undefined) data.district = input.district;
    if (input.fullAddress !== undefined) data.fullAddress = input.fullAddress;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    try {
      return await prisma.$transaction(async (tx) => {
        if (willBecomeDefault) {
          await tx.address.updateMany({
            where: { userId, isDefault: true, deletedAt: null },
            data: { isDefault: false },
          });
        }

        return tx.address.update({
          where: { id },
          data,
          select: addressSelect,
        });
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Aynı anda başka bir varsayılan adres ayarlandı");
      }
      throw err;
    }
  },

  setDefault: async (userId: string, id: string) => {
    const address = await prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });
    if (!address) throw new NotFoundError("Adres");

    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
      return tx.address.update({
        where: { id },
        data: { isDefault: true },
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

    // Soft delete — Order tablosu Gün 48'de FK olarak referans verecek.
    // Default adres silindiyse, kalan adreslerden birini otomatik default yapmıyoruz;
    // user dilerse setDefault çağırır. Bu kasıtlı sade davranış.
    await prisma.address.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });
  },
};
