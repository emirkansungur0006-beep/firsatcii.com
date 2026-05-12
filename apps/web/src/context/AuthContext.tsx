'use client';

// apps/web/src/context/AuthContext.tsx
// Uygulama çapında kimlik doğrulama durumunu yönetir.
// Kullanıcı bilgisi, giriş/çıkış fonksiyonları ve yükleme durumu sağlar.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN';
  leaderScore: number;
  completedJobs: number;
  cityId?: number;
  districtId?: number;
  subscription?: any;
  profilePicture?: string;
  permissions?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Context oluştur
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API yardımcısı - tüm istekler credentials ile gönderilir (cookie için)
async function apiFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // HttpOnly cookie gönderilir
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Bir hata oluştu.');
  }

  return response.json();
}

// Sessiz auth kontrolü — 401 hatalarını konsola yazmaz
async function silentAuthFetch(url: string, options?: RequestInit) {
  try {
    return await apiFetch(url, options);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde mevcut oturumu kontrol et
  const refreshUser = useCallback(async () => {
    // İlk önce access token ile dene (sessizce)
    const meData = await silentAuthFetch('/api/v1/auth/me');
    if (meData?.user) {
      setUser(meData.user);
      return;
    }

    // Access token geçersiz — refresh token dene (sessizce)
    const refreshResult = await silentAuthFetch('/api/v1/auth/refresh', { method: 'POST' });
    if (refreshResult) {
      const retryData = await silentAuthFetch('/api/v1/auth/me');
      if (retryData?.user) {
        setUser(retryData.user);
        return;
      }
    }

    // Her ikisi de başarısız — oturum yok
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook - AuthContext'i kolayca kullanmak için
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  }
  return context;
}
