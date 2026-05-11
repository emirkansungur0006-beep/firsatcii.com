// packages/shared/src/dto/bid.dto.ts
// Teklif verme ve listeleme için DTO tipleri.
// KİMLİK GİZLEME: İşçiler birbirlerinin sadece teklif tutarını görür,
// isim/telefon gibi bilgiler maskelenir.

export interface CreateBidDto {
  jobId: string;
  amount: number;    // Teklif tutarı (TL)
  note?: string;     // Opsiyonel not
}

export interface UpdateBidDto {
  amount: number;
  note?: string;
}

// İşçilerin göreceği teklif listesi - kimlik maskelendi
export interface PublicBidDto {
  id: string;
  amount: number;           // Sadece tutar görünür
  rank: number;             // Sıralama (1 = en düşük teklif)
  isOwn: boolean;           // Bu teklif benim mi?
  createdAt: string;
  // worker bilgisi intentional olarak yok - kimlik gizlenir
}

// İşverenin göreceği teklif listesi - kimlik açık
export interface EmployerBidDto {
  id: string;
  amount: number;
  note?: string;
  status: string;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    leaderScore: number;
    completedJobs: number;
  };
  createdAt: string;
}

// Teklif kabul edildikten sonra karşılıklı iletişim bilgileri açılır
export interface ContactRevealDto {
  worker: {
    firstName: string;
    lastName: string;
    phone: string;    // Şifre çözülmüş telefon numarası
    email: string;
  };
  employer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}
