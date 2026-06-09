import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/database.js";
import type { PaymentWebhookInput } from "../schemas/webhookSchemas.js";
import type { WebhookController } from "../types/controllerTypes.js";

const payment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, status } = req.body as PaymentWebhookInput;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true },
  });

  if (!order) {
    res.status(404).json({ message: "Sipariş bulunamadı" });
    return;
  }

  if (order.paymentStatus === status) {
    res.status(200).json({ received: true, alreadyUpdated: true });
    return;
  }

  if (order.paymentStatus !== "PENDING") {
    res.status(409).json({ error: "Geçersiz ödeme durumu geçişi" });
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: status,
      ...(status === "PAID" && { status: "PROCESSING" }),
    },
  });

  res.status(200).json({ received: true });
});

export const webhookController: WebhookController = {
  payment,
};
