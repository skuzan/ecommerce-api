import type { Role } from "../generated/prisma/client.js";


export interface AccessTokenPayload {
    userId: string;
    role: Role
}


export interface RefreshTokenPayload {
    userId: string;
    tokenId: string //DB deki 
}

export interface SessionContext {
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
}