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
import { idParamSchema } from "../schemas/commonSchemas.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router: ExpressRouter = Router();

//! 1. Statik Route

router.get("/", validateQuery(productQuerySchema), productController.getAll);
router.get("/deleted", authenticate, authorize("ADMIN"), productController.getDeleted);

//! 2. Veri Girişi Route

router.post("/", authenticate, authorize("ADMIN"), validateBody(createProductSchema), productController.create);

//! 3. Dinamik Route
router.get("/:id", validateParams(idParamSchema), productController.getById);

router.put(
  "/:id",authenticate,  authorize("ADMIN", "PRODUCER"),
  validateParams(idParamSchema),
  validateBody(updateProductSchema),
  productController.update,
);
router.delete("/:id", authenticate,  authorize("ADMIN", "PRODUCER"), validateParams(idParamSchema), productController.remove);
router.patch(
  "/:id/restore", authorize("ADMIN"), authenticate, 
  validateParams(idParamSchema),
  productController.restore,
);

//! 4. Alt Route

router.post(
  "/:id/tags", authenticate,  authorize("ADMIN", "PRODUCER"),
  validateParams(idParamSchema),
  validateBody(tagIdsSchema),
  productController.addTags,
);

router.delete(
  "/:id/tags",authenticate,  authorize("ADMIN", "PRODUCER"),
  validateParams(idParamSchema),
  validateBody(tagIdsSchema),
  productController.removeTags,
);

router.put(
  "/:id/tags", authenticate,  authorize("ADMIN", "PRODUCER"),
  validateParams(idParamSchema),
  validateBody(tagIdsSchema),
  productController.setTags,
);

export default router;
