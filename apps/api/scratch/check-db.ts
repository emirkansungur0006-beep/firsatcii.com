
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('--- Kullanıcı Listesi ---');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true }
  });
  
  if (users.length === 0) {
    console.log('HATA: Veritabanında hiç kullanıcı yok! Seed yapman gerekiyor.');
  } else {
    users.forEach(u => {
      console.log(`- ${u.firstName} (${u.email}) [${u.role}]`);
    });
  }
  
  // Admin için şifre testi
  const admin = await prisma.user.findUnique({ where: { email: 'admin@firsatci.com' } });
  if (admin) {
    const is1234Valid = await bcrypt.compare('1234', admin.passwordHash);
    const isSeedValid = await bcrypt.compare('LLpp369*', admin.passwordHash);
    console.log('\n--- Admin Şifre Durumu ---');
    console.log(`'1234' geçerli mi? : ${is1234Valid}`);
    console.log(`'LLpp369*' geçerli mi? : ${isSeedValid}`);
  }
}

checkUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
