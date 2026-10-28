import React from 'react';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types/photo';

interface PhotoGalleryProps {
  photos: Photo[];
  loading?: boolean;
  onPhotoClick?: (photo: Photo) => void;
  isSelectionMode?: boolean;
  selectedPhotos?: string[];
  onToggleSelect?: (photoId: string) => void;
}

export function PhotoGallery({
  photos,
  loading,
  onPhotoClick,
  isSelectionMode = false,
  selectedPhotos = [],
  onToggleSelect,
}: PhotoGalleryProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner mb-4 border-ink/15 border-t-primary-600" />
        <p className="text-sm font-medium text-ink/50">Carregando fotos…</p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-ink/15 bg-white/60 px-6 py-20 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center bg-primary-500/25">
          <svg className="h-7 w-7 text-ink/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-ink">
          Nenhuma foto no acervo
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink/50">
          Ajuste os filtros ou, se for administrador, sincronize a pasta do Drive.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick?.(photo)}
          isSelectionMode={isSelectionMode}
          isSelected={selectedPhotos.includes(photo.id)}
          onToggleSelect={() => onToggleSelect?.(photo.id)}
        />
      ))}
    </div>
  );
}
