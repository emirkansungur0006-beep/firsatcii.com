import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 VERİTABANI RÖNTGENİ BAŞLADI...');
  
  const workerCount = await prisma.user.count({
    where: { role: 'WORKER' }
  });

  const activeWorkerCount = await prisma.user.count({
    where: { role: 'WORKER', isSuspended: false }
  });

  console.log('-----------------------------------');
  console.log(`👷 Toplam Usta (Worker) Sayısı: ${workerCount}`);
  console.log(`✅ Aktif/Görünür Usta Sayısı: ${activeWorkerCount}`);
  console.log('-----------------------------------');

  if (workerCount > 0) {
    const samples = await prisma.user.findMany({
      where: { role: 'WORKER' },
      take: 5,
      select: { firstName: true, lastName: true, cityId: true, districtId: true }
    });
    console.log('📌 Bazı Gerçek Ustalar:');
    samples.forEach(s => console.log(` - ${s.firstName} ${s.lastName} (Şehir ID: ${s.cityId}, İlçe ID: ${s.districtId})`));
  } else {
    console.log('⚠️ Veritabanında hiç usta kaydı bulunamadı.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
