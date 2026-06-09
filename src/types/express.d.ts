import type { Role } from "../generated/prisma/client.ts";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: Role
            }
            idempotencyKey?: string;
        }
    }
}

export {}

