import React, { useState } from 'react';
import { useSync } from '@/hooks/useSync';
import { FolderSelector } from './FolderSelector';

interface SyncButtonProps {
  onSyncComplete?: () => void;
}

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const { syncStatus, isInProgress, startSync, cancelSync } = useSync();
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  const handleSelectFolder = async (folderId: string, folderName: string, tags?: { person?: string; location?: string; event?: string }) => {
    await startSync(false, folderId, tags);
  };

  const handleCancel = async () => {
    if (confirm('Deseja realmente cancelar a sincronização em andamento?')) {
      await cancelSync();
      onSyncComplete?.();
    }
  };

  const getStatusText = () => {
    if (!syncStatus) return 'Sincronizar Fotos';
    
    switch (syncStatus.status) {
      case 'started':
        return 'Iniciando sincronização...';
      case 'in_progress':
        return `${syncStatus.photos_processed || 0} fotos processadas`;
      case 'completed':
        return 'Sincronizar Nova Pasta';
      case 'failed':
        return 'Sincronizar Fotos';
      default:
        return 'Sincronizar Fotos';
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus || isInProgress) {
      return (
        <svg className={`w-5 h-5 ${isInProgress ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    switch (syncStatus.status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getButtonStyle = () => {
    if (!syncStatus) {
      return 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40';
    }
    
    switch (syncStatus.status) {
      case 'started':
      case 'in_progress':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30';
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40';
      case 'failed':
        return 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40';
      default:
        return 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40';
    }
  };

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setShowFolderSelector(true)}
          disabled={isInProgress}
          className={`group relative px-6 py-2.5 ${getButtonStyle()} font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2`}
        >
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </button>
        
        {isInProgress && (
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-white text-slate-700 font-medium rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
            title="Cancelar sincronização"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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

