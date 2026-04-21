import { Router, type Router as ExpressRouter } from "express";
import { producerController } from "../controllers/producerController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamsSchema } from "../schemas/commonSchemas.js";
import {
  createProducerSchema,
  updateProducerSchema,
} from "../schemas/producerSchemas.js";

const router: ExpressRouter = Router();

router.get("/", producerController.getAll);
router.get("/:id", validateParams(idParamsSchema), producerController.getById);
router.post("/", validateBody(createProducerSchema), producerController.create);
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateProducerSchema),
  producerController.update,
);
router.delete("/:id", validateParams(idParamsSchema), producerController.remove);

export default router;
