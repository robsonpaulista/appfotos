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
      const status = await api.getAuthStatus();
      setAuthStatus(status);
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setError('Falha ao verificar autenticação');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const { authUrl } = await api.getAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Erro ao obter URL de autenticação:', err);
      setError('Falha ao iniciar autenticação');
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

