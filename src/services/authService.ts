import { prisma } from "../config/database.js";
import jwt from "jsonwebtoken";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../schemas/authSchemas.js";
import type { Role } from "../generated/prisma/client.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import type {
  RefreshTokenPayload,
  SessionContext,
} from "../types/authTypes.js";
import {
  hashToken,
  safeVerifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  comparePassword,
  DUMMY_HASH,
  hashPassword,
} from "../utils/password.js";
import crypto from "node:crypto";
import {
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "../utils/emailTemplates.js";
import { safeSendEmail } from "../utils/mailer.js";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; //24 saat
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; //7 gün

const issueTokens = async (
  user: { id: string; role: Role },
  session: SessionContext,
) => {
  const create = await prisma.refreshToken.create({
    data: {
      token: crypto.randomBytes(16).toString("hex"),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      userAgent: session.userAgent ?? null,
      ipAddress: session.ipAddress ?? null,
    },
  });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshTokenJWT = signRefreshToken({
    userId: user.id,
    tokenId: create.id,
  });

  await prisma.refreshToken.update({
    where: {
      id: create.id,
    },
    data: {
      token: hashToken(refreshTokenJWT),
    },
  });
  return {
    accessToken,
    refreshToken: refreshTokenJWT,
  };
};

export const authService = {
  register: async (input: RegisterInput) => {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError("Bu email adresi zaten kayıtlı");
    }

    const hashedPassword = await hashPassword(input.password);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        verificationToken: hashedToken,
        verificationTokenExpiry: new Date(
          Date.now() + VERIFICATION_TOKEN_TTL_MS,
        ),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

await safeSendEmail({
      to: user.email,
      subject: "Email Adresini Doğrula",
      html: verifyEmailTemplate(rawToken)
    })

    return user;
  },

  verifyEmail: async (rawToken: string) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ConflictError("Geçersiz veya Süresi dolmuş doğrulama linki");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
    return { verified: true };
  },

  login: async (input: LoginInput, session: SessionContext) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    const hashToCompare = user?.password ?? DUMMY_HASH;
    const passwordValid = await comparePassword(input.password, hashToCompare);

    if (!user || !passwordValid) {
      throw new UnauthorizedError("Email veya Şifre hatalı");
    }

    if (user.deletedAt) {
      throw new UnauthorizedError("Email veya Şifre hatalı");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Email veya Şifre hatalı");
    }

    if (!user.isVerified) {
      throw new UnauthorizedError(
        "Email adresi doğrulanmamış. Lütfen giriş için mail adresinizi doğrulayın",
      );
    }

    const tokens = await issueTokens({ id: user.id, role: user.role }, session);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  },
  refresh: async (rawToken: string, session: SessionContext) => {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Oturum süresi dolmuş. Lütfen tekrar giriş yapın",
        );
      }
      throw new UnauthorizedError("Geçersiz refresh token");
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!stored) throw new UnauthorizedError("Geçersiz refresh token");

    if (stored.token !== hashToken(rawToken)) {
      throw new UnauthorizedError("Geçersiz refresh token");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token süresi dolmuş");
    }

    if (stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      throw new UnauthorizedError(
        "Oturum güvenliği ihlali. Tüm oturumlarınız sonlandırıldı",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedError("Hesap geçersiz veya silinmiş");
    }

    const tokens = await issueTokens({ id: user.id, role: user.role }, session);

    const newPayload = verifyRefreshToken(tokens.refreshToken);

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: newPayload.tokenId },
    });

    return tokens;
  },

  logout: async (rawRefreshToken?: string) => {
    if (!rawRefreshToken) return;
    const payload = safeVerifyRefreshToken(rawRefreshToken);
    if (!payload) return;

    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId, revokedAt: null },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  logoutAll: async (userId: string) => {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  me: async (userId: string) => {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedError("Hesap Bulunamadı");
    return user;
  },

  listSession: async (userId: string) => {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  forgotPassword: async (input: ForgotPasswordInput) => {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (user && user.isActive && !user.deletedAt) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await safeSendEmail({
        to: user.email,
        subject: "Şifre Sıfırlama",
        html: resetPasswordTemplate(rawToken),
      });
    }
    return { message: " Sıfırlama Maili gönderildi." };
  },

  resetPassword: async (input: ResetPasswordInput) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(input.token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new UnauthorizedError("Geçersiz veya süresi dolmuş token");

    const hashedPassword = await hashPassword(input.password);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      message: "Şifre başarıyla sıfırlandı, Lütfen yeniden giriş yapın",
    };
  },

  resendVerification: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.isVerified && !user.deletedAt) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: hashedToken,
          verificationTokenExpiry: new Date(
            Date.now() + VERIFICATION_TOKEN_TTL_MS,
          ),
        },
      });

      await safeSendEmail({
        to: user.email,
        subject: "Email Adresini Doğrula (Yeniden)",
        html: verifyEmailTemplate(rawToken),
      });
    }
    return {
      message: "Eğer bu email kayıtlı ve doğrulanmamışsa yeni link gönderildi.",
    };
  },
};
