import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 NACE SEKTÖR VERİLERİ YÜKLENİYOR...');

  const naceData = [
    // Seviye 1: Kısımlar (A-U)
    { code: 'A', name: 'TARIM, ORMANCILIK VE BALIKÇILIK', level: 1 },
    { code: 'B', name: 'MADENCİLİK VE TAŞ OCAKÇILIĞI', level: 1 },
    { code: 'C', name: 'İMALAT', level: 1 },
    { code: 'F', name: 'İNŞAAT', level: 1 },
    { code: 'G', name: 'TOPTAN VE PERAKENDE TİCARET', level: 1 },
    { code: 'H', name: 'ULAŞTIRMA VE DEPOLAMA', level: 1 },
    { code: 'I', name: 'KONAKLAMA VE YİYECEK HİZMETİ FAALİYETLERİ', level: 1 },
    { code: 'J', name: 'BİLGİ VE İLETİŞİM', level: 1 },
    { code: 'M', name: 'MESLEKİ, BİLİMSEL VE TEKNİK FAALİYETLER', level: 1 },
    { code: 'N', name: 'İDARİ VE DESTEK HİZMET FAALİYETLERİ', level: 1 },
    { code: 'S', name: 'DİĞER HİZMET FAALİYETLERİ', level: 1 },

    // Seviye 2: Bölümler (İnşaat Örneği)
    { code: '41', name: 'Bina inşaatı', level: 2, parentCode: 'F' },
    { code: '42', name: 'Bina dışı inşaat', level: 2, parentCode: 'F' },
    { code: '43', name: 'Özel inşaat faaliyetleri', level: 2, parentCode: 'F' },

    // Seviye 3: Gruplar
    { code: '43.2', name: 'Elektrik tesisatı, sıhhi tesisat ve diğer inşaat tesisatı faaliyetleri', level: 3, parentCode: '43' },
    { code: '43.3', name: 'Bina tamamlama ve bitirme faaliyetleri', level: 3, parentCode: '43' },

    // Seviye 4: Sınıflar
    { code: '43.31', name: 'Sıva işleri', level: 4, parentCode: '43.3' },
    { code: '43.32', name: 'Doğrama tesisatı', level: 4, parentCode: '43.3' },
    { code: '43.33', name: 'Yer ve duvar kaplama', level: 4, parentCode: '43.3' },
    { code: '43.34', name: 'Boya ve cam işleri', level: 4, parentCode: '43.3' },

    // Seviye 5: Alt Sınıflar (Tam detay)
    { code: '43.34.01', name: 'Binaların iç ve dış boyama işleri', level: 5, parentCode: '43.34' },
    { code: '43.34.02', name: 'Cam takma işleri', level: 5, parentCode: '43.34' },
  ];

  const codeToId = new Map<string, number>();

  for (const item of naceData) {
    const parentId = item.parentCode ? codeToId.get(item.parentCode) : null;
    
    const sector = await prisma.sector.upsert({
      where: { code: item.code },
      update: { name: item.name, level: item.level, parentId },
      create: { 
        code: item.code, 
        name: item.name, 
        level: item.level, 
        parentId 
      },
    });
    
    codeToId.set(item.code, sector.id);
  }

  console.log('✅ NACE SEKTÖR VERİLERİ BAŞARIYLA YÜKLENİDİ!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
