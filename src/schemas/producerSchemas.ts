import z from "zod";
import { nameSchema } from "./commonSchemas.js";

export const createProducerSchema = z.object({
  name: nameSchema(120),
  city: z
    .string({ error: "Şehir alanı metin olmalıdır" })
    .trim()
    .min(2, "Şehir alanı en az 2 karakter olmalıdır")
    .max(120, "Şehir alanı en fazla 120 karakter olmalıdır")
    .optional(),
});

export const updateProducerSchema = createProducerSchema.partial();
export type CreateProducerInput = z.infer<typeof createProducerSchema>;
export type UpdateProducerInput = z.infer<typeof updateProducerSchema>;
