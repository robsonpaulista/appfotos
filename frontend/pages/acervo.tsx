import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { PhotoFilters } from '@/components/PhotoFilters';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Pagination } from '@/components/Pagination';
import { SyncButton } from '@/components/SyncButton';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { DevTools } from '@/components/DevTools';
import { BulkEditBar } from '@/components/BulkEditBar';
import { GeocodingButton } from '@/components/GeocodingButton';
import { useAuth } from '@/hooks/useAuth';
import { usePhotos } from '@/hooks/usePhotos';
import { usePhotoSelection } from '@/hooks/usePhotoSelection';
import { LoginLanding } from '@/components/LoginLanding';
import { api } from '@/utils/api';
import type { Photo } from '@/types/photo';

export default function AcervoPage() {
  const router = useRouter();
  const { authenticated, user, loading: authLoading, login, error: authError } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { photos, filters, loading, pagination, updateFilters, goToPage, refresh } = usePhotos({}, authenticated);
  const {
    selectedPhotos,
    selectedCount,
    isSelectionMode,
    togglePhoto,
    selectAll,
    deselectAll,
    enterSelectionMode,
    exitSelectionMode,
  } = usePhotoSelection();

  const [indexing, setIndexing] = useState<boolean>(false);
  const [indexMessage, setIndexMessage] = useState<string | null>(null);

  const handlePhotoClick = (photo: Photo) => {
    router.push(`/photo/${photo.id}`);
  };

  const toMessage = (value: unknown, fallback: string): string => {
    if (typeof value === 'string' && value.trim()) return value;
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.message === 'string') return obj.message;
      if (typeof obj.error === 'string') return obj.error;
      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const handleIndexFaces = async () => {
    setIndexing(true);
    setIndexMessage(null);
    try {
      const result = await api.indexLibraryFaces(15);
      setIndexMessage(
        toMessage(
          result.message,
          `${result.processed ?? 0} foto(s), ${result.facesTotal ?? 0} rosto(s).`
        )
      );
    } catch (err: unknown) {
      const ax = err as {
        response?: {
          status?: number;
          data?: { error?: unknown; message?: unknown };
        };
        message?: string;
      };
      const status: number | undefined = ax.response?.status;
      const detail = toMessage(
        ax.response?.data?.error ?? ax.response?.data?.message ?? ax.message,
        'Falha ao indexar rostos.'
      );
      setIndexMessage(
        status === 502 || status === 503
          ? `${detail} Abra /api/faces/backend-status (logado) para diagnosticar, ou o /health do Render.`
          : detail
      );
    } finally {
      setIndexing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-primary-500">
        <div className="spinner mb-5 border-ink/20 border-t-ink" />
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-ink/60">
          JArchive
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginLanding
        onLogin={async (email, password) => {
          await login(email, password);
        }}
        error={authError}
        loading={authLoading}
      />
    );
  }

  return (
    <>
      <Head>
        <title>JArchive — Gestão do acervo</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
                Gestão
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {pagination?.total ?? 0}{' '}
                {(pagination?.total ?? 0) === 1 ? 'foto' : 'fotos'}
              </h1>
              {(pagination?.total ?? 0) > 0 && (
                <p className="mt-1 text-sm text-ink/50">
                  Página {pagination?.page ?? 1} de {pagination?.totalPages ?? 1}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <>
                  <SyncStatusBadge />
                  <SyncButton onSyncComplete={refresh} />
                  <button
                    type="button"
                    onClick={handleIndexFaces}
                    disabled={indexing}
                    className="border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink disabled:opacity-50"
                  >
                    {indexing ? 'Indexando…' : 'Indexar rostos'}
                  </button>
                </>
              )}
              {photos.length > 0 &&
                (!isSelectionMode ? (
                  <button
                    onClick={enterSelectionMode}
                    className="border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
                  >
                    Selecionar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAll(photos)}
                      className="bg-primary-500/20 px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-primary-500/30"
                    >
                      Todas
                    </button>
                    <button
                      onClick={deselectAll}
                      className="border border-ink/12 bg-white px-3 py-2 text-sm font-medium text-ink/60"
                    >
                      Nenhuma
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {indexMessage && (
            <div className="border border-ink/10 bg-primary-500/15 px-4 py-3 text-sm text-ink/70">
              {typeof indexMessage === 'string' ? indexMessage : String(indexMessage)}
            </div>
          )}

          <GeocodingButton onComplete={refresh} />

          <PhotoFilters filters={filters} onFilterChange={updateFilters} />

          {loading && !photos.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner mb-4 border-ink/15 border-t-primary-600" />
              <p className="text-sm font-medium text-ink/50">Carregando acervo…</p>
            </div>
          ) : (
            <>
              <PhotoGallery
                photos={photos}
                loading={loading}
                onPhotoClick={handlePhotoClick}
                isSelectionMode={isSelectionMode}
                selectedPhotos={selectedPhotos}
                onToggleSelect={togglePhoto}
              />

              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}
        </div>
      </main>

      {isAdmin && process.env.NODE_ENV !== 'production' && (
        <DevTools onDataCleared={refresh} />
      )}

      {isSelectionMode && selectedCount > 0 && (
        <BulkEditBar
          selectedCount={selectedCount}
          selectedPhotos={selectedPhotos}
          onComplete={() => {
            exitSelectionMode();
            refresh();
          }}
          onCancel={exitSelectionMode}
        />
      )}
    </>
  );
}
