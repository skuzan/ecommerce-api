import { Router, type Router as ExpressRouter } from "express";
import { cartController } from "../controllers/cartController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import {
  addCartItemSchema,
  applyCouponSchema,
  cartItemIdParamSchema,
  updateCartItemSchema,
} from "../schemas/cartSchemas.js";

const router: ExpressRouter = Router();

router.use(authenticate);

router.get("/", cartController.get);
router.delete("/", cartController.clear);
router.post("/items", validateBody(addCartItemSchema), cartController.addItem);
router.put(
  "/items/:itemId",
  validateParams(cartItemIdParamSchema),
  validateBody(updateCartItemSchema),
  cartController.updateItem,
);
router.delete(
  "/items/:itemId",
  validateParams(cartItemIdParamSchema),
  cartController.removeItem,
);
router.post(
  "/coupon",
  validateBody(applyCouponSchema),
  cartController.applyCoupon,
);
router.delete("/coupon", cartController.removeCoupon);

export default router;
