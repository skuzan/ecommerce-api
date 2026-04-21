import z from "zod";
import { nameSchema, slugSchema } from "./commonSchemas.js";

export const createCategorySchema = z.object({
  name: nameSchema(100),
  slug: slugSchema
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
