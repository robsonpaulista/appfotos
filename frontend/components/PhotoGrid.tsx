'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaMapMarkerAlt, FaSmile, FaUser, FaCalendar } from 'react-icons/fa';
import type { Photo } from '@/types/photo';
import { formatDate, formatExpression } from '@/utils/formatters';
import { photosApi } from '@/utils/api';
import PhotoModal from './PhotoModal';

interface PhotoGridProps {
  photos: Photo[];
  loading?: boolean;
}

export default function PhotoGrid({ photos, loading = false }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-6xl mb-4">📷</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhuma foto encontrada
        </h3>
        <p className="text-gray-500">
          Tente ajustar os filtros ou sincronize suas fotos do Google Drive
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="photo-card"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="aspect-square relative">
              <Image
                src={photosApi.getThumbnailUrl(photo.id)}
                alt={photo.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              
              {/* Overlay com informações */}
              <div className="photo-overlay">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-medium text-sm truncate mb-1">
                    {photo.name}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {photo.person_tag && (
                      <span className="flex items-center bg-black/50 px-2 py-1 rounded">
                        <FaUser className="mr-1" />
                        {photo.person_tag}
                      </span>
                    )}
                    
                    {photo.expression && photo.expression !== 'unknown' && (
                      <span className="flex items-center bg-black/50 px-2 py-1 rounded">
                        {formatExpression(photo.expression).emoji}
                      </span>
                    )}
                    
                    {photo.location_name && (
                      <span className="flex items-center bg-black/50 px-2 py-1 rounded">
                        <FaMapMarkerAlt className="mr-1" />
                        {photo.location_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de detalhes */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}

