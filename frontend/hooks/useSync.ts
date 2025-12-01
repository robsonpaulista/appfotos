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

  const processChunks = useCallback(async (syncId: string, pageToken?: string) => {
    try {
      const result = await api.processChunk(syncId, pageToken);
      
      // Atualizar status com os dados mais recentes
      await checkStatus();
      
      if (!result.done && result.nextPageToken) {
        // Continuar processando próximo chunk após um pequeno delay
        setTimeout(() => {
          processChunks(syncId, result.nextPageToken);
        }, 500);
      } else if (result.done) {
        // Sincronização concluída
        await checkStatus();
      }
    } catch (err) {
      console.error('Erro ao processar chunk:', err);
      setError('Erro ao processar sincronização');
      // Marcar como falha
      await checkStatus();
    }
  }, [checkStatus]);

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
      
      const response = await api.startSync(analyzeWithVision, folderId, tags);
      
      // Atualizar status
      await checkStatus();
      
      // Iniciar processamento de chunks com o syncId retornado
      if (response.syncId) {
        // Aguardar um pouco antes de começar a processar
        setTimeout(() => {
          processChunks(response.syncId);
        }, 500);
      }
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

