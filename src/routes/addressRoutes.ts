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

// Tüm adres endpoint'leri authenticated — adresler kullanıcıya özel kaynak.
router.get("/", authenticate, addressController.list);

router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  addressController.getById,
);

router.post(
  "/",
  authenticate,
  validateBody(createAddressSchema),
  addressController.create,
);

router.put(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateAddressSchema),
  addressController.update,
);

router.patch(
  "/:id/set-default",
  authenticate,
  validateParams(idParamSchema),
  addressController.setDefault,
);

router.delete(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  addressController.remove,
);

export default router;
