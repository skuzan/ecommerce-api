import { Router, type Router as ExpressRouter } from "express";
import { tagController } from "../controllers/tagController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamsSchema } from "../schemas/commonSchemas.js";
import { createTagSchema, updateTagSchema } from "../schemas/tagSchemas.js";

const router: ExpressRouter = Router();

router.get("/", tagController.getAll);

router.get("/:id", validateParams(idParamsSchema), tagController.getById);

router.post("/", validateBody(createTagSchema), tagController.create);

router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateTagSchema),
  tagController.update,
);

router.delete("/:id", validateParams(idParamsSchema), tagController.remove);

export default router;
