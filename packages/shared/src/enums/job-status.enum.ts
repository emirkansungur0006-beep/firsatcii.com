// packages/shared/src/enums/job-status.enum.ts
// İhale durumlarını tanımlar.
// Backend'de iş akışı yönetimi, frontend'de UI gösterimi için kullanılır.

export enum JobStatus {
  ACTIVE = 'ACTIVE',           // Teklif kabul ediliyor
  LOCKED = 'LOCKED',           // Son 10 dakika - anti-sniper aktif, yeni teklif yok
  COMPLETED = 'COMPLETED',     // İşveren bir teklifi kabul etti, iş tamamlandı
  CANCELLED = 'CANCELLED',     // İptal edildi
}
