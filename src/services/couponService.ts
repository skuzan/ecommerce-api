import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import type {
  CreateCouponInput,
  UpdateCouponInput,
} from "../schemas/couponSchemas.js";

export const couponService = {
  // ====================================================================
  // validate — 4 katmanlı kontrol (Gün 47)
  // Sıra önemli: ÖNCE varlık (enumeration koruması), sonra koşullar.
  // ====================================================================
  validate: async (code: string, subtotal: number) => {
    // 0) Normalize — case-insensitive lookup
    const normalizedCode = code.trim().toUpperCase();

    // 1) Kupon var mı? — yoksa 404 (enumeration koruması; 422 değil)
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });
    if (!coupon) throw new NotFoundError("Kupon");

    // 2) Aktif mi?
    if (!coupon.isActive) {
      throw new ValidationError("Bu kupon kullanılamaz", {
        code: ["Kupon devre dışı"],
      });
    }

    // 3) Süresi dolmuş mu?
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("Bu kuponun süresi geçti", {
        code: ["Kuponun süresi dolmuş"],
      });
    }

    // 4) Kullanım hakkı kaldı mı? (maxUsage null = sınırsız)
    if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
      throw new ValidationError("Bu kupon tükendi", {
        code: ["Maksimum kullanım sayısına ulaşıldı"],
      });
    }

    // 5) Minimum sipariş tutarı sağlanıyor mu?
    if (subtotal < coupon.minOrderAmount) {
      throw new ValidationError("Minimum sipariş tutarı sağlanmıyor", {
        code: [
          `Bu kupon için en az ${(coupon.minOrderAmount / 100).toFixed(2)} TL ` +
            `tutarında sipariş gerekli`,
        ],
      });
    }

    return coupon;
  },

  // ====================================================================
  // ADMIN CRUD
  // ====================================================================
  list: async () => {
    return prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  findById: async (id: string) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError("Kupon");
    return coupon;
  },

  create: async (input: CreateCouponInput) => {
    // exactOptionalPropertyTypes: yalnızca tanımlı opsiyonel alanları yaz.
    const data: Prisma.CouponCreateInput = {
      code: input.code.trim().toUpperCase(),
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount ?? 0,
    };
    if (input.maxUsage !== undefined) data.maxUsage = input.maxUsage;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    try {
      return await prisma.coupon.create({ data });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Bu kupon kodu zaten kullanılıyor");
      }
      throw err;
    }
  },

  update: async (id: string, input: UpdateCouponInput) => {
    const data: Prisma.CouponUpdateInput = {};
    if (input.code !== undefined) data.code = input.code.trim().toUpperCase();
    if (input.discountType !== undefined) data.discountType = input.discountType;
    if (input.discountValue !== undefined) data.discountValue = input.discountValue;
    if (input.minOrderAmount !== undefined) data.minOrderAmount = input.minOrderAmount;
    if (input.maxUsage !== undefined) data.maxUsage = input.maxUsage;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    try {
      return await prisma.coupon.update({ where: { id }, data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          throw new ConflictError("Bu kupon kodu zaten kullanılıyor");
        }
        if (err.code === "P2025") throw new NotFoundError("Kupon");
      }
      throw err;
    }
  },

  remove: async (id: string) => {
    try {
      // Hard delete — Cart.couponId onDelete: SetNull ile otomatik temizlenir.
      await prisma.coupon.delete({ where: { id } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new NotFoundError("Kupon");
      }
      throw err;
    }
  },
};
