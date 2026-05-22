import { Router, type Router as ExpressRouter } from "express";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.js";
import {
  reviewListQuerySchema,
  upsertReviewSchema,
} from "../schemas/reviewSchemas.js";
import { reviewController } from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router: ExpressRouter = Router();

router.get(
  "/products/:id",
  validateParams(idParamSchema),
  validateQuery(reviewListQuerySchema),
  reviewController.list,
);

router.get(
  "/products/:id/stats",
  validateParams(idParamSchema),
  reviewController.stats,
);

router.post(
  "/products/:id",
  authenticate,
  validateParams(idParamSchema),
  validateBody(upsertReviewSchema),
  reviewController.upsert,
);

router.delete(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  reviewController.remove,
);


export default router;
