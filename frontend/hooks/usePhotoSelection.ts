import { useState } from 'react';
import type { Photo } from '@/types/photo';

export function usePhotoSelection() {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const togglePhoto = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAll = (photos: Photo[]) => {
    const allIds = new Set(photos.map(p => p.id));
    setSelectedPhotos(allIds);
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const isSelected = (photoId: string) => {
    return selectedPhotos.has(photoId);
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    deselectAll();
  };

  return {
    selectedPhotos: Array.from(selectedPhotos),
    selectedCount: selectedPhotos.size,
    isSelectionMode,
    isSelected,
    togglePhoto,
    selectAll,
    deselectAll,
    enterSelectionMode,
    exitSelectionMode,
  };
}

