import type { RequestHandler } from "express";
import type { Role } from "../generated/prisma/client.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";


export const authorize = (...allowedRoles: Role[]): RequestHandler => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new UnauthorizedError("Önce giriş yapmalısınız")
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError("Bu işlem için yetkiniz yok")
        }

        next()
    }
}