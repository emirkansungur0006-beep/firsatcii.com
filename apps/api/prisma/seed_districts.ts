import { PrismaClient } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();

function fetchProvinces(): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get('https://turkiyeapi.dev/api/v1/provinces', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🌍 973 İlçe Türkiye API üzerinden çekiliyor...');
  console.log('Lütfen bekleyin (İşlem yaklaşık 10-15 saniye sürebilir)...\n');
  
  const json = await fetchProvinces();
  if (json.status !== 'OK') throw new Error('Türkiye API Hatası');
  
  let districtCount = 0;
  
  for (const province of json.data) {
    // İli Plaka Kodu ile Prisma'dan buluyoruz
    const city = await prisma.city.findUnique({
      where: { plateCode: province.id }
    });
    
    if (!city || !province.districts) continue;
    
    for (const district of province.districts) {
      // İlçenin veritabanında olup olmadığına isim ve şehir ID bazında bak (id sequence bozulmaması için)
      const existing = await prisma.district.findFirst({
        where: { name: district.name, cityId: city.id }
      });
      
      if (!existing) {
        await prisma.district.create({
          data: {
            name: district.name,
            cityId: city.id
          }
        });
        districtCount++;
      }
    }
  }
  
  console.log(`\n✅ ${districtCount} İLÇE EKSİKSİZ OLARAK VERİTABANINA ENJEKTE EDİLDİ!`);
  console.log(`✅ Artık tüm formlarda ilçeler görünecek!`);
}

main()
  .catch(e => {
    console.error('❌ Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
