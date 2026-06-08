import { Router, type Router as ExpressRouter } from "express";
import { couponController } from "../controllers/couponController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "../schemas/couponSchemas.js";

const router: ExpressRouter = Router();

// Tüm giriş yapmış kullanıcılar: "bu kupon sepetime uyar mı" ön kontrolü.
router.post(
  "/validate",
  authenticate,
  validateBody(validateCouponSchema),
  couponController.validate,
);

// ADMIN — kupon yönetimi (list / create / update / delete)
router.get("/", authenticate, authorize("ADMIN"), couponController.list);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateBody(createCouponSchema),
  couponController.create,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  validateBody(updateCouponSchema),
  couponController.update,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  couponController.remove,
);

export default router;
