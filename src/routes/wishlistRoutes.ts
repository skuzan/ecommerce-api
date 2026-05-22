import { Router, type Router as ExpressRouter } from "express";
import { wishlistController } from "../controllers/wishlistController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateParams } from "../middlewares/validate.js";
import { productIdParamSchema } from "../schemas/reviewSchemas.js";

const router: ExpressRouter = Router();

router.get("/", authenticate, wishlistController.list);

router.post(
  "/:productId",
  authenticate,
  validateParams(productIdParamSchema),
  wishlistController.add,
);

router.delete(
  "/:productId",
  authenticate,
  validateParams(productIdParamSchema),
  wishlistController.remove,
);

export default router;
