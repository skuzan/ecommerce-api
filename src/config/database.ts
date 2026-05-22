import * as PrismaPgModule from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const { PrismaPg } = PrismaPgModule;

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query","info", "warn", "error"], // Geliştirme sırasında sorguları görmek için "query" ekleyelim
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
