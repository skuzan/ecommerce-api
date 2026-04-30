import { Router, type Router as ExpressRouter } from "express";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { loginSchema, registerSchema, verifyEmailSchema } from "../schemas/authSchemas.js";
import { authController } from "../controllers/authController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router: ExpressRouter = Router();

router.post("/register", validateBody(registerSchema), authController.register);

router.post(
  "/verify-email",
  validateQuery(verifyEmailSchema),
  authController.verifyEmail,
);

router.post("/login", validateBody(loginSchema), authController.login)

router.post("/refresh", authController.refresh)

router.post("/logout", authController.logout)

router.post("/logout-all", authenticate, authController.logoutAll)

router.post("/me", authenticate, authController.me)

router.post("/session", authenticate, authController.session)

export default router;