import { z } from "zod/v4";

export const paymentWebhookSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PAID", "FAILED"]),
});
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;