import React from 'react';
import type { Photo } from '@/types/photo';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function PhotoCard({ photo, onClick, isSelectionMode = false, isSelected = false, onToggleSelect }: PhotoCardProps) {
  const { imageToken, authenticated } = useAuth();
  
  // Usar rota de proxy do Next.js com token na query string se disponível
  const getImageUrl = () => {
    const baseUrl = `/api/photos/${photo.id}/image`;
    if (imageToken) {
      const urlWithToken = `${baseUrl}?token=${encodeURIComponent(imageToken)}`;
      return urlWithToken;
    }
    return baseUrl;
  };
  
  const imageUrl = React.useMemo(() => getImageUrl(), [photo.id, imageToken]);
  const [isEditingPerson, setIsEditingPerson] = React.useState(false);
  const [personName, setPersonName] = React.useState(photo.person_tag || '');
  const [saving, setSaving] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState(() => {
    // Inicializar com thumbnail se disponível, senão usar URL com token quando disponível
    return photo.thumbnail_url || imageUrl;
  });
  const [imgError, setImgError] = React.useState(false);
  
  // Atualizar URL da imagem quando imageToken mudar ou quando autenticado
  React.useEffect(() => {
    if (authenticated) {
      // Se autenticado, sempre usar URL com token quando disponível
      setImgSrc(imageUrl);
      setImgError(false);
    }
  }, [imageUrl, authenticated]);

  const handleImageError = () => {
    // Se conversão falhar, tenta thumbnail como fallback
    if (photo.thumbnail_url && imgSrc !== photo.thumbnail_url) {
      setImgSrc(photo.thumbnail_url);
    } else {
      // Se tudo falhou, mostra erro
      setImgError(true);
    }
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelect?.();
    } else {
      onClick?.();
    }
  };

  const getEmotionEmoji = (likelihood: string | null) => {
    switch (likelihood) {
      case 'VERY_LIKELY': return '😄';
      case 'LIKELY': return '🙂';
      case 'POSSIBLE': return '😐';
      default: return null;
    }
  };

  const handleSavePerson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setSaving(true);
      const api = (await import('@/utils/api')).api;
      const axios = (await import('axios')).default;
      
      // Construir URL com token se disponível (fallback para produção)
      let url = `/api/photos/${photo.id}`;
      if (imageToken) {
        url += `?token=${encodeURIComponent(imageToken)}`;
      }
      
      await axios.put(url, { person_tag: personName || null }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIsEditingPerson(false);
      // Atualizar foto localmente
      photo.person_tag = personName || null;
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingPerson(false);
    setPersonName(photo.person_tag || '');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photos/${photo.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer ${
        isSelected 
          ? 'ring-4 ring-primary-500 border-transparent scale-95' 
          : 'border border-slate-200/60'
      }`}
    >
      {/* Imagem */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {!imgError ? (
          <img
            src={imgSrc}
            alt={photo.name}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">{photo.mime_type?.split('/')[1]?.toUpperCase()}</p>
          </div>
        )}
        
        {/* Overlay com informações */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-sm font-medium truncate">{photo.name}</p>
          </div>
        </div>

        {/* Checkbox de Seleção */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSelected 
                  ? 'bg-primary-500 scale-110 shadow-lg' 
                  : 'bg-white/90 backdrop-blur-sm border-2 border-white'
              }`}
            >
              {isSelected && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Badges e Ações */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Botão Download */}
          {!isSelectionMode && (
            <button
              onClick={handleDownload}
              className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/90 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
              title="Baixar foto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          
          {photo.analyzed && photo.faces_detected > 0 && (
            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {photo.faces_detected}
            </div>
          )}
          
          {photo.joy_likelihood && getEmotionEmoji(photo.joy_likelihood) && (
            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-lg">
              {getEmotionEmoji(photo.joy_likelihood)}
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="p-4 space-y-2">
        {photo.created_at && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(new Date(photo.created_at), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        )}

        {((photo as any).event_city || photo.location_name) && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {/* Priorizar location_name (manual) sobre event_city (automático) */}
            {photo.location_name || (photo as any).event_city}
          </div>
        )}

        {(photo as any).event_type && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold">
              {(photo as any).event_type}
            </span>
          </div>
        )}

        {/* Campo de Pessoa - Edição Rápida */}
        {!isEditingPerson ? (
          <div 
            onClick={(e) => { e.stopPropagation(); setIsEditingPerson(true); }}
            className="flex items-center gap-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg px-2 py-1 -mx-2 cursor-text transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {photo.person_tag ? (
              <span className="font-medium text-slate-700">{photo.person_tag}</span>
            ) : (
              <span className="text-slate-400 italic">Adicionar pessoa...</span>
            )}
          </div>
        ) : (
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2">
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSavePerson(e as any);
                if (e.key === 'Escape') handleCancelEdit(e as any);
              }}
              placeholder="Nome da pessoa"
              autoFocus
              className="w-full px-2 py-1 text-xs border border-primary-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex gap-1">
              <button
                onClick={handleSavePerson}
                disabled={saving}
                className="flex-1 px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {saving ? '...' : '✓'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded hover:bg-slate-300 flex items-center justify-center gap-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

