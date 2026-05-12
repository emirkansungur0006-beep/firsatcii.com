// apps/api/src/prisma/prisma.service.ts
// Prisma veritabanı bağlantısını yöneten servis.
// Uygulama başlayınca bağlanır, kapanınca bağlantıyı keser.
// Tüm modüller bu servis üzerinden veritabanına erişir.

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']  // Geliştirmede tüm sorgular loglanır
        : ['error'],                   // Üretimde sadece hatalar
    });
  }

  // Uygulama modülü başladığında veritabanına bağlan
  async onModuleInit() {
    await this.$connect();
    console.log('📦 PostgreSQL bağlantısı kuruldu.');

    // Eğer veritabanı boşsa (Şehirler yoksa), otonom olarak doldur.
    const cityCount = await this.city.count().catch(() => 0);
    if (cityCount === 0) {
      console.log('🌱 Veritabanı boş, yerleşik otonom tohumlama (seeding) başlatılıyor...');
      await this.runAutoSeed();
    }
  }

  private async runAutoSeed() {
    try {
      console.log('🏙️ Şehirler ve Merkez ilçeler oluşturuluyor...');
      const cityList = [
        "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
      ];

      for (let i = 0; i < cityList.length; i++) {
        const city = await this.city.create({
          data: { name: cityList[i], plateCode: i + 1 }
        });
        await this.district.create({
          data: { name: 'Merkez', cityId: city.id }
        });
      }

      console.log('📂 Kategoriler yükleniyor...');
      // Dosya kök dizinde aranır.
      let csvPath = path.join(process.cwd(), 'firsatci_is_kategorisi.csv');
      if (!fs.existsSync(csvPath)) {
        csvPath = path.join(process.cwd(), '../../firsatci_is_kategorisi.csv');
      }
      
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'latin1');
        const lines = content.split('\n');

        const fix = (s: string) => s.trim()
          .replace(/ý/g, 'ı').replace(/Ý/g, 'İ')
          .replace(/þ/g, 'ş').replace(/Þ/g, 'Ş')
          .replace(/ð/g, 'ğ').replace(/Ð/g, 'Ğ')
          .replace(/\"/g, '');

        for (const line of lines) {
          if (!line.trim() || line.startsWith('ANA_KATEGORI')) continue;
          const parts = line.split(';');
          if (parts.length >= 2) {
            const pName = fix(parts[0]);
            const cName = fix(parts[1]);

            let parent = await this.category.findFirst({
              where: { name: pName, parentId: null }
            });

            if (!parent) {
              parent = await this.category.create({
                data: { name: pName, slug: pName.toLowerCase().replace(/ /g, '-') }
              });
            }

            const existingChild = await this.category.findFirst({
               where: { name: cName, parentId: parent.id }
            });

            if (!existingChild) {
              await this.category.create({
                data: {
                  name: cName,
                  slug: `${parent.slug}-${cName.toLowerCase().replace(/ /g, '-')}`,
                  parentId: parent.id
                }
              });
            }
          }
        }
      } else {
        console.warn('⚠️ firsatci_is_kategorisi.csv bulunamadı, kategoriler atlandı. Aranan yollar:', csvPath);
      }

      console.log('✅ Otonom Tohumlama (Seeding) tamamlandı!');
    } catch (error) {
      console.error('❌ Otonom Tohumlama sırasında hata:', error);
    }
  }

  // Uygulama kapanırken bağlantıyı temizle
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 PostgreSQL bağlantısı kapatıldı.');
  }
}
