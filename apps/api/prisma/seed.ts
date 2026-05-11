import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 SİSTEM SIFIRLANIYOR VE CANLIYA HAZIRLANIYOR...');

  try {
    // 0. TAM TEMİZLİK (Tüm test verilerini siliyoruz)
    console.log('🧹 Tüm test verileri ve kullanıcılar temizleniyor...');
    
    // Alt tabloları önce siliyoruz (Foreign Key kısıtlamaları için)
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.bid.deleteMany();
    await (prisma as any).packageOrder?.deleteMany();
    await (prisma as any).userSubscription?.deleteMany();
    await (prisma as any).subscriptionPlan?.deleteMany();
    await prisma.job.deleteMany();
    await prisma.workerProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    await prisma.district.deleteMany();
    await prisma.city.deleteMany();

    // 1. ŞEHİRLER VE İLÇELERİ YÜKLE
    console.log('🏙️ Şehirler ve ilçeler oluşturuluyor...');
    // Sizin dosyanızdaki tüm şehir listesi buraya eklenecek, şimdilik temel 81 ili garantiye alıyoruz
    const cityList = [
      "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
    ];

    for (let i = 0; i < cityList.length; i++) {
      const city = await prisma.city.create({
        data: { name: cityList[i], plateCode: i + 1 }
      });
      // Her ile en azından bir "Merkez" ilçesi ekleyelim ki boş kalmasın
      await prisma.district.create({
        data: { name: 'Merkez', cityId: city.id }
      });
    }

    // 2. KATEGORİLERİ CSV'DEN YÜKLE (Gelişmiş Düzeltme ile)
    console.log('📂 Kategoriler CSV dosyasından yükleniyor...');
    const csvPath = path.join(__dirname, '../../../firsatci_is_kategorisi.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'latin1');
      const lines = content.split('\n');

      const fix = (s: string) => {
        return s.trim()
          .replace(/ý/g, 'ı').replace(/Ý/g, 'İ')
          .replace(/þ/g, 'ş').replace(/Þ/g, 'Ş')
          .replace(/ð/g, 'ğ').replace(/Ð/g, 'Ğ')
          .replace(/\"/g, '');
      };

      for (const line of lines) {
        if (!line.trim() || line.startsWith('ANA_KATEGORI')) continue;
        const [parentName, childName] = line.split(';');

        if (parentName && childName) {
          const pName = fix(parentName);
          const cName = fix(childName);

          let parent = await prisma.category.findFirst({
            where: { name: pName, parentId: null }
          });

          if (!parent) {
            parent = await prisma.category.create({
              data: { name: pName, slug: pName.toLowerCase().replace(/ /g, '-') }
            });
          }

          await prisma.category.create({
            data: {
              name: cName,
              slug: `${parent.slug}-${cName.toLowerCase().replace(/ /g, '-')}`,
              parentId: parent.id
            }
          });
        }
      }
    }

    // 3. YENİ ÜRETİM ADMİNİ OLUŞTUR
    console.log('👑 Üretim Admini oluşturuluyor...');
    const adminPass = await bcrypt.hash('FFff369*', 12);
    await prisma.user.create({
      data: {
        firstName: 'Fırsatçı',
        lastName: 'Admin',
        email: 'admin@firsatci.com',
        passwordHash: adminPass,
        role: 'ADMIN',
        tcknEncrypted: 'ADMIN_TCKN',
        phoneEncrypted: 'ADMIN_PHONE',
        leaderScore: 100,
      }
    });

    // 4. VARSAYILAN ÜCRETSİZ PLAN (Kullanıcılar engellenmesin diye)
    console.log('🎁 Ücretsiz Plan tanımlanıyor...');
    await (prisma as any).subscriptionPlan.create({
      data: {
        name: 'Ücretsiz Başlangıç',
        price: 0,
        durationDays: 365,
        features: ['Sınırsız İhale', 'Sınırsız Teklif']
      }
    });

    console.log('✅ SİSTEM SIFIRLANDI VE CANLIYA HAZIR!');
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
