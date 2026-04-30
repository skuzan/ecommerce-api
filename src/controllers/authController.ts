import type { Response, Request} from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/authService.js";
import { sendSuccess } from "../utils/response.js";
import type { VerifyEmailInput } from "../schemas/authSchemas.js";
import type { AuthController } from "../types/controllerTypes.js";
import { clearRefreshCookie, COOKIE_NAME, setRefreshCookie } from "../utils/cookies.js";
import { UnauthorizedError } from "../utils/errors.js";

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
  const { accessToken, refreshToken, user } = await authService.login(req.body, {
    userAgent: req.get("user-agent") ?? undefined,
    ipAddress: req.ip
  });
  setRefreshCookie(res, refreshToken)
  sendSuccess(res, { user, accessToken });
});

const refresh = asyncHandler(async (req: Request, res: Response) => {
 const rawToken = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!rawToken) {
    throw new UnauthorizedError("Refresh Token bulunamadı")
  }

  const { accessToken, refreshToken } = await authService.refresh(rawToken, {
    userAgent: req.get("user-agent") ?? undefined,
    ipAddress: req.ip
  })
  setRefreshCookie(res, refreshToken)
  sendSuccess(res, { accessToken })
})

const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[COOKIE_NAME] as string | undefined
  await authService.logout(rawToken)
  clearRefreshCookie(res)
  sendSuccess(res, { message: "Çıkış Başarılı!" })
})

const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user!.userId)
  clearRefreshCookie(res)
  sendSuccess(res, { message: "Tüm Cihazlardan Çıkış Başarılı!" })
})

const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.userId)
  sendSuccess(res, { user })
})

const session = asyncHandler(async (req: Request, res: Response) => {
  const list = await authService.listSession(req.user!.userId)
  sendSuccess(res, { session: list })
})

export const authController: AuthController = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  session
};
