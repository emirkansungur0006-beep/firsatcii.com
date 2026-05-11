// packages/shared/src/enums/bid-status.enum.ts
// Teklif durumlarını tanımlar.

export enum BidStatus {
  PENDING = 'PENDING',       // Beklemede - işveren henüz karar vermedi
  ACCEPTED = 'ACCEPTED',     // Kabul edildi - iletişim bilgileri açılır
  REJECTED = 'REJECTED',     // Reddedildi
  WITHDRAWN = 'WITHDRAWN',   // İşçi teklifini geri çekti
}
