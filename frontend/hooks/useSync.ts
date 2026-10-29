import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/utils/api';
import type { SyncEvent } from '@/types/photo';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [indexing, setIndexing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef<(() => void) | undefined>();

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

    const interval = setInterval(() => {
      if (syncStatus?.status === 'started' || syncStatus?.status === 'in_progress') {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkStatus, syncStatus?.status]);

  const runFaceIndexing = useCallback(async () => {
    setIndexing(true);
    setStatusMessage('Indexando rostos das fotos sincronizadas…');
    try {
      const result = await api.indexPendingFaces(({ totalProcessed, totalFaces, round }) => {
        setStatusMessage(
          `Indexando rostos… lote ${round} (${totalProcessed} fotos, ${totalFaces} rostos)`
        );
      });
      setStatusMessage(result.message);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Sync concluída, mas a indexação de rostos falhou. Tente de novo mais tarde.';
      console.error('Erro na indexação pós-sync:', err);
      setStatusMessage(message);
      setError(message);
    } finally {
      setIndexing(false);
      onCompleteRef.current?.();
    }
  }, []);

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
          setStatusMessage('Sync concluída. Iniciando indexação de rostos…');
          await runFaceIndexing();
        }
      } catch (err) {
        console.error('Erro ao processar chunk:', err);
        setError('Erro ao processar sincronização');
        await checkStatus();
      }
    },
    [checkStatus, runFaceIndexing]
  );

  const startSync = async (
    analyzeWithVision: boolean = false,
    folderId?: string,
    tags?: { person?: string; location?: string; event?: string },
    folderName?: string,
    onComplete?: () => void
  ) => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage('Iniciando sincronização…');
      onCompleteRef.current = onComplete;

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
      setStatusMessage(null);
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
      setStatusMessage('Sincronização cancelada.');
    } catch (err) {
      console.error('Erro ao cancelar sincronização:', err);
      setError('Falha ao cancelar sincronização');
    } finally {
      setLoading(false);
    }
  };

  const isInProgress =
    syncStatus?.status === 'started' ||
    syncStatus?.status === 'in_progress' ||
    indexing;

  return {
    syncStatus,
    loading,
    indexing,
    statusMessage,
    error,
    isInProgress,
    startSync,
    analyzePhotos,
    cancelSync,
    refresh: checkStatus,
  };
}
