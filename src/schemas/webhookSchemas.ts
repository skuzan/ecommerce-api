import { z } from "zod/v4";

export const paymentWebhookSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PAID", "FAILED"]),
});
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;

export const shippingWebhookSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["SHIPPED", "DELIVERED"]),
  trackingNumber: z.string().min(1).optional(),
});
export type ShippingWebhookInput = z.infer<typeof shippingWebhookSchema>;