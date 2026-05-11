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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde mevcut oturumu kontrol et
  const refreshUser = useCallback(async () => {
    try {
      // Access token cookie'si geçerliyse kullanıcıyı getir
      const data = await apiFetch('/api/v1/auth/me');
      setUser(data.user);
    } catch {
      // Token geçersiz - refresh dene
      try {
        await apiFetch('/api/v1/auth/refresh', { method: 'POST' });
        const data = await apiFetch('/api/v1/auth/me');
        setUser(data.user);
      } catch {
        // Her ikisi de başarısız - oturum yok
        setUser(null);
      }
    }
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
