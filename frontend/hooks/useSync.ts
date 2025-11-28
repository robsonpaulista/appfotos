import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import type { SyncEvent } from '@/types/photo';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Erro ao verificar status de sincronização:', err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    
    // Poll status a cada 3 segundos se houver sincronização em andamento
    const interval = setInterval(() => {
      if (syncStatus?.status === 'started' || syncStatus?.status === 'in_progress') {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkStatus, syncStatus?.status]);

  const startSync = async (analyzeWithVision: boolean = false, folderId?: string, tags?: { person?: string; location?: string; event?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Resetar status para mostrar que está iniciando
      setSyncStatus({
        status: 'started',
        photos_processed: 0,
        photos_added: 0,
        photos_updated: 0,
      } as any);
      
      await api.startSync(analyzeWithVision, folderId, tags);
      
      // Verificar status após 2 segundos
      setTimeout(checkStatus, 2000);
    } catch (err) {
      console.error('Erro ao iniciar sincronização:', err);
      setError('Falha ao iniciar sincronização');
    } finally {
      setLoading(false);
    }
  };

  const analyzePhotos = async (limit: number = 100) => {
    try {
      setLoading(true);
      setError(null);
      await api.analyzePhotos(limit);
    } catch (err) {
      console.error('Erro ao iniciar análise:', err);
      setError('Falha ao iniciar análise');
    } finally {
      setLoading(false);
    }
  };

  const cancelSync = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.cancelSync();
      await checkStatus();
    } catch (err) {
      console.error('Erro ao cancelar sincronização:', err);
      setError('Falha ao cancelar sincronização');
    } finally {
      setLoading(false);
    }
  };

  const isInProgress = syncStatus?.status === 'started' || syncStatus?.status === 'in_progress';

  return {
    syncStatus,
    loading,
    error,
    isInProgress,
    startSync,
    analyzePhotos,
    cancelSync,
    refresh: checkStatus,
  };
}

