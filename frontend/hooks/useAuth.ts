import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import type { AuthStatus } from '@/types/photo';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAuthStatus();
      const status = response as AuthStatus;

      if (status.authenticated && status.user && !status.imageToken) {
        if (typeof window !== 'undefined' && typeof btoa !== 'undefined') {
          status.imageToken = btoa(status.user.id);
        }
      }

      setAuthStatus(status);
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setError('Falha ao verificar autenticação');
      setAuthStatus({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const status = await api.login(email, password);
      setAuthStatus(status);
      return status;
    } catch (err: unknown) {
      console.error('Erro ao fazer login:', err);
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Falha ao fazer login';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setAuthStatus({ authenticated: false });
      window.location.href = '/';
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError('Falha ao fazer logout');
    }
  };

  return {
    ...authStatus,
    loading,
    error,
    login,
    logout,
    refresh: checkAuthStatus,
  };
}
