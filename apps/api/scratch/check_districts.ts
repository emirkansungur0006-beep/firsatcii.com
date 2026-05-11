import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cityCount = await prisma.city.count();
  const districtCount = await prisma.district.count();
  
  console.log(`📊 Şehir Sayısı: ${cityCount}`);
  console.log(`📊 İlçe Sayısı: ${districtCount}`);
  
  if (districtCount > 0) {
    const samples = await prisma.district.findMany({
      take: 10,
      include: { city: true }
    });
    console.log('\n🔍 Örnek İlçeler:');
    samples.forEach(d => console.log(` - ${d.name} (${d.city.name})`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
