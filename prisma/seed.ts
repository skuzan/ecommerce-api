import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client.js"
import { env } from "../src/config/env.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed data oluşturuluyor...\n");

  // ═══════════════════════════════════════
  // 1. Kategoriler
  // ═══════════════════════════════════════
  console.log("📁 Kategoriler oluşturuluyor...");

  const peynir = await prisma.category.upsert({
    where: { slug: "peynir" },
    update: {},
    create: {
      name: "Peynir",
      slug: "peynir",
    },
  });

  const bakliyat = await prisma.category.upsert({
    where: { slug: "bakliyat" },
    update: {},
    create: {
      name: "Bakliyat",
      slug: "bakliyat",
    },
  });

  const zeytinyagi = await prisma.category.upsert({
    where: { slug: "zeytinyagi" },
    update: {},
    create: {
      name: "Zeytinyağı",
      slug: "zeytinyagi",
    },
  });

  const baharat = await prisma.category.upsert({
    where: { slug: "baharat" },
    update: {},
    create: {
      name: "Baharat",
      slug: "baharat",
    },
  });

  console.log(`  ✅ ${4} kategori oluşturuldu/güncellendi`);

  // ═══════════════════════════════════════
  // 2. Üreticiler
  // ═══════════════════════════════════════
  console.log("🏭 Üreticiler oluşturuluyor...");

  const canakkale = await prisma.producer.upsert({
    where: { name: "Çanakkale Çiftliği" },
    update: {},
    create: {
      name: "Çanakkale Çiftliği",
      city: "Çanakkale",
    },
  });

  const ege = await prisma.producer.upsert({
    where: { name: "Ege Doğal" },
    update: {},
    create: {
      name: "Ege Doğal",
      city: "İzmir",
    },
  });

  const guneydogu = await prisma.producer.upsert({
    where: { name: "Güneydoğu Lezzetleri" },
    update: {},
    create: {
      name: "Güneydoğu Lezzetleri",
      city: "Gaziantep",
    },
  });

  console.log(`  ✅ ${3} üretici oluşturuldu/güncellendi`);

  // ═══════════════════════════════════════
  // 3. Etiketler (Tags)
  // ═══════════════════════════════════════
  console.log("🏷️ Etiketler oluşturuluyor...");

  const tagOrganik = await prisma.tag.upsert({
    where: { name: "Organik" },
    update: {},
    create: { name: "Organik" },
  });

  const tagYerel = await prisma.tag.upsert({
    where: { name: "Yerel Üretim" },
    update: {},
    create: { name: "Yerel Üretim" },
  });

  const tagGlutensiz = await prisma.tag.upsert({
    where: { name: "Glutensiz" },
    update: {},
    create: { name: "Glutensiz" },
  });

  const tagVegan = await prisma.tag.upsert({
    where: { name: "Vegan" },
    update: {},
    create: { name: "Vegan" },
  });

  const tagDogal = await prisma.tag.upsert({
    where: { name: "Doğal" },
    update: {},
    create: { name: "Doğal" },
  });

  console.log(`  ✅ ${5} etiket oluşturuldu/güncellendi`);

  // ═══════════════════════════════════════
  // 4. Ürünler
  // ═══════════════════════════════════════
  console.log("📦 Ürünler oluşturuluyor...");

  await prisma.product.upsert({
    where: { name: "Ezine Peyniri" },
    update: {
      tags: { set: [{ id: tagOrganik.id }, { id: tagYerel.id }] },
    },
    create: {
      name: "Ezine Peyniri",
      description: "Tam yağlı, geleneksel Ezine peyniri. 6 ay dinlendirilmiş.",
      price: 15000, // 150.00 TL
      stock: 50,
      categoryId: peynir.id,
      producerId: canakkale.id,
      tags: {
        connect: [{ id: tagOrganik.id }, { id: tagYerel.id }],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: "Tulum Peyniri" },
    update: {
      tags: { set: [{ id: tagOrganik.id }, { id: tagDogal.id }] },
    },
    create: {
      name: "Tulum Peyniri",
      description: "Keçi sütünden, tulumda olgunlaştırılmış.",
      price: 20000, // 200.00 TL
      stock: 30,
      categoryId: peynir.id,
      producerId: canakkale.id,
      tags: {
        connect: [{ id: tagOrganik.id }, { id: tagDogal.id }],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: "Lor Peyniri" },
    update: {
      tags: { set: [{ id: tagDogal.id }] },
    },
    create: {
      name: "Lor Peyniri",
      description: "Taze lor peyniri, düşük yağlı.",
      price: 8000, // 80.00 TL
      stock: 100,
      categoryId: peynir.id,
      producerId: canakkale.id,
      tags: {
        connect: [{ id: tagDogal.id }],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: "Sızma Zeytinyağı" },
    update: {
      tags: {
        set: [
          { id: tagOrganik.id },
          { id: tagYerel.id },
          { id: tagVegan.id },
        ],
      },
    },
    create: {
      name: "Sızma Zeytinyağı",
      description: "Soğuk sıkım, ilk hasat zeytinyağı. 1 litre.",
      price: 35000, // 350.00 TL
      stock: 80,
      categoryId: zeytinyagi.id,
      producerId: ege.id,
      tags: {
        connect: [
          { id: tagOrganik.id },
          { id: tagYerel.id },
          { id: tagVegan.id },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: "Yeşil Mercimek" },
    update: {
      tags: {
        set: [
          { id: tagGlutensiz.id },
          { id: tagVegan.id },
          { id: tagDogal.id },
        ],
      },
    },
    create: {
      name: "Yeşil Mercimek",
      description: "Gaziantep'ten yeşil mercimek. 1 kg.",
      price: 4500, // 45.00 TL
      stock: 200,
      categoryId: bakliyat.id,
      producerId: guneydogu.id,
      tags: {
        connect: [
          { id: tagGlutensiz.id },
          { id: tagVegan.id },
          { id: tagDogal.id },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: "Kırmızı Pul Biber" },
    update: {
      tags: { set: [{ id: tagYerel.id }, { id: tagVegan.id }] },
    },
    create: {
      name: "Kırmızı Pul Biber",
      description: "İsot ve pul biber karışımı. 500 gr.",
      price: 12000, // 120.00 TL
      stock: 120,
      categoryId: baharat.id,
      producerId: guneydogu.id,
      tags: {
        connect: [{ id: tagYerel.id }, { id: tagVegan.id }],
      },
    },
  });

  console.log(`  ✅ ${6} ürün oluşturuldu/güncellendi`);

  // ═══════════════════════════════════════
  // 5. Test Kullanıcıları (Modül 5'e hazırlık)
  // ═══════════════════════════════════════
  console.log("👤 Test kullanıcıları oluşturuluyor...");

  await prisma.user.upsert({
    where: { email: "admin@ecommerce.com" },
    update: {},
    create: {
      email: "admin@ecommerce.com",
      name: "Admin User",
      password: "admin123", // Modül 5'te hash'lenecek!
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "producer@ecommerce.com" },
    update: {},
    create: {
      email: "producer@ecommerce.com",
      name: "Üretici Ali",
      password: "producer123",
      role: Role.PRODUCER,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@ecommerce.com" },
    update: {},
    create: {
      email: "customer@ecommerce.com",
      name: "Müşteri Ayşe",
      password: "customer123",
      role: Role.CUSTOMER,
    },
  });

  console.log(`  ✅ ${3} kullanıcı oluşturuldu/güncellendi`);

  // ═══════════════════════════════════════
  // Özet
  // ═══════════════════════════════════════
  console.log("\n🎉 Seed data başarıyla oluşturuldu!");
  console.log("────────────────────────────────");

  const stats = {
    categories: await prisma.category.count(),
    producers: await prisma.producer.count(),
    tags: await prisma.tag.count(),
    products: await prisma.product.count(),
    users: await prisma.user.count(),
  };

  console.log(`📊 Özet:`);
  console.log(`  - Kategoriler: ${stats.categories}`);
  console.log(`  - Üreticiler:  ${stats.producers}`);
  console.log(`  - Etiketler:   ${stats.tags}`);
  console.log(`  - Ürünler:     ${stats.products}`);
  console.log(`  - Kullanıcılar: ${stats.users}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed hatası:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });