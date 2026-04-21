import { Router, type Router as ExpressRouter } from "express";
import { productController } from "../controllers/productController.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.js";
import {
  createProductSchema,
  productQuerySchema,
  tagIdsSchema,
  updateProductSchema,
} from "../schemas/productSchemas.js";
import { idParamsSchema } from "../schemas/commonSchemas.js";

const router: ExpressRouter = Router();

router.get("/", validateQuery(productQuerySchema), productController.getAll);

router.get("/:id", validateParams(idParamsSchema), productController.getById);

router.post("/", validateBody(createProductSchema), productController.create);

router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateProductSchema),
  productController.update,
);

router.delete("/:id", validateParams(idParamsSchema), productController.remove);

router.post(
  "/:id/tags",
  validateParams(idParamsSchema),
  validateBody(tagIdsSchema),
  productController.addTags,
);

router.delete(
  "/:id/tags",
  validateParams(idParamsSchema),
  validateBody(tagIdsSchema),
  productController.removeTags,
);

router.put(
  "/:id/tags",
  validateParams(idParamsSchema),
  validateBody(tagIdsSchema),
  productController.setTags,
);

export default router;
