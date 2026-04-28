import z from "zod/v4";
import { nameSchema } from "./commonSchemas.js";

export const registerSchema = z
  .object({
    email: z
      .string({ error: "Email metin olmalıdır" })
      .trim()
      .toLowerCase()
      .email("Geçerli bir email adresi girin"),
    password: z
      .string({ error: "Şifre metin olmalıdır" })
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(100, "Şifre en fazla 100 karakter olabilir")
      .regex(/[A-Z]/, "En az bir büyük harf içermelidir")
      .regex(/[a-z]/, "En az bir küçük harf içermelidir")
      .regex(/[0-9]/, "En az bir rakam içermelidir"),

    confirmPassword: z.string(),

    name: nameSchema(100),
  })
  .refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  },
);


export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().length(64, "Geçersiz doğrulama token'ı"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli email girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export type LoginInput = z.infer<typeof loginSchema>;
