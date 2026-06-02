import { Router, type Router as ExpressRouter } from "express";
import { couponController } from "../controllers/couponController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createCouponSchema,
  updateCouponSchema,
} from "../schemas/couponSchemas.js";

const router: ExpressRouter = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", couponController.getAll);
router.get("/deleted", couponController.getDeleted);
router.post("/", validateBody(createCouponSchema), couponController.create);
router.get("/:id", validateParams(idParamSchema), couponController.getById);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateCouponSchema),
  couponController.update,
);
router.delete("/:id", validateParams(idParamSchema), couponController.remove);
router.patch(
  "/:id/restore",
  validateParams(idParamSchema),
  couponController.restore,
);

export default router;
