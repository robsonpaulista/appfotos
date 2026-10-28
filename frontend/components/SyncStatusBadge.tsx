import React from 'react';
import { useSync } from '@/hooks/useSync';

export function SyncStatusBadge() {
  const { syncStatus } = useSync();

  if (!syncStatus || syncStatus.status !== 'completed' || syncStatus.photos_processed === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink/65">
      <span className="font-semibold text-ink">Última sync</span>
      <span>
        <strong className="font-semibold text-ink">{syncStatus.photos_added}</strong> novas
      </span>
      <span>
        <strong className="font-semibold text-ink">{syncStatus.photos_updated}</strong> atualizadas
      </span>
      <span>
        <strong className="font-semibold text-ink">{syncStatus.photos_processed}</strong> total
      </span>
    </div>
  );
}
