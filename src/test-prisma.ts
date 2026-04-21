import "dotenv/config";
import { prisma } from "./config/database.js";
import { Role } from "./generated/prisma/enums.js";

async function main() {
  console.log("🔌 Veritabanına bağlanılıyor...");

  // const product = await prisma.product.create({
  //   data:{
  //     name:"Ezine Peyniri 3",
  //     description:"Tam yağlı geleneksel üretim",
  //     price:15000,
  //     stock:100
  //   }
  // })

  // console.log(product.id);
  // console.log(product.isActive)
  // console.log(product.createdAt)

  // const result = await prisma.product.createMany({
  //   data: [
  //     { name: "Peynir 1", price: 20000, stock: 50 },
  //     { name: "Peynir 2", price: 20000, stock: 50 },
  //     { name: "Peynir 3", price: 20000, stock: 50 },
  //     { name: "Peynir 4", price: 20000, stock: 50 },
  //   ],
  //   skipDuplicates: true,
  // });

  // console.log(result.count);

  // const all = await prisma.product.findMany()

  // const filtered = await prisma.product.findMany({
  //   where :{
  //     isActive:true
  //   }
  // })

  // const filtered = await prisma.product.findMany({
  //   select: {
  //     id: true,
  //     name: true,
  //   },
  // });

  // const one = await prisma.product.findUnique({
  //   where: { id: "6445656a-1007-40e5-85e1-0230b01f9805" },
  // });

  // const updated = await prisma.product.update({
  //   where: { id: "6445656a-1007-40e5-85e1-0230b01f9805" },
  //   data: { price: 17500 },
  // });

  // const deleted = await prisma.product.delete({
  //   where: {
  //     id: "98a0ac96-a03e-4757-9a47-3128d10db2ef",
  //   },
  // });

  // const updated = await prisma.product.update({
  //   where: { id: "81329703-4cc5-46d5-a446-8cf3256c933e" },
  //   data: { deletedAt: new Date(),
  //     isActive:false
  //    },
  // });

  // console.log(updated);

  // const category = await prisma.category.create({
  //   data:{
  //     name:"Peynir",
  //     slug:"peynir"
  //   }
  // })

  // console.log(category)

  // const product = await prisma.product.create({
  //   data:{
  //     name:"Ezine Peyniri",
  //     price:15000,
  //     stock:50,
  //     categoryId:category.id
  //   }
  // })
  // console.log(product)

  // const categoryProduct = await prisma.category.create({
  //   data: {
  //     name: "Bakliyat",
  //     slug: "bakliyat",
  //     products: {
  //       create: [
  //         {
  //           name: "Nohut",
  //           price: 5000,
  //           stock: 50,
  //         },
  //         {
  //           name: "Mercimek",
  //           price: 6000,
  //           stock: 60,
  //         },
  //       ],
  //     },
  //   },
  // });

  // console.log(categoryProduct);

  // const organik = await prisma.tag.create({
  //   data :{name:"Organik"}
  // })

  // console.log(organik)

  // const product = await prisma.product.update({
  //   where: { id: "42959d84-787b-4481-96c8-c12ad2832e15" },
  //   data: {
  //     tags: {
  //       disconnect: [{ id: "03da4274-3596-4f71-bca6-90ef20b6bb17" }],
  //     },
  //   },
  //   include: { tags: true },
  // });
  // console.log(product);

  // const user = await prisma.user.create({
  //   data :{
  //     email:"talha@talhaseven.com",
  //     name:"Talha",
  //     password:"simdilik-sifre"
  //   }
  // })
  const user = await prisma.user.create({
    data :{
      email:"admin@talhaseven.com",
      name:"Admin",
      password:"simdilik-sifre",
      role:Role.ADMIN
    }
  })


  console.log(user)

  await prisma.$disconnect();
}

main().catch(console.error);
