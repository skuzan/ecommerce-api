import { Router, type Router as ExpressRouter } from "express";
import { producerController } from "../controllers/producerController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createProducerSchema,
  updateProducerSchema,
} from "../schemas/producerSchemas.js";

const router: ExpressRouter = Router();

//! 1. Statik Route
router.get("/", producerController.getAll);
router.get("/deleted", producerController.getDeleted)

//! 2. Veri Girişi Route
router.post("/", validateBody(createProducerSchema), producerController.create);

//! 3. Dinamik Route
router.get("/:id", validateParams(idParamSchema), producerController.getById);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateProducerSchema),
  producerController.update,
);
router.delete("/:id", validateParams(idParamSchema), producerController.remove);
router.patch("/:id/restore", validateParams(idParamSchema), producerController.restore)

export default router;
