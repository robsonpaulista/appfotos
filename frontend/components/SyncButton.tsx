import React, { useState } from 'react';
import { useSync } from '@/hooks/useSync';
import { FolderSelector } from './FolderSelector';

interface SyncButtonProps {
  onSyncComplete?: () => void;
}

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const { syncStatus, isInProgress, startSync, cancelSync } = useSync();
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  const handleSelectFolder = async (
    folderId: string,
    folderName: string,
    tags?: { person?: string; location?: string; event?: string }
  ) => {
    await startSync(false, folderId, tags, folderName);
  };

  const handleCancel = async () => {
    if (confirm('Deseja realmente cancelar a sincronização em andamento?')) {
      await cancelSync();
      onSyncComplete?.();
    }
  };

  const getStatusText = () => {
    if (!syncStatus) return 'Sincronizar fotos';

    switch (syncStatus.status) {
      case 'started':
        return 'Iniciando…';
      case 'in_progress':
        return `${syncStatus.photos_processed || 0} processadas`;
      case 'completed':
        return 'Sincronizar pasta';
      case 'failed':
        return 'Sincronizar fotos';
      default:
        return 'Sincronizar fotos';
    }
  };

  const buttonTone = () => {
    if (isInProgress) return 'bg-primary-600 text-primary-50';
    if (syncStatus?.status === 'failed') return 'bg-red-600 text-white hover:bg-red-700';
    return 'bg-primary-500 text-ink hover:bg-primary-400';
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowFolderSelector(true)}
          disabled={isInProgress}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${buttonTone()}`}
        >
          {isInProgress && (
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{getStatusText()}</span>
        </button>

        {isInProgress && (
          <button
            onClick={handleCancel}
            className="border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25"
          >
            Cancelar
          </button>
        )}
      </div>

      <FolderSelector
        isOpen={showFolderSelector}
        onClose={() => setShowFolderSelector(false)}
        onSelectFolder={handleSelectFolder}
      />
    </>
  );
}
