import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fallbackAuthContext: AuthContextType = {
  user: null,
  isAdmin: false,
  isLoading: true,
  login: async () => ({ success: false, error: 'AuthProvider ausente' }),
  logout: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const isLoggedIn = localStorage.getItem('ag_logged_in');
    if (isLoggedIn === 'true') {
      const result = await getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
      }
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.data) {
      setUser(result.data);
      localStorage.setItem('ag_logged_in', 'true');
      return { success: true };
    }
    return { success: false, error: result.error || 'Erro ao fazer login' };
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    localStorage.removeItem('ag_logged_in');
    localStorage.removeItem('isAdmin');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Evita tela branca se algum componente renderizar fora do provider.
    // Mantemos isLoading=true para bloquear rotas até a árvore estabilizar.
    console.warn('useAuth foi usado fora do AuthProvider. Verifique a árvore de Providers.');
    return fallbackAuthContext;
  }
  return context;
}
