import { Router, type Router as ExpressRouter } from "express";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { loginSchema, registerSchema, verifyEmailSchema } from "../schemas/authSchemas.js";
import { authController } from "../controllers/authController.js";

const router: ExpressRouter = Router();

router.post("/register", validateBody(registerSchema), authController.register);

router.post(
  "/verify-email",
  validateQuery(verifyEmailSchema),
  authController.verifyEmail,
);

router.post("/login", validateBody(loginSchema), authController.login)

export default router;