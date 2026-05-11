import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 BOT TEMİZLİĞİ BAŞLATILIYOR...');
  
  const emails = ['ahmet@usta.com', 'mehmet@usta.com', 'can@usta.com'];
  
  const result = await prisma.user.deleteMany({
    where: {
      email: { in: emails }
    }
  });

  console.log(`✅ ${result.count} bot kullanıcı sistemden tamamen temizlendi.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
