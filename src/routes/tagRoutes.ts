import { Router, type Router as ExpressRouter } from "express";
import { tagController } from "../controllers/tagController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import { createTagSchema, updateTagSchema } from "../schemas/tagSchemas.js";
import { authenticate } from "../middlewares/authenticate.js";

const router: ExpressRouter = Router();

//! 1. Statik Route
router.get("/", tagController.getAll);
router.get("/deleted",authenticate, tagController.getDeleted);

//! 2. Veri Girişi Route
router.post("/", authenticate, validateBody(createTagSchema), tagController.create);

//! 3. Dinamik Route

router.get("/:id", validateParams(idParamSchema), tagController.getById);

router.put(
  "/:id", authenticate, 
  validateParams(idParamSchema),
  validateBody(updateTagSchema),
  tagController.update,
);

router.delete("/:id",authenticate, validateParams(idParamSchema), tagController.remove);

router.patch(
  "/:id/restore",authenticate,
  validateParams(idParamSchema),
  tagController.restore,
);

export default router;
