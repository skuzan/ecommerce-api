import { z } from "zod";

const stringSchema = z.string().min(2).max(100);

// console.log(stringSchema.parse("ali"))

const emailSchema = z.string().email();

// console.log(emailSchema.parse("talha@x.com"))

const idSchema = z.string().uuid();

// console.log(idSchema.parse("a7486dad-0156-4d7e-9132"))

const urlSchema = z.string().url();

// console.log(urlSchema.parse("h:/abc"))

// const priceSchema = z
//   .number()
//   .int("Fiyat tam sayı olmalı")
//   .positive("Fiyat 0 dan büyük olmalı");

// // console.log(priceSchema.parse(150003))

// const passwordSchema = z
//   .string()
//   .trim()
//   .min(6)
//   .max(12)
//   .regex(
//     /^[a-z0-9-]+$/,
//     "Şifre küçük harf, rakam ve (-) işareti olması gerekir",
//   );

// // console.log(passwordSchema.parse("123asd-C"))

// const schema = z.object({
//   page: z.number(),
// });

// // console.log(schema.parse({ page: 2 }));

// const querySchema = z.object({
//     page:z.coerce.number().int().min(1).default(1),
//     limit:z.coerce.number().int().min(1).max(50).default(10)
// })

// const result = querySchema.parse({
//     page:"2",
//     limit:"25"
// })

// console.log(result)
// const userSchema = z.object({
//     name:z.string(),
//     age:z.number(),
//     email:z.string(),
// })

// const result = userSchema.parse({
//     name:"Ali",
//     age:23,
//     email:"ali@test.com"
// })

// // console.log(result)

// const productSchema = z.object({
//     name:z.string(),
//     description:z.string().optional(),
//     price:z.number(),
//     stock:z.number().default(0),
//     isActive:z.boolean().default(true)
// })

// type CreateProductInput = z.infer<typeof productSchema>

// const data = productSchema.parse({
//     name:"KAşar",
//     price:100,
//     description:"Açıklama",
//     isActive:true
// })

// console.log(data)



// const priceSchema = z.number().int().positive().refine((val) => val % 100 === 0, "Fiyat 100 ün katları şeklinde olmalı")

// console.log(priceSchema.parse(150200))