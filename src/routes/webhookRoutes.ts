import { Router, type Router as ExpressRouter } from "express";
import { webhookController } from "../controllers/webhookController.js";
import { verifyWebhookSecret } from "../middlewares/webhookSecret.js";
import { validateBody } from "../middlewares/validate.js";
import { paymentWebhookSchema, shippingWebhookSchema } from "../schemas/webhookSchemas.js";
import { env } from "../config/env.js";


const router: ExpressRouter = Router();

router.post(
  "/payment",
  verifyWebhookSecret(env.PAYMENT_WEBHOOK_SECRET),
  validateBody(paymentWebhookSchema),
  webhookController.payment,
);


router.post(
  "/shipping",
  verifyWebhookSecret(env.SHIPPING_WEBHOOK_SECRET),
  validateBody(shippingWebhookSchema),
  webhookController.shipping,
);

export default router;
