import { z } from "zod/v4";

// FIXED indirim için sağduyu üst limiti: 1.000.000 TL (kuruş cinsinden).
const MAX_FIXED_DISCOUNT = 100_000_000;

// Refine kuralları — hem create (tüm alanlar dolu) hem update (partial) için ortak.
// undefined kontrolleri sayesinde partial update'te eksik alanlar kuralı tetiklemez.
const percentageWithinLimit = (d: {
  discountType?: "PERCENTAGE" | "FIXED" | undefined;
  discountValue?: number | undefined;
}) =>
  d.discountType !== "PERCENTAGE" ||
  d.discountValue === undefined ||
  d.discountValue <= 100;

const fixedWithinLimit = (d: {
  discountType?: "PERCENTAGE" | "FIXED" | undefined;
  discountValue?: number | undefined;
}) =>
  d.discountType !== "FIXED" ||
  d.discountValue === undefined ||
  d.discountValue <= MAX_FIXED_DISCOUNT;

const expiryInFuture = (d: { expiresAt?: Date | undefined }) =>
  d.expiresAt === undefined || d.expiresAt.getTime() > Date.now();

// Temel kupon alanları — create ve update bu şekli paylaşır.
const couponObject = z.object({
  code: z
    .string({ error: "Kupon kodu metin olmalı" })
    .trim()
    .toUpperCase()
    .min(3, "Kupon kodu en az 3 karakter olmalı")
    .max(50, "Kupon kodu en fazla 50 karakter olabilir")
    .regex(/^[A-Z0-9]+$/, "Kupon kodu sadece büyük harf ve rakam içerebilir"),
  discountType: z.enum(["PERCENTAGE", "FIXED"], {
    error: "İndirim tipi PERCENTAGE veya FIXED olmalı",
  }),
  discountValue: z
    .number({ error: "İndirim değeri sayı olmalı" })
    .int("İndirim değeri tam sayı olmalı")
    .positive("İndirim değeri pozitif olmalı"),
  // Not: .default(0) BİLİNÇLİ olarak yok — couponObject hem create hem update
  // (.partial()) tarafından paylaşılıyor. Default burada olsaydı, sadece isActive
  // güncelleyen bir update bile minOrderAmount'ı 0'a sıfırlardı. Default'u
  // create servisinde (?? 0) uyguluyoruz.
  minOrderAmount: z
    .number({ error: "Minimum tutar sayı olmalı" })
    .int("Minimum tutar tam sayı olmalı (kuruş)")
    .nonnegative("Minimum tutar negatif olamaz")
    .optional(),
  maxUsage: z
    .number({ error: "Maksimum kullanım sayı olmalı" })
    .int("Maksimum kullanım tam sayı olmalı")
    .positive("Maksimum kullanım pozitif olmalı")
    .optional(),
  expiresAt: z.coerce.date({ error: "Geçersiz tarih" }).optional(),
  isActive: z.boolean().optional(),
});

export const createCouponSchema = couponObject
  .refine(percentageWithinLimit, {
    message: "Yüzde indirim 100'den büyük olamaz",
    path: ["discountValue"],
  })
  .refine(fixedWithinLimit, {
    message: "Sabit indirim üst limiti aşıyor",
    path: ["discountValue"],
  })
  .refine(expiryInFuture, {
    message: "Son kullanma tarihi gelecekte olmalı",
    path: ["expiresAt"],
  });

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

// Update — tüm alanlar opsiyonel; aynı refine kuralları yeniden uygulanır.
export const updateCouponSchema = couponObject
  .partial()
  .refine(percentageWithinLimit, {
    message: "Yüzde indirim 100'den büyük olamaz",
    path: ["discountValue"],
  })
  .refine(fixedWithinLimit, {
    message: "Sabit indirim üst limiti aşıyor",
    path: ["discountValue"],
  })
  .refine(expiryInFuture, {
    message: "Son kullanma tarihi gelecekte olmalı",
    path: ["expiresAt"],
  });

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

// POST /api/v1/coupons/validate — kupon ön kontrolü (apply etmeden)
export const validateCouponSchema = z.object({
  code: z
    .string({ error: "Kupon kodu metin olmalı" })
    .trim()
    .min(1, "Kupon kodu boş olamaz")
    .max(50, "Kupon kodu en fazla 50 karakter olabilir"),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
