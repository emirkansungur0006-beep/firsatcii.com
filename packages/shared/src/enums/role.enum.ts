// packages/shared/src/enums/role.enum.ts
// Sistemdeki kullanıcı rollerini tanımlar.
// Backend RBAC guard'larında ve frontend panel yönlendirmesinde kullanılır.

export enum Role {
  WORKER = 'WORKER',       // İşçi: teklif veren taraf
  EMPLOYER = 'EMPLOYER',   // İşveren: iş açan taraf
  ADMIN = 'ADMIN',         // Yönetici: tüm sistemi yöneten
}
