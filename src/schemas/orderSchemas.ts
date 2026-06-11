import { z } from "zod/v4";

export const createOrderSchema = z.object({
  addressId: z.string().uuid("Geçersiz adres ID formatı"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"]),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;