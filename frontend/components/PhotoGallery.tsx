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

export function PhotoGallery({ photos, loading, onPhotoClick, isSelectionMode = false, selectedPhotos = [], onToggleSelect }: PhotoGalleryProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner mb-4"></div>
        <p className="text-slate-600 font-medium">Carregando fotos...</p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
          <svg className="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma foto encontrada</h3>
        <p className="text-slate-600 max-w-md">
          Tente ajustar os filtros ou sincronize suas fotos do Google Drive
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
}

