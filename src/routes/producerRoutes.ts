import { Router, type Router as ExpressRouter } from "express";
import { producerController } from "../controllers/producerController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createProducerSchema,
  updateProducerSchema,
} from "../schemas/producerSchemas.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js"


const router: ExpressRouter = Router();

//! 1. Statik Route
router.get("/", producerController.getAll);
router.get("/deleted",authenticate, authorize("ADMIN"), producerController.getDeleted)

//! 2. Veri Girişi Route
router.post("/", authenticate, authorize("ADMIN"), validateBody(createProducerSchema), producerController.create);

//! 3. Dinamik Route
router.get("/:id", validateParams(idParamSchema), producerController.getById);
router.put(
  "/:id",authenticate, authorize("ADMIN"),
  validateParams(idParamSchema),
  validateBody(updateProducerSchema),
  producerController.update,
);
router.delete("/:id",authenticate, authorize("ADMIN"), validateParams(idParamSchema), producerController.remove);
router.patch("/:id/restore",authenticate, authorize("ADMIN"), validateParams(idParamSchema), producerController.restore)

export default router;
