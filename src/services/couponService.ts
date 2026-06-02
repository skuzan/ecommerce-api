import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import type {
  CreateCouponInput,
  UpdateCouponInput,
} from "../schemas/couponSchemas.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

const couponInclude = {
  _count: {
    select: { carts: true },
  },
} as const;

export const couponService = {
  findAll: async () => {
    return prisma.coupon.findMany({
      include: couponInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findById: async (id: string) => {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: couponInclude,
    });
    if (!coupon) throw new NotFoundError("Kupon");
    return coupon;
  },

  create: async (input: CreateCouponInput) => {
    try {
      return await prisma.coupon.create({
        data: {
          code: input.code,
          discountType: input.discountType,
          discountValue: input.discountValue,
          minOrderAmount: input.minOrderAmount,
          maxUsage: input.maxUsage ?? null,
          expiresAt: input.expiresAt ?? null,
          isActive: input.isActive,
        },
        include: couponInclude,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Bu kupon kodu zaten mevcut");
      }
      throw err;
    }
  },

  update: async (id: string, input: UpdateCouponInput) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError("Kupon");

    const nextDiscountType = input.discountType ?? coupon.discountType;
    const nextDiscountValue = input.discountValue ?? coupon.discountValue;
    if (
      nextDiscountType === "PERCENTAGE" &&
      (nextDiscountValue < 1 || nextDiscountValue > 100)
    ) {
      throw new ValidationError("Yüzdelik indirim 1-100 arasında olmalı", {
        discountValue: ["Yüzdelik indirim 1-100 arasında olmalı"],
      });
    }

    try {
      return await prisma.coupon.update({
        where: { id },
        data: {
          ...(input.code !== undefined && { code: input.code }),
          ...(input.discountType !== undefined && {
            discountType: input.discountType,
          }),
          ...(input.discountValue !== undefined && {
            discountValue: input.discountValue,
          }),
          ...(input.minOrderAmount !== undefined && {
            minOrderAmount: input.minOrderAmount,
          }),
          ...(input.maxUsage !== undefined && { maxUsage: input.maxUsage }),
          ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        include: couponInclude,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Bu kupon kodu zaten mevcut");
      }
      throw err;
    }
  },

  remove: async (id: string) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError("Kupon");

    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  },

  restore: async (id: string) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError("Kupon");
    if (coupon.isActive) throw new ConflictError("Bu kupon zaten aktif");

    return prisma.coupon.update({
      where: { id },
      data: { isActive: true },
      include: couponInclude,
    });
  },

  findDeleted: async () => {
    return prisma.coupon.findMany({
      where: { isActive: false },
      include: couponInclude,
      orderBy: { createdAt: "desc" },
    });
  },
};
