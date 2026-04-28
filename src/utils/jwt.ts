import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/authTypes.js";
import { env } from "../config/env.js";

export const hashToken = (token:string) => {
    return crypto.createHash("sha256").update(token).digest("hex")
}
 
type ExpiresIn = NonNullable<SignOptions["expiresIn"]>

export const signAccessToken = (payload: AccessTokenPayload) => {
    const options: SignOptions = {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as ExpiresIn,
    }
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options)
}

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}
export const signRefreshToken = (payload: RefreshTokenPayload) => {
    const options: SignOptions = {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
    }
    return jwt.sign(payload, env.JWT_REFRESH_EXPIRES_IN, options)
}

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, env.JWT_REFRESH_EXPIRES_IN) as RefreshTokenPayload
}

