// packages/shared/src/index.ts
// Shared paketinin ana ihracat dosyası.
// Her iki uygulama (api + web) bu dosyadan import yapar.

// Enum'lar
export * from './enums/role.enum';
export * from './enums/job-status.enum';
export * from './enums/bid-status.enum';

// DTO Tipleri
export * from './dto/auth.dto';
export * from './dto/job.dto';
export * from './dto/bid.dto';
