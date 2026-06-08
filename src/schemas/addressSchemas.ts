import { z } from "zod/v4";

// Türkiye telefon formatı — başında 0 veya +90, ardından 10 rakam.
// Çok katı değil; UI tarafı bu regex'i ayrıca uygulayabilir.
const phoneRegex = /^(?:\+?90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

export const createAddressSchema = z.object({
  title: z
    .string({ error: "Başlık metin olmalı" })
    .trim()
    .min(1, "Başlık en az 1 karakter olmalı")
    .max(50, "Başlık en fazla 50 karakter olabilir"),
  fullName: z
    .string({ error: "Ad soyad metin olmalı" })
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalı")
    .max(120, "Ad soyad en fazla 120 karakter olabilir"),
  phone: z
    .string({ error: "Telefon metin olmalı" })
    .trim()
    .regex(phoneRegex, "Geçerli bir Türkiye cep telefonu girin"),
  city: z
    .string({ error: "İl metin olmalı" })
    .trim()
    .min(2, "İl en az 2 karakter olmalı")
    .max(60, "İl en fazla 60 karakter olabilir"),
  district: z
    .string({ error: "İlçe metin olmalı" })
    .trim()
    .min(2, "İlçe en az 2 karakter olmalı")
    .max(60, "İlçe en fazla 60 karakter olabilir"),
  fullAddress: z
    .string({ error: "Adres metin olmalı" })
    .trim()
    .min(10, "Adres en az 10 karakter olmalı")
    .max(500, "Adres en fazla 500 karakter olabilir"),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = createAddressSchema.partial();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
