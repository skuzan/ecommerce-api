import { Router, type Router as ExpressRouter } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamsSchema } from "../schemas/commonSchemas.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/categorySchemas.js";

const router: ExpressRouter = Router();

router.get("/", categoryController.getAll);
router.get("/:id", validateParams(idParamsSchema), categoryController.getById);
router.post("/", validateBody(createCategorySchema), categoryController.create);
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateCategorySchema),
  categoryController.update,
);
router.delete("/:id", validateParams(idParamsSchema), categoryController.remove);

export default router;
