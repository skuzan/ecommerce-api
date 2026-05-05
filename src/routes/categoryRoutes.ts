import { Router, type Router as ExpressRouter } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/categorySchemas.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router: ExpressRouter = Router();

//! 1. Statik Route
router.get("/", categoryController.getAll);
router.get("/deleted",authenticate, authorize("ADMIN"), categoryController.getDeleted);

//! 2. Veri Girişi Route

router.post("/", authenticate,  authorize("ADMIN"), validateBody(createCategorySchema), categoryController.create);

//! 3. Dinamik Route
router.get("/:id", validateParams(idParamSchema), categoryController.getById);
router.put(
  "/:id",authenticate,  authorize("ADMIN"),
  validateParams(idParamSchema),
  validateBody(updateCategorySchema),
  categoryController.update,
);
router.delete(
  "/:id",authenticate,  authorize("ADMIN"),
  validateParams(idParamSchema),
  categoryController.remove,
);
router.patch(
  "/:id/restore",authenticate,  authorize("ADMIN"),
  validateParams(idParamSchema),
  categoryController.restore,
);

export default router;
