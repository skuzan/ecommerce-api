import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/database.js";
import type {
  PaymentWebhookInput,
  ShippingWebhookInput,
} from "../schemas/webhookSchemas.js";
import type { WebhookController } from "../types/controllerTypes.js";
import { sendSuccess } from "../utils/response.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import { canTransition } from "../utils/orderStateMachine.js";

const payment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, status } = req.body as PaymentWebhookInput;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true },
  });
  if (!order) throw new NotFoundError("Sipariş");

  if (order.paymentStatus === status) {
    sendSuccess(res, { received: true, alreadyApplied: true });
    return;
  }

  if (order.paymentStatus !== "PENDING") {
    throw new ConflictError("Geçersiz ödeme durumu geçişi");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: status,
      ...(status === "PAID" && { status: "PROCESSING" }),
    },
  });

  sendSuccess(res, { received: true });
});

const shipping = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, status, trackingNumber } = req.body as ShippingWebhookInput;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) throw new NotFoundError("Sipariş");

  if (!canTransition(order.status, status)) {
    throw new ConflictError("Geçersiz sipariş durumu geçişi");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(trackingNumber && { trackingNumber }),
    },
  });

  sendSuccess(res, { received: true });
});

export const webhookController: WebhookController = {
  payment,
  shipping,
};
