import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';
import type { Photo } from '@/types/photo';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Ícones SVG inline
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const InformationCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XMarkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export default function PhotoDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { authenticated, loading: authLoading, imageToken } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [personTag, setPersonTag] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [imgSrc, setImgSrc] = useState<string>('');
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    if (id && authenticated) {
      loadPhoto();
    }
  }, [id, authenticated]);

  const loadPhoto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.getPhoto(id as string);
      
      setPhoto(data);
      setPersonTag(data.person_tag || '');
      setLocationName(data.location_name || '');
      
      // Usar rota de proxy do Next.js com token se disponível
      const baseUrl = `/api/photos/${data.id}/image`;
      const imageUrl = imageToken ? `${baseUrl}?token=${encodeURIComponent(imageToken)}` : baseUrl;
      setImgSrc(imageUrl);
      setImgError(false);
    } catch (err: any) {
      console.error('Erro ao carregar foto:', err);
      
      if (err.response?.status === 404) {
        setError('Foto não encontrada');
      } else if (err.response?.status === 400) {
        setError('ID de foto inválido');
      } else {
        setError('Falha ao carregar foto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    if (!photo) return;
    
    // Se a imagem principal falhou e existe thumbnail, tenta thumbnail
    if (photo.thumbnail_url && imgSrc !== photo.thumbnail_url) {
      setImgSrc(photo.thumbnail_url);
    } else {
      // Se tudo falhou, marca como erro
      setImgError(true);
    }
  };

  const handleSave = async () => {
    if (!photo) return;

    try {
      await api.updatePhoto(photo.id, {
        person_tag: personTag || null,
        location_name: locationName || null,
      });
      setEditing(false);
      loadPhoto();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Falha ao salvar alterações');
    }
  };

  const handleDownload = () => {
    if (!photo) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const downloadUrl = `${backendUrl}/api/photos/${photo.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando foto...</p>
          </div>
        </div>
      </>
    );
  }

  if (!authenticated) {
    router.push('/');
    return null;
  }

  if (error || !photo) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {error || 'Foto não encontrada'}
            </h2>
            <p className="text-slate-600 mb-6">A foto que você está procurando não existe ou foi removida.</p>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              Voltar para Galeria
            </button>
          </div>
        </div>
      </>
    );
  }

  const getEmotionLabel = (likelihood: string | null) => {
    switch (likelihood) {
      case 'VERY_LIKELY': return 'Muito provável';
      case 'LIKELY': return 'Provável';
      case 'POSSIBLE': return 'Possível';
      case 'UNLIKELY': return 'Improvável';
      case 'VERY_UNLIKELY': return 'Muito improvável';
      default: return 'Desconhecido';
    }
  };

  return (
    <>
      <Head>
        <title>{photo.name} - PhotoFinder</title>
      </Head>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors mb-6 font-medium"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              <ArrowLeftIcon />
            </span>
            Voltar para Galeria
          </button>

          {/* Container Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Imagem - Ocupa 2 colunas */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative min-h-[500px] lg:min-h-[700px] bg-slate-100">
                {!imgError ? (
                  <img 
                    src={imgSrc} 
                    alt={photo.name}
                    onError={handleImageError}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">Imagem não disponível</p>
                  </div>
                )}
              </div>
              
              {/* Nome da foto */}
              <div className="p-6 border-t border-slate-200">
                <h1 className="text-lg font-semibold text-slate-800 truncate">
                  {photo.name}
                </h1>
                {(photo.mime_type?.toLowerCase().includes('heif') || 
                  photo.mime_type?.toLowerCase().includes('heic')) && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Formato HEIC convertido para JPEG em alta qualidade
                  </p>
                )}
              </div>
            </div>

            {/* Informações - Ocupa 1 coluna */}
            <div className="space-y-6">
              {!editing ? (
                <>
                  {/* Data */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                        <CalendarIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Data</h3>
                        <p className="text-base font-semibold text-slate-900">
                          {photo.created_at
                            ? format(new Date(photo.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                            : 'Não disponível'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pessoa */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-600">
                        <UserIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Pessoa</h3>
                        <p className="text-base font-semibold text-slate-900">
                          {photo.person_tag || 'Não identificada'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Local */}
                  {(photo.location_name || photo.event_city) && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-green-600">
                          <MapPinIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-slate-500 mb-1">Local</h3>
                          <p className="text-base font-semibold text-slate-900">
                            {photo.event_city || photo.location_name}
                          </p>
                          {photo.gps_lat && photo.gps_lng && (
                            <p className="text-xs text-slate-500 mt-1">
                              {photo.gps_lat.toFixed(6)}, {photo.gps_lng.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Análise com IA */}
                  {photo.analyzed && photo.faces_detected > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                          <SparklesIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-slate-500 mb-1">Análise com IA</h3>
                          <p className="text-sm text-slate-700">
                            {photo.faces_detected} {photo.faces_detected === 1 ? 'rosto detectado' : 'rostos detectados'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {photo.joy_likelihood && photo.joy_likelihood !== 'UNKNOWN' && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">😄 Alegria</p>
                            <p className="text-sm font-medium text-slate-900">
                              {getEmotionLabel(photo.joy_likelihood)}
                            </p>
                          </div>
                        )}
                        {photo.sorrow_likelihood && photo.sorrow_likelihood !== 'UNKNOWN' && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">😢 Tristeza</p>
                            <p className="text-sm font-medium text-slate-900">
                              {getEmotionLabel(photo.sorrow_likelihood)}
                            </p>
                          </div>
                        )}
                        {photo.anger_likelihood && photo.anger_likelihood !== 'UNKNOWN' && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">😠 Raiva</p>
                            <p className="text-sm font-medium text-slate-900">
                              {getEmotionLabel(photo.anger_likelihood)}
                            </p>
                          </div>
                        )}
                        {photo.surprise_likelihood && photo.surprise_likelihood !== 'UNKNOWN' && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">😲 Surpresa</p>
                            <p className="text-sm font-medium text-slate-900">
                              {getEmotionLabel(photo.surprise_likelihood)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detalhes do Arquivo */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-600">
                        <InformationCircleIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Detalhes do Arquivo</h3>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Tipo</span>
                        <span className="text-sm font-medium text-slate-900">{photo.mime_type}</span>
                      </div>
                      {photo.width && photo.height && (
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-600">Dimensões</span>
                          <span className="text-sm font-medium text-slate-900">
                            {photo.width} × {photo.height}px
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-slate-600">Tamanho</span>
                        <span className="text-sm font-medium text-slate-900">
                          {(photo.size_bytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar Foto
                    </button>
                    
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-4 rounded-2xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl font-medium"
                    >
                      <PencilIcon />
                      Editar Informações
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Editar Informações</h2>
                  
                  {/* Campo Pessoa */}
                  <div>
                    <label htmlFor="person" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <span className="text-purple-600">
                        <UserIcon />
                      </span>
                      Pessoa
                    </label>
                    <input
                      id="person"
                      type="text"
                      value={personTag}
                      onChange={(e) => setPersonTag(e.target.value)}
                      placeholder="Nome da pessoa"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  {/* Campo Local */}
                  <div>
                    <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <span className="text-green-600">
                        <MapPinIcon />
                      </span>
                      Local
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Nome do local"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
                    >
                      <CheckIcon />
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                    >
                      <XMarkIcon />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

