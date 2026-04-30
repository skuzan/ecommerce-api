import type { RequestHandler } from "express"
import { UnauthorizedError } from "../utils/errors.js"
import { verifyAccessToken } from "../utils/jwt.js"

const BEARER_PREFIX = "Bearer"

export const authenticate: RequestHandler = (req, _res, next) => {
    const header = req.get("authorization")
    if (!header?.startsWith(BEARER_PREFIX)) {
        throw new UnauthorizedError("Access token eksik")
    }

    const token = header.slice(BEARER_PREFIX.length).trim()
    if (!token) throw new UnauthorizedError("Access token eksik")
    const payload = verifyAccessToken(token)
    req.user = { userId: payload.userId, role: payload.role }
    next()
}