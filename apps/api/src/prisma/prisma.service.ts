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

  public async runAutoSeed(force: boolean = false) {
    try {
      if (!force) {
        const cityCount = await this.city.count().catch(() => 0);
        if (cityCount > 0) return;
      }

      console.log('🏙️ Şehirler ve 973 İlçe Türkiye API üzerinden çekiliyor...');
      const https = require('https');
      
      const fetchProvinces = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          https.get('https://turkiyeapi.dev/api/v1/provinces', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
      };

      const json = await fetchProvinces();
      if (json.status === 'OK') {
        for (const province of json.data) {
          let city = await this.city.findFirst({ where: { name: province.name } });
          if (!city) {
             city = await this.city.create({
               data: { name: province.name, plateCode: province.id }
             });
          }
          
          if (province.districts) {
            for (const district of province.districts) {
              const existing = await this.district.findFirst({
                where: { name: district.name, cityId: city.id }
              });
              if (!existing) {
                await this.district.create({
                  data: { name: district.name, cityId: city.id }
                });
              }
            }
          }
        }
        console.log('✅ Tüm il ve ilçeler başarıyla yüklendi!');
      }

      console.log('📂 Kategoriler yükleniyor...');
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
        console.log('✅ Kategoriler başarıyla yüklendi!');
      } else {
        console.warn('⚠️ firsatci_is_kategorisi.csv bulunamadı, kategoriler atlandı. Aranan yollar:', csvPath);
      }

      console.log('✅ Otonom Tohumlama (Seeding) tamamlandı!');
      return { success: true, message: 'Veriler basariyla guncellendi.' };
    } catch (error) {
      console.error('❌ Otonom Tohumlama sırasında hata:', error);
      return { success: false, error: error.message };
    }
  }

  // Uygulama kapanırken bağlantıyı temizle
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 PostgreSQL bağlantısı kapatıldı.');
  }
}
