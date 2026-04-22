import z from "zod";
import { nameSchema, paginationSchema } from "./commonSchemas.js";

export const createProductSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(1000).optional(),
  price: z
    .number({ error: "Fiyat sayı olmalıdır" })
    .int("Fİyat tam sayı olmalıdır (kuruş)")
    .positive("Fiyat 0'dan büyük olmalıdır"),
  stock: z
    .number()
    .int("Stok tam sayı olmalıdır")
    .nonnegative("Stok negatif olamaz")
    .default(0),

  categoryId: z.string().uuid("Geçersiz kategori ID").optional(),
  producerId: z.string().uuid("Geçersiz üretici ID").optional(),
  tagIds: z.array(z.string().uuid("Geçersiz etiket ID")).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = paginationSchema
  .extend({
    search: z.string().min(1).max(100).optional(),
    categoryId: z.string().uuid("Geçersiz kategori ID").optional(),
    producerId: z.string().uuid("Geçersiz üretici ID").optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    sort:z.enum(["name","price","stock","createdAt","updateAt"]).default("createdAt"),
    order:z.enum(["asc", "desc"]).default("desc")
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    { message: "minPrice, maxPrice'dan büyük olamaz", path: ["minPrice"] },
  );

export const tagIdsSchema = z.object({
  tagIds: z
    .array(z.string().uuid("Geçersiz etiket ID"))
    .min(1, "En az 1 etiket ID'si gereklidir"),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type TagIdsInput = z.infer<typeof tagIdsSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
