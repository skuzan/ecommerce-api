import { z } from "zod/v4";

export const addCartItemSchema = z.object({
  productId: z.string().uuid("Geçersiz ürün ID formatı"),
  quantity: z.number().int().positive("Adet 0'dan büyük olmalı").default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Adet 0'dan büyük olmalı"),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
});

export const cartItemIdParamSchema = z.object({
  itemId: z.string().uuid("Geçersiz sepet ürünü ID formatı"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
