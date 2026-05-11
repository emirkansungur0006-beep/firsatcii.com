// packages/shared/src/dto/job.dto.ts
// İhale/İş oluşturma ve listeleme için DTO tipleri.

export interface CreateJobDto {
  title: string;
  description: string;
  categoryId: number;
  cityId: number;
  districtId: number;
  neighborhoodId?: number;
  latitude: number;          // PostGIS Point için enlem
  longitude: number;         // PostGIS Point için boylam
  address?: string;          // Açık adres (opsiyonel)
  budgetMin?: number;
  budgetMax?: number;
  auctionDurationHours: number; // İhale süresi (saat cinsinden)
}

export interface JobResponseDto {
  id: string;
  title: string;
  description: string;
  category: { id: number; name: string };
  city: { id: number; name: string };
  district: { id: number; name: string };
  neighborhood?: { id: number; name: string };
  address?: string;
  status: string;
  budgetMin?: number;
  budgetMax?: number;
  auctionEnd: string;         // ISO 8601 tarih formatı
  isAntiSniperActive: boolean;
  bidCount: number;
  lowestBid?: number;         // Sadece tutar gösterilir, işçi kimliği gizlenir
  createdAt: string;
  // İşveren bilgileri - sadece iş sahibi görebilir
  employer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface JobFilterDto {
  categoryId?: number;
  cityId?: number;
  districtId?: number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'auctionEnd' | 'budgetMin';
  sortOrder?: 'asc' | 'desc';
}
