import type { Response, Request, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/authService.js";
import { sendSuccess } from "../utils/response.js";
import type { VerifyEmailInput } from "../schemas/authSchemas.js";

const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  sendSuccess(
    res,
    {
      user,
      message:
        "Kayıt başarılı! Email adresinizi doğrulamak için linke tıklayın.",
    },
    201,
  );
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = res.locals.validatedQuery as VerifyEmailInput;
  const result = await authService.verifyEmail(token);
  sendSuccess(res, result);
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.login(req.body);
  sendSuccess(res, {
    user,
    message: "Giriş başarılı",
  });
});

export const authController: {
  register: RequestHandler;
  verifyEmail: RequestHandler;
  login:RequestHandler
} = {
  register,
  verifyEmail,
  login
};
