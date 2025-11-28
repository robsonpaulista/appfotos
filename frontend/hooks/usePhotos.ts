import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import type { Photo, PhotoFilters, PhotosResponse } from '@/types/photo';

export function usePhotos(initialFilters: PhotoFilters = {}, enabled: boolean = true) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filters, setFilters] = useState<PhotoFilters>(initialFilters);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchPhotos = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response: PhotosResponse = await api.getPhotos({ ...filters, page: pagination.page });
      setPhotos(response.photos);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      setError('Falha ao carregar fotos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchPhotos();
    }
  }, [fetchPhotos, enabled]);

  const updateFilters = (newFilters: Partial<PhotoFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  return {
    photos,
    filters,
    loading,
    error,
    pagination,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    refresh: fetchPhotos,
  };
}

