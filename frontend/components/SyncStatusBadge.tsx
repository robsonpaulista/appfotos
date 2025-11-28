import React from 'react';
import { useSync } from '@/hooks/useSync';

export function SyncStatusBadge() {
  const { syncStatus } = useSync();

  if (!syncStatus || syncStatus.status !== 'completed' || syncStatus.photos_processed === 0) {
    return null;
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-semibold text-emerald-800">Última sincronização:</span>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="text-emerald-700">
          <strong className="font-semibold">{syncStatus.photos_added}</strong> novas
        </span>
        <span className="text-blue-700">
          <strong className="font-semibold">{syncStatus.photos_updated}</strong> atualizadas
        </span>
        <span className="text-slate-700">
          <strong className="font-semibold">{syncStatus.photos_processed}</strong> total
        </span>
      </div>
    </div>
  );
}

