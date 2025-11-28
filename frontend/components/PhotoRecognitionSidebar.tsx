import React, { useState } from 'react';
import { FaTimes, FaCalendar, FaMapMarkerAlt, FaGoogleDrive, FaUser } from 'react-icons/fa';
import type { Photo } from '@/types/photo';
import { photosApi } from '@/utils/api';
import { formatDateTime } from '@/utils/formatters';
import { FaceRecognitionPanel } from './FaceRecognitionPanel';

interface PhotoRecognitionSidebarProps {
  photo: Photo | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function PhotoRecognitionSidebar({ photo, onClose, onRefresh }: PhotoRecognitionSidebarProps) {
  if (!photo) {
    return (
      <aside className="hidden xl:flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-lg min-h-[460px] justify-center text-center text-slate-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-base font-medium">Selecione uma foto para iniciar o reconhecimento facial.</p>
        <p className="text-sm text-slate-400 mt-2">O painel aparecerá aqui com a análise e as ações disponíveis.</p>
      </aside>
    );
  }

  const imageUrl = photosApi.getImageUrl(photo.id);
  const driveUrl = photo.drive_id
    ? `https://drive.google.com/file/d/${photo.drive_id}/view?usp=drive_link`
    : null;
  const [imageError, setImageError] = useState(false);

  return (
    <aside className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col">
      <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200/80">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{photo.name || 'Foto sem nome'}</h3>
          {photo.created_at && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <FaCalendar className="text-slate-400" />
              {formatDateTime(photo.created_at)}
            </div>
          )}
          {(photo.location_name || (photo as any).event_city) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <FaMapMarkerAlt className="text-rose-500" />
              {photo.location_name || (photo as any).event_city}
            </div>
          )}
          {photo.person_tag && (
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <FaUser className="text-indigo-500" />
              {photo.person_tag}
            </div>
          )}
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary-600 hover:text-primary-700 mt-2"
            >
              <FaGoogleDrive />
              Abrir no Drive
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Fechar painel"
        >
          <FaTimes />
        </button>
      </div>

      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={photo.name || 'Foto selecionada'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-center">Não foi possível carregar a imagem</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <FaceRecognitionPanel
          photoId={photo.id}
          imageUrl={imageUrl}
          onUpdate={onRefresh}
        />
      </div>
    </aside>
  );
}


