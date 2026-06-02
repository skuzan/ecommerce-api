import { z } from "zod/v4";

const addressBaseSchema = z.object({
  title: z.string().trim().min(2).max(60),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  fullAddress: z.string().trim().min(10).max(500),
  isDefault: z.boolean(),
});

export const createAddressSchema = addressBaseSchema.extend({
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressBaseSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
