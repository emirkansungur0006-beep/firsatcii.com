import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('👷 TEST USTALARI OLUŞTURULUYOR...');
  
  const password = await bcrypt.hash('Usta123*', 12);
  
  const workers = [
    { firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@usta.com', aboutMe: '20 yıllık deneyimli elektrik ustası. Ev ve iş yeri tesisatı uzmanıyım.' },
    { firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet@usta.com', aboutMe: 'Sıhhi tesisat ve doğalgaz işleriniz anahtar teslim yapılır.' },
    { firstName: 'Can', lastName: 'Kaya', email: 'can@usta.com', aboutMe: 'İç mimari, boya ve badana işlerinde profesyonel çözüm.' }
  ];

  for (const w of workers) {
    const user = await prisma.user.upsert({
      where: { email: w.email },
      update: { role: 'WORKER' },
      create: {
        firstName: w.firstName,
        lastName: w.lastName,
        email: w.email,
        passwordHash: password,
        role: 'WORKER',
        tcknEncrypted: `TC_${w.firstName}`,
        phoneEncrypted: `PH_${w.firstName}`,
        leaderScore: 85,
        workerProfile: {
          create: {
            aboutMe: w.aboutMe,
            skills: ['Elektrik', 'Tesisat', 'Boya'],
            sectorIds: [1, 2, 3] // Örnek sektörler
          }
        }
      }
    });
    console.log(`✅ Usta Oluşturuldu: ${user.firstName} ${user.lastName}`);
  }

  console.log('\n✨ USTALAR ŞİMDİ GÖRÜNÜR OLDU! Lütfen sayfayı yenile.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
