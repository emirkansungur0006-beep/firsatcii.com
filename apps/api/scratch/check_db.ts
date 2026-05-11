import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const cities = await prisma.city.findMany({
    where: { name: 'Ankara' }
  });
  console.log('Ankara City:', cities);

  const jobs = await prisma.job.findMany({
    take: 5,
    include: { city: true }
  });
  console.log('Sample Jobs:', jobs.map(j => ({ title: j.title, cityId: j.cityId, cityName: j.city?.name })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
