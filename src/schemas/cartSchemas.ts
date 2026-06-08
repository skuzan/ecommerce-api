import { z } from "zod/v4";

// POST /api/v1/cart/items — sepete ürün ekle (upsert: varsa quantity++)
export const addItemSchema = z.object({
  productId: z.string().uuid("Geçersiz ürün ID formatı"),
  quantity: z
    .number({ error: "Miktar sayı olmalı" })
    .int("Miktar tam sayı olmalı")
    .min(1, "Miktar en az 1 olmalı")
    .max(1000, "Miktar en fazla 1000 olabilir")
    .default(1),
});

export type AddItemInput = z.infer<typeof addItemSchema>;

// PUT /api/v1/cart/items/:id — satır miktarını değiştir (price snapshot'a dokunulmaz)
export const updateItemSchema = z.object({
  quantity: z
    .number({ error: "Miktar sayı olmalı" })
    .int("Miktar tam sayı olmalı")
    .min(1, "Miktar en az 1 olmalı")
    .max(1000, "Miktar en fazla 1000 olabilir"),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// POST /api/v1/cart/apply-coupon — sepete kupon uygula
export const applyCouponSchema = z.object({
  code: z
    .string({ error: "Kupon kodu metin olmalı" })
    .trim()
    .min(1, "Kupon kodu boş olamaz")
    .max(50, "Kupon kodu en fazla 50 karakter olabilir"),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
