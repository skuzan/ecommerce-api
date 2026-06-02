import { z } from "zod/v4";

const discountTypeSchema = z.enum(["PERCENTAGE", "FIXED"]);

const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .transform((value) => value.toUpperCase()),
  discountType: discountTypeSchema,
  discountValue: z.number().int().positive("İndirim değeri pozitif olmalı"),
  minOrderAmount: z.number().int().nonnegative("Minimum tutar negatif olamaz"),
  maxUsage: z
    .number()
    .int()
    .positive("Kullanım limiti pozitif olmalı")
    .nullable(),
  expiresAt: z.coerce.date().nullable(),
  isActive: z.boolean(),
});

export const createCouponSchema = couponBaseSchema
  .extend({
    minOrderAmount: z
      .number()
      .int()
      .nonnegative("Minimum tutar negatif olamaz")
      .default(0),
    maxUsage: z
      .number()
      .int()
      .positive("Kullanım limiti pozitif olmalı")
      .nullable()
      .optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.discountType !== "PERCENTAGE" ||
      (data.discountValue >= 1 && data.discountValue <= 100),
    {
      message: "Yüzdelik indirim 1-100 arasında olmalı",
      path: ["discountValue"],
    },
  );

export const updateCouponSchema = couponBaseSchema.partial().refine(
  (data) =>
    data.discountType !== "PERCENTAGE" ||
    data.discountValue === undefined ||
    (data.discountValue >= 1 && data.discountValue <= 100),
  {
    message: "Yüzdelik indirim 1-100 arasında olmalı",
    path: ["discountValue"],
  },
);

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
