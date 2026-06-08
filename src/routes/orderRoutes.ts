import { Router, type Router as ExpressRouter } from "express";
import { orderController } from "../controllers/orderController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireIdempotencyKey } from "../middlewares/idempotency.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { createOrderSchema } from "../schemas/orderSchemas.js";
import { idParamSchema } from "../schemas/commonSchemas.js";

const router: ExpressRouter = Router();

router.post(
  "/",
  authenticate,
  requireIdempotencyKey,
  validateBody(createOrderSchema),
  orderController.create,
);

router.get("/", authenticate, orderController.list);
router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  orderController.getById,
);

export default router;
