import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"]!,
});

const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = "Test1234!";

async function main() {
  // ====================================================================
  // KULLANICILAR — ownership senaryoları için 4 farklı rolde kullanıcı
  // ====================================================================
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const producerA = await prisma.user.upsert({
    where: { email: "producer-a@test.com" },
    update: {},
    create: {
      email: "producer-a@test.com",
      name: "Producer A",
      password: passwordHash,
      role: "PRODUCER",
      isVerified: true,
    },
  });

  const producerB = await prisma.user.upsert({
    where: { email: "producer-b@test.com" },
    update: {},
    create: {
      email: "producer-b@test.com",
      name: "Producer B",
      password: passwordHash,
      role: "PRODUCER",
      isVerified: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      email: "customer@test.com",
      name: "Customer",
      password: passwordHash,
      role: "CUSTOMER",
      isVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      name: "Admin",
      password: passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  console.log("Kullanıcılar oluşturuldu:", {
    producerA: producerA.email,
    producerB: producerB.email,
    customer: customer.email,
    admin: admin.email,
    sifre: SEED_PASSWORD,
  });

  // ====================================================================
  // KATEGORİLER
  // ====================================================================
  const elektronik = await prisma.category.upsert({
    where: { slug: "elektronik" },
    update: {},
    create: { name: "Elektronik", slug: "elektronik" },
  });

  const giyim = await prisma.category.upsert({
    where: { slug: "giyim" },
    update: {},
    create: { name: "Giyim", slug: "giyim" },
  });

  const kitap = await prisma.category.upsert({
    where: { slug: "kitap" },
    update: {},
    create: { name: "Kitap", slug: "kitap" },
  });

  console.log("Kategoriler oluşturuldu:", {
    elektronik: elektronik.slug,
    giyim: giyim.slug,
    kitap: kitap.slug,
  });

  // ====================================================================
  // ÜRETİCİLER
  // ====================================================================
  const apple = await prisma.producer.upsert({
    where: { name: "Apple" },
    update: {},
    create: { name: "Apple", city: "Istanbul" },
  });

  const samsung = await prisma.producer.upsert({
    where: { name: "Samsung" },
    update: {},
    create: { name: "Samsung", city: "Ankara" },
  });

  console.log("Üreticiler oluşturuldu:", {
    apple: apple.name,
    samsung: samsung.name,
  });

  // ====================================================================
  // ETİKETLER
  // ====================================================================
  const yeniTag = await prisma.tag.upsert({
    where: { name: "Yeni" },
    update: {},
    create: { name: "Yeni" },
  });

  const populerTag = await prisma.tag.upsert({
    where: { name: "Popüler" },
    update: {},
    create: { name: "Popüler" },
  });

  const indirimTag = await prisma.tag.upsert({
    where: { name: "İndirimli" },
    update: {},
    create: { name: "İndirimli" },
  });

  console.log("Etiketler oluşturuldu:", {
    yeniTag: yeniTag.name,
    populerTag: populerTag.name,
    indirimTag: indirimTag.name,
  });

  // ====================================================================
  // ÜRÜNLER — ownerId atanmış (ownership senaryoları için)
  // producer-a → iPhone, Galaxy
  // producer-b → Tişört, Roman
  // ====================================================================
  const iphone = await prisma.product.upsert({
    where: { name: "iPhone 16" },
    update: { owner: { connect: { id: producerA.id } } },
    create: {
      name: "iPhone 16",
      description: "Apple iPhone 16 128GB",
      price: 6499900,
      stock: 50,
      category: { connect: { id: elektronik.id } },
      producer: { connect: { id: apple.id } },
      owner: { connect: { id: producerA.id } },
      tags: { connect: [{ id: yeniTag.id }, { id: populerTag.id }] },
    },
  });

  const galaxy = await prisma.product.upsert({
    where: { name: "Galaxy S25" },
    update: { owner: { connect: { id: producerA.id } } },
    create: {
      name: "Galaxy S25",
      description: "Samsung Galaxy S25 256GB",
      price: 5499900,
      stock: 30,
      category: { connect: { id: elektronik.id } },
      producer: { connect: { id: samsung.id } },
      owner: { connect: { id: producerA.id } },
      tags: { connect: [{ id: yeniTag.id }] },
    },
  });

  const tisort = await prisma.product.upsert({
    where: { name: "Basic Tişört" },
    update: { owner: { connect: { id: producerB.id } } },
    create: {
      name: "Basic Tişört",
      description: "Pamuklu basic tişört",
      price: 29900,
      stock: 200,
      category: { connect: { id: giyim.id } },
      owner: { connect: { id: producerB.id } },
      tags: { connect: [{ id: indirimTag.id }] },
    },
  });

  const roman = await prisma.product.upsert({
    where: { name: "Suç ve Ceza" },
    update: { owner: { connect: { id: producerB.id } } },
    create: {
      name: "Suç ve Ceza",
      description: "Dostoyevski klasik roman",
      price: 14900,
      stock: 100,
      category: { connect: { id: kitap.id } },
      owner: { connect: { id: producerB.id } },
      tags: { connect: [{ id: populerTag.id }] },
    },
  });

  console.log("Ürünler oluşturuldu:", {
    iphone: { name: iphone.name, owner: producerA.email },
    galaxy: { name: galaxy.name, owner: producerA.email },
    tisort: { name: tisort.name, owner: producerB.email },
    roman: { name: roman.name, owner: producerB.email },
  });

  // ====================================================================
  // KUPONLAR — Gün 47 cartService.applyCoupon testleri için hazır veri
  // ====================================================================
  const welcome10 = await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 0,
    },
  });

  const bayram25 = await prisma.coupon.upsert({
    where: { code: "BAYRAM25" },
    update: {},
    create: {
      code: "BAYRAM25",
      discountType: "PERCENTAGE",
      discountValue: 25,
      minOrderAmount: 10000, // 100 TL
      maxUsage: 1000,
      expiresAt: new Date("2027-06-01"),
    },
  });

  const firstOrder = await prisma.coupon.upsert({
    where: { code: "FIRSTORDER" },
    update: {},
    create: {
      code: "FIRSTORDER",
      discountType: "FIXED",
      discountValue: 2000, // 20 TL
      minOrderAmount: 0,
    },
  });

  console.log("Kuponlar oluşturuldu:", {
    welcome10: welcome10.code,
    bayram25: bayram25.code,
    firstOrder: firstOrder.code,
  });

  console.log("\n✅ Seed işlemi tamamlandı!");
  console.log(`Tüm test kullanıcılarının şifresi: ${SEED_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
