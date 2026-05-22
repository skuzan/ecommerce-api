
  // npx tsx src/seed-bulk-products.ts           


import { prisma } from "../src/config/database.js";

const SEED_PREFIX = "Bulk Test Product";
const CHUNK_SIZE = 1000;

async function clean(): Promise<void> {
  const result = await prisma.product.deleteMany({
    where: { name: { startsWith: SEED_PREFIX } },
  });
  console.log(`🧹 ${result.count} bulk test ürünü silindi.`);
}

async function seed(count: number): Promise<void> {
  console.log(`🌱 ${count} sahte ürün ekleniyor (chunk size: ${CHUNK_SIZE})...`);

  const startTime = Date.now();
  const now = Date.now();

  for (let offset = 0; offset < count; offset += CHUNK_SIZE) {
    const batch = Math.min(CHUNK_SIZE, count - offset);
    const rows = Array.from({ length: batch }, (_, i) => {
      const index = offset + i;
      const createdAt = new Date(now - index * 1000); 
      const price = Math.floor(Math.random() * 100000) + 100; 
      const stock = Math.floor(Math.random() * 100);
      return {
        name: `${SEED_PREFIX} ${index.toString().padStart(6, "0")}`,
        description: `Performans testi için otomatik üretildi (#${index})`,
        price,
        stock,
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      };
    });

    await prisma.product.createMany({
      data: rows,
      skipDuplicates: true,
    });

    const done = offset + batch;
    console.log(`   ✅ ${done}/${count} (${Math.round((done / count) * 100)}%)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✨ Bitti: ${count} ürün ${elapsed}s'de eklendi.`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--clean")) {
    await clean();
    return;
  }

  const countArg = args[0] ?? process.env["COUNT"] ?? "10000";
  const count = Number.parseInt(countArg, 10);
  if (!Number.isFinite(count) || count <= 0) {
    console.error(`❌ Geçersiz sayı: ${countArg}`);
    process.exit(1);
  }

  await seed(count);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
