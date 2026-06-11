import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(128, "JWT_ACCESS_SECRET en az 128 karakter olmalı"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(128, "JWT_REFRESH_SECRET en az 128 karakter olmalı"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("E-Ticaret API <noreply@ecommerce.local>"),
  // Verify/reset linklerinde kullanılır
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(5),
  UPLOAD_ALLOWED_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp")
    .transform((s) => s.split(",").map((t) => t.trim())),

  PAYMENT_WEBHOOK_SECRET: z.string().min(16),
  SHIPPING_WEBHOOK_SECRET: z.string().min(16),
  LOG_LEVEL: z.enum(["http", "info", "warn", "error", "debug"]).default("http"),
});

const sonuc = envSchema.safeParse(process.env);

if (!sonuc.success) {
  console.log("Ortam değişkenleri hatalı");
  console.log(sonuc.error.format());
  process.exit(1);
}

export const env = sonuc.data;
