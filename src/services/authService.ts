import { prisma } from "../config/database.js";
import type { LoginInput, RegisterInput } from "../schemas/authSchemas.js";
import type { Role } from "../generated/prisma/client.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import type { SessionContext } from "../types/authTypes.js";
import { hashToken, signAccessToken, signRefreshToken } from "../utils/jwt.js";
import {
  comparePassword,
  DUMMY_HASH,
  hashPassword,
} from "../utils/password.js";
import crypto from "node:crypto";

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

    // email verificationURL 36.gün
    const verificationUrl = `/verify-email?token=${rawToken}`;
    console.log(`📧 To: ${user.email}`);
    console.log(`📧 URL: ${verificationUrl}`);
    console.log(`📧 Token: ${rawToken}`);

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
};
