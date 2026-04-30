import { Router, type Router as ExpressRouter } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/categorySchemas.js";
import { authenticate } from "../middlewares/authenticate.js";

const router: ExpressRouter = Router();

//! 1. Statik Route
router.get("/", categoryController.getAll);
router.get("/deleted",authenticate, categoryController.getDeleted);

//! 2. Veri Girişi Route

router.post("/", authenticate,validateBody(createCategorySchema), categoryController.create);

//! 3. Dinamik Route
router.get("/:id", validateParams(idParamSchema), categoryController.getById);
router.put(
  "/:id",authenticate,
  validateParams(idParamSchema),
  validateBody(updateCategorySchema),
  categoryController.update,
);
router.delete(
  "/:id",authenticate,
  validateParams(idParamSchema),
  categoryController.remove,
);
router.patch(
  "/:id/restore",authenticate,
  validateParams(idParamSchema),
  categoryController.restore,
);

export default router;
