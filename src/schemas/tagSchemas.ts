import z from "zod";
import { nameSchema } from "./commonSchemas.js";

export const createTagSchema = z.object({
  name: nameSchema(80),
});

export const updateTagSchema = createTagSchema.partial();
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
