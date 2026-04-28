import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  JWT_ACCESS_SECRET: z.string().min(128, "JWT_ACCESS_SECRET en az 128 karakter olmalı"),
  JWT_REFRESH_SECRET: z.string().min(128, "JWT_REFRESH_SECRET en az 128 karakter olmalı"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
});

const sonuc = envSchema.safeParse(process.env);

if (!sonuc.success) {
  console.log("Ortam değişkenleri hatalı");
  console.log(sonuc.error.format())
  process.exit(1);
}

export const env = sonuc.data;
