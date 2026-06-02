import { Router, type Router as ExpressRouter } from "express";
import { addressController } from "../controllers/addressController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../schemas/commonSchemas.js";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../schemas/addressSchemas.js";

const router: ExpressRouter = Router();

router.use(authenticate);

router.get("/", addressController.getAll);
router.get("/deleted", addressController.getDeleted);
router.post("/", validateBody(createAddressSchema), addressController.create);
router.get("/:id", validateParams(idParamSchema), addressController.getById);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateAddressSchema),
  addressController.update,
);
router.delete("/:id", validateParams(idParamSchema), addressController.remove);
router.patch(
  "/:id/restore",
  validateParams(idParamSchema),
  addressController.restore,
);
router.patch(
  "/:id/default",
  validateParams(idParamSchema),
  addressController.setDefault,
);

export default router;
