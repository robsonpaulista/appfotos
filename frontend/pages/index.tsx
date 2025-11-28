import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { PhotoFilters } from '@/components/PhotoFilters';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Pagination } from '@/components/Pagination';
import { SyncButton } from '@/components/SyncButton';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { Dashboard } from '@/components/Dashboard';
import { DevTools } from '@/components/DevTools';
import { BulkEditBar } from '@/components/BulkEditBar';
import { GeocodingButton } from '@/components/GeocodingButton';
import { useAuth } from '@/hooks/useAuth';
import { usePhotos } from '@/hooks/usePhotos';
import { usePhotoSelection } from '@/hooks/usePhotoSelection';
import type { Photo } from '@/types/photo';

export default function Home() {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const { photos, filters, loading, pagination, updateFilters, goToPage, refresh } = usePhotos({}, authenticated);
  const { 
    selectedPhotos, 
    selectedCount, 
    isSelectionMode, 
    isSelected, 
    togglePhoto, 
    selectAll, 
    deselectAll,
    enterSelectionMode,
    exitSelectionMode 
  } = usePhotoSelection();

  useEffect(() => {
    // Verificar se voltou do callback de autenticação
    if (router.query.auth === 'success') {
      router.replace('/', undefined, { shallow: true });
      refresh();
    } else if (router.query.auth === 'error') {
      // Limpar a URL do erro sem recarregar a página
      router.replace('/', undefined, { shallow: true });
      console.error('Erro na autenticação:', router.query.reason || 'Desconhecido');
    }
  }, [router.query, refresh, router]);

  const handlePhotoClick = (photo: Photo) => {
    router.push(`/photo/${photo.id}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-slate-600 font-medium">Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>PhotoFinder - Organizador Inteligente de Fotos</title>
        </Head>
        <Header />
        <main className="min-h-screen">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-2xl shadow-primary-500/40 mb-8 animate-scale-in">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                Organize suas fotos com
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                  Inteligência Artificial
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                Encontre qualquer foto instantaneamente. Busque por emoções, pessoas, locais e datas 
                diretamente do seu Google Drive.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => {}}
                  className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-2xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center space-x-3"
                >
                  <span>Começar agora</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-24 animate-slide-up">
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border border-slate-200/60">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Detecção de Emoções</h3>
                <p className="text-slate-600 leading-relaxed">
                  Encontre fotos por expressões faciais. Busque momentos de alegria, surpresa ou serenidade.
                </p>
              </div>

              <div className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border border-slate-200/60">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Busca por Local</h3>
                <p className="text-slate-600 leading-relaxed">
                  Organize suas memórias por localização. Reviva viagens e momentos especiais.
                </p>
              </div>

              <div className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border border-slate-200/60">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Reconhecimento Facial</h3>
                <p className="text-slate-600 leading-relaxed">
                  Identifique pessoas automaticamente. Agrupe fotos por amigos e família.
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
                  Rápido
                </div>
                <div className="text-sm text-slate-600">Busca instantânea</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
                  Seguro
                </div>
                <div className="text-sm text-slate-600">Seus dados protegidos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
                  Inteligente
                </div>
                <div className="text-sm text-slate-600">Powered by IA</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
                  Gratuito
                </div>
                <div className="text-sm text-slate-600">Para sempre</div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>PhotoFinder - Minhas Fotos</title>
      </Head>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Geocoding Backup (só aparece se necessário) */}
          <GeocodingButton onComplete={refresh} />

          {/* Filters */}
          <PhotoFilters filters={filters} onFilterChange={updateFilters} />

          {/* Botão Selecionar + Results */}
          {loading && !photos.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner mb-4"></div>
              <p className="text-slate-600 font-medium">Carregando fotos...</p>
            </div>
          ) : (
            <>
              {/* Header dos Resultados + Ações */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {pagination.total} {pagination.total === 1 ? 'foto' : 'fotos'}
                    </h2>
                    {pagination.total > 0 && (
                      <p className="text-sm text-slate-600">
                        Página {pagination.page} de {pagination.totalPages}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status de Sincronização */}
                  <SyncStatusBadge />

                  {/* Botão Sincronizar */}
                  <SyncButton onSyncComplete={refresh} />

                  {/* Botão Selecionar (só aparece se tiver fotos) */}
                  {photos.length > 0 && (
                    <div>
                      {!isSelectionMode ? (
                        <button
                          onClick={enterSelectionMode}
                          className="px-6 py-2.5 bg-white text-slate-700 font-medium rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Selecionar
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => selectAll(photos)}
                            className="px-4 py-2 bg-primary-100 text-primary-700 font-medium rounded-lg hover:bg-primary-200 transition-colors text-sm"
                          >
                            Todas
                          </button>
                          <button
                            onClick={deselectAll}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                          >
                            Nenhuma
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

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

      {/* Dev Tools - Botão flutuante (apenas em desenvolvimento) */}
      {process.env.NODE_ENV !== 'production' && (
        <DevTools onDataCleared={refresh} />
      )}

      {/* Barra de Edição em Lote */}
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

