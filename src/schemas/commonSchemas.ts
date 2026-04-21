import { z } from "zod/v4";

export const idParamSchema = z.object({
  id: z.string().uuid("Geçersiz ID formatı"),
});

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("Sayfa numarası tam sayı olmalı")
    .positive("Sayfa numarası pozitif olmalı")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit tam sayı olmalı")
    .positive("Limit pozitif olmalı")
    .max(100, "Limit en fazla 100 olabilir")
    .default(10),
});

export const nameSchema = (maxLength = 100) =>
  z
    .string({ error: "İsim alanı metin olmalıdır" })
    .trim()
    .min(2, "İsim en az 2 karakter olmalı")
    .max(maxLength, `İsim en fazla ${maxLength} karakter olabilir`);

export const slugSchema = z
  .string()
  .max(120)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug sadece küçük harf, rakam ve tire içermeli",
  )
  .optional();

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
