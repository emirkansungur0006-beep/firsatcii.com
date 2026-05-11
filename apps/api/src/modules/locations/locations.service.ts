// apps/api/src/modules/locations/locations.service.ts
// Türkiye il/ilçe/mahalle sorguları
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getCities() {
    return this.prisma.city.findMany({ orderBy: { plateCode: 'asc' } });
  }

  async getAllDistricts() {
    return this.prisma.district.findMany({
      include: { city: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async getDistricts(cityIdOrPlate: number) {
    console.log(`🔍 [Locations] Sorgulanan Şehir ID/Plaka: ${cityIdOrPlate}`);
    
    // 1. Önce ID veya Plaka Kodu ile şehri bulalım
    const city = await this.prisma.city.findFirst({
      where: {
        OR: [
          { id: cityIdOrPlate },
          { plateCode: cityIdOrPlate }
        ]
      },
      include: {
        _count: {
          select: { districts: true }
        }
      }
    });

    if (!city) {
      console.error(`❌ [Locations] Şehir bulunamadı: ${cityIdOrPlate}`);
      return [];
    }

    console.log(`✅ [Locations] Şehir bulundu: ${city.name} (${city._count.districts} ilçe)`);

    // 2. O şehre ait TÜM ilçeleri çekelim
    const districts = await this.prisma.district.findMany({
      where: { cityId: city.id },
      orderBy: { name: 'asc' },
    });

    return districts;
  }

  async getNeighborhoods(districtId: number) {
    return this.prisma.neighborhood.findMany({
      where: { districtId },
      orderBy: { name: 'asc' },
    });
  }
}
