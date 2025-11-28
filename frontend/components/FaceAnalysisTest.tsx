import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { photosApi } from '@/utils/api';
import type { Photo } from '@/types/photo';

interface EmotionData {
  joy: string;
  sorrow: string;
  anger: string;
  surprise: string;
}

interface AnalyzedPhoto extends Photo {
  emotions?: EmotionData;
}

export const FaceAnalysisTest: React.FC = () => {
  const [photos, setPhotos] = useState<AnalyzedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'with_faces' | 'no_faces'>('all');
  const [stats, setStats] = useState({
    total: 0,
    withFaces: 0,
    withoutFaces: 0,
    byEmotion: {
      joy: 0,
      sorrow: 0,
      anger: 0,
      surprise: 0,
      neutral: 0
    }
  });

  useEffect(() => {
    loadPhotos();
  }, [filter]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 100 };
      
      if (filter === 'with_faces') {
        filters.minFaces = 1;
      } else if (filter === 'no_faces') {
        filters.maxFaces = 0;
      }

      const response = await photosApi.getPhotos(filters);
      const photosData = response.data || [];
      
      setPhotos(photosData);
      calculateStats(photosData);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (photosData: Photo[]) => {
    const withFaces = photosData.filter(p => (p.faces_detected || 0) > 0).length;
    const withoutFaces = photosData.length - withFaces;
    
    const emotionCounts = {
      joy: 0,
      sorrow: 0,
      anger: 0,
      surprise: 0,
      neutral: 0
    };

    photosData.forEach(photo => {
      if (photo.joy_likelihood === 'VERY_LIKELY' || photo.joy_likelihood === 'LIKELY') {
        emotionCounts.joy++;
      } else if (photo.sorrow_likelihood === 'VERY_LIKELY' || photo.sorrow_likelihood === 'LIKELY') {
        emotionCounts.sorrow++;
      } else if (photo.anger_likelihood === 'VERY_LIKELY' || photo.anger_likelihood === 'LIKELY') {
        emotionCounts.anger++;
      } else if (photo.surprise_likelihood === 'VERY_LIKELY' || photo.surprise_likelihood === 'LIKELY') {
        emotionCounts.surprise++;
      } else if ((photo.faces_detected || 0) > 0) {
        emotionCounts.neutral++;
      }
    });

    setStats({
      total: photosData.length,
      withFaces,
      withoutFaces,
      byEmotion: emotionCounts
    });
  };

  const getEmotionIcon = (photo: Photo): string => {
    if ((photo.faces_detected || 0) === 0) return '📷';
    
    if (photo.joy_likelihood === 'VERY_LIKELY' || photo.joy_likelihood === 'LIKELY') {
      return '😊';
    } else if (photo.sorrow_likelihood === 'VERY_LIKELY' || photo.sorrow_likelihood === 'LIKELY') {
      return '😢';
    } else if (photo.anger_likelihood === 'VERY_LIKELY' || photo.anger_likelihood === 'LIKELY') {
      return '😠';
    } else if (photo.surprise_likelihood === 'VERY_LIKELY' || photo.surprise_likelihood === 'LIKELY') {
      return '😮';
    }
    return '😐';
  };

  const getEmotionLabel = (photo: Photo): string => {
    if ((photo.faces_detected || 0) === 0) return 'Sem rostos';
    
    if (photo.joy_likelihood === 'VERY_LIKELY' || photo.joy_likelihood === 'LIKELY') {
      return 'Alegria';
    } else if (photo.sorrow_likelihood === 'VERY_LIKELY' || photo.sorrow_likelihood === 'LIKELY') {
      return 'Tristeza';
    } else if (photo.anger_likelihood === 'VERY_LIKELY' || photo.anger_likelihood === 'LIKELY') {
      return 'Raiva';
    } else if (photo.surprise_likelihood === 'VERY_LIKELY' || photo.surprise_likelihood === 'LIKELY') {
      return 'Surpresa';
    }
    return 'Neutro';
  };

  const getLikelihoodColor = (likelihood?: string): string => {
    switch (likelihood) {
      case 'VERY_LIKELY': return 'bg-green-500';
      case 'LIKELY': return 'bg-green-400';
      case 'POSSIBLE': return 'bg-yellow-400';
      case 'UNLIKELY': return 'bg-orange-400';
      case 'VERY_UNLIKELY': return 'bg-red-400';
      default: return 'bg-gray-300';
    }
  };

  const getLikelihoodText = (likelihood?: string): string => {
    switch (likelihood) {
      case 'VERY_LIKELY': return 'Muito Provável';
      case 'LIKELY': return 'Provável';
      case 'POSSIBLE': return 'Possível';
      case 'UNLIKELY': return 'Improvável';
      case 'VERY_UNLIKELY': return 'Muito Improvável';
      default: return 'Desconhecido';
    }
  };

  const handleReanalyze = async (force: boolean = false) => {
    if (!window.confirm(
      force 
        ? 'Deseja re-analisar TODAS as fotos? Isso pode levar alguns minutos.' 
        : 'Deseja analisar apenas as fotos que ainda não foram analisadas?'
    )) {
      return;
    }

    setAnalyzing(true);
    try {
      const result = await photosApi.reanalyzePhotos(undefined, force);
      alert(`Análise concluída!\n\nProcessadas: ${result.processed}\nSucesso: ${result.success}\nFalhas: ${result.failed}`);
      
      // Recarregar fotos
      await loadPhotos();
    } catch (error) {
      console.error('Erro ao re-analisar fotos:', error);
      alert('Erro ao re-analisar fotos. Verifique o console para mais detalhes.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner mb-4"></div>
        <p className="text-slate-600 font-medium">Carregando análises...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Teste de IA - Reconhecimento Facial</h1>
              <p className="text-purple-100">Análise de rostos e expressões nas suas fotos</p>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={() => handleReanalyze(false)}
              disabled={analyzing}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analisando...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Analisar Pendentes
                </>
              )}
            </button>
            <button
              onClick={() => handleReanalyze(true)}
              disabled={analyzing}
              className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>🔄</span>
              Re-analisar Todas
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            {stats.total}
          </div>
          <div className="text-sm text-slate-600 mt-1">Total de Fotos</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
            {stats.withFaces}
          </div>
          <div className="text-sm text-slate-600 mt-1">Com Rostos</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400">
            {stats.withoutFaces}
          </div>
          <div className="text-sm text-slate-600 mt-1">Sem Rostos</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
            {stats.withFaces > 0 ? Math.round((stats.withFaces / stats.total) * 100) : 0}%
          </div>
          <div className="text-sm text-slate-600 mt-1">Taxa Detecção</div>
        </div>
      </div>

      {/* Estatísticas por Emoção */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Distribuição de Emoções</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2">😊</div>
            <div className="text-2xl font-bold text-amber-600">{stats.byEmotion.joy}</div>
            <div className="text-sm text-slate-600">Alegria</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">😢</div>
            <div className="text-2xl font-bold text-blue-600">{stats.byEmotion.sorrow}</div>
            <div className="text-sm text-slate-600">Tristeza</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">😠</div>
            <div className="text-2xl font-bold text-red-600">{stats.byEmotion.anger}</div>
            <div className="text-sm text-slate-600">Raiva</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">😮</div>
            <div className="text-2xl font-bold text-purple-600">{stats.byEmotion.surprise}</div>
            <div className="text-sm text-slate-600">Surpresa</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">😐</div>
            <div className="text-2xl font-bold text-slate-600">{stats.byEmotion.neutral}</div>
            <div className="text-sm text-slate-600">Neutro</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
          }`}
        >
          Todas ({stats.total})
        </button>
        <button
          onClick={() => setFilter('with_faces')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            filter === 'with_faces'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
          }`}
        >
          Com Rostos ({stats.withFaces})
        </button>
        <button
          onClick={() => setFilter('no_faces')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            filter === 'no_faces'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
          }`}
        >
          Sem Rostos ({stats.withoutFaces})
        </button>
      </div>

      {/* Grade de Fotos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Imagem */}
            <div className="relative aspect-video bg-slate-100">
              <Image
                src={photosApi.getImageUrl(photo.id)}
                alt={photo.name}
                fill
                className="object-cover"
              />
              
              {/* Badge de rostos */}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">{getEmotionIcon(photo)}</span>
                {(photo.faces_detected || 0) > 0 && (
                  <span>{photo.faces_detected} {photo.faces_detected === 1 ? 'rosto' : 'rostos'}</span>
                )}
              </div>
            </div>

            {/* Detalhes */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900 truncate">{photo.name}</h3>
                <p className="text-sm text-slate-600">
                  Emoção predominante: <span className="font-semibold">{getEmotionLabel(photo)}</span>
                </p>
              </div>

              {/* Análise de Emoções */}
              {(photo.faces_detected || 0) > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase">Análise Detalhada</div>
                  
                  {/* Alegria */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😊</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Alegria</span>
                        <span className="text-slate-900 font-semibold">
                          {getLikelihoodText(photo.joy_likelihood)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getLikelihoodColor(photo.joy_likelihood)} transition-all duration-500`}
                          style={{ width: photo.joy_likelihood === 'VERY_LIKELY' ? '100%' : 
                                           photo.joy_likelihood === 'LIKELY' ? '80%' : 
                                           photo.joy_likelihood === 'POSSIBLE' ? '50%' : 
                                           photo.joy_likelihood === 'UNLIKELY' ? '30%' : '10%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tristeza */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😢</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Tristeza</span>
                        <span className="text-slate-900 font-semibold">
                          {getLikelihoodText(photo.sorrow_likelihood)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getLikelihoodColor(photo.sorrow_likelihood)} transition-all duration-500`}
                          style={{ width: photo.sorrow_likelihood === 'VERY_LIKELY' ? '100%' : 
                                           photo.sorrow_likelihood === 'LIKELY' ? '80%' : 
                                           photo.sorrow_likelihood === 'POSSIBLE' ? '50%' : 
                                           photo.sorrow_likelihood === 'UNLIKELY' ? '30%' : '10%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Raiva */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😠</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Raiva</span>
                        <span className="text-slate-900 font-semibold">
                          {getLikelihoodText(photo.anger_likelihood)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getLikelihoodColor(photo.anger_likelihood)} transition-all duration-500`}
                          style={{ width: photo.anger_likelihood === 'VERY_LIKELY' ? '100%' : 
                                           photo.anger_likelihood === 'LIKELY' ? '80%' : 
                                           photo.anger_likelihood === 'POSSIBLE' ? '50%' : 
                                           photo.anger_likelihood === 'UNLIKELY' ? '30%' : '10%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Surpresa */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😮</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Surpresa</span>
                        <span className="text-slate-900 font-semibold">
                          {getLikelihoodText(photo.surprise_likelihood)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getLikelihoodColor(photo.surprise_likelihood)} transition-all duration-500`}
                          style={{ width: photo.surprise_likelihood === 'VERY_LIKELY' ? '100%' : 
                                           photo.surprise_likelihood === 'LIKELY' ? '80%' : 
                                           photo.surprise_likelihood === 'POSSIBLE' ? '50%' : 
                                           photo.surprise_likelihood === 'UNLIKELY' ? '30%' : '10%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-slate-600">Nenhuma foto encontrada com os filtros selecionados</p>
        </div>
      )}
    </div>
  );
};

