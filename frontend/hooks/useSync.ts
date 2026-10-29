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

  const processChunks = useCallback(
    async (
      syncId: string,
      pageToken?: string,
      ctx?: {
        folderId?: string;
        folderName?: string;
        tags?: { person?: string; location?: string; event?: string };
        folderMap?: Record<string, string>;
      }
    ) => {
      try {
        const result = await api.processChunk(syncId, pageToken, ctx);

        await checkStatus();

        const nextCtx = {
          folderId: result.folderId || ctx?.folderId,
          folderName: result.folderName || ctx?.folderName,
          tags: result.tags || ctx?.tags,
          folderMap: result.folderMap || ctx?.folderMap,
        };

        if (!result.done && result.nextPageToken) {
          setTimeout(() => {
            processChunks(syncId, result.nextPageToken || undefined, nextCtx);
          }, 500);
        } else if (result.done) {
          await checkStatus();
        }
      } catch (err) {
        console.error('Erro ao processar chunk:', err);
        setError('Erro ao processar sincronização');
        await checkStatus();
      }
    },
    [checkStatus]
  );

  const startSync = async (
    analyzeWithVision: boolean = false,
    folderId?: string,
    tags?: { person?: string; location?: string; event?: string },
    folderName?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      setSyncStatus({
        status: 'started',
        photos_processed: 0,
        photos_added: 0,
        photos_updated: 0,
      } as SyncEvent);

      const response = await api.startSync(analyzeWithVision, folderId, tags);

      await checkStatus();

      if (response.syncId) {
        setTimeout(() => {
          processChunks(response.syncId, undefined, {
            folderId,
            folderName,
            tags,
          });
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

