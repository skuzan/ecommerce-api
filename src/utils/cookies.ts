import type { Response } from "express";
import { env } from "../config/env.js";

const REFRESH_COOKIE = "refreshToken";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const setRefreshCookie = (res: Response, token: string) => {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SEVEN_DAYS_MS,
        path: "/"
    })
}
export const clearRefreshCookie = (res: Response) => {
    res.clearCookie(REFRESH_COOKIE, { path: "/" })
}

export const COOKIE_NAME = REFRESH_COOKIE