import { Router, type Router as ExpressRouter } from "express";
import { cartController } from "../controllers/cartController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  addItemSchema,
  applyCouponSchema,
  updateItemSchema,
} from "../schemas/cartSchemas.js";

const router: ExpressRouter = Router();

// Tüm sepet endpoint'leri authenticated — sepet kullanıcıya özel kaynak.

router.get("/", authenticate, cartController.get);

router.post(
  "/items",
  authenticate,
  validateBody(addItemSchema),
  cartController.addItem,
);

router.put(
  "/items/:id",
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateItemSchema),
  cartController.updateItem,
);

router.delete(
  "/items/:id",
  authenticate,
  validateParams(idParamSchema),
  cartController.removeItem,
);

router.post(
  "/apply-coupon",
  authenticate,
  validateBody(applyCouponSchema),
  cartController.applyCoupon,
);

router.delete("/coupon", authenticate, cartController.removeCoupon);

export default router;
