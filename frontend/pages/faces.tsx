import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { FaceClusteringPanel } from '@/components/FaceClusteringPanel';
import { useAuth } from '@/hooks/useAuth';

interface Person {
  id: string;
  name: string;
  photo_count: number;
  created_at: string;
}

export default function FacesPage() {
  const { authenticated, loading: authLoading, imageToken } = useAuth();
  
  const getImageUrl = (photoId: string) => {
    const baseUrl = `/api/photos/${photoId}/image`;
    return imageToken ? `${baseUrl}?token=${encodeURIComponent(imageToken)}` : baseUrl;
  };
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personPhotos, setPersonPhotos] = useState<any[]>([]);

  useEffect(() => {
    if (authenticated) {
      loadPersons();
    }
  }, [authenticated]);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/persons`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Falha ao carregar pessoas');
      
      const data = await response.json();
      setPersons(data);
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonPhotos = async (personId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/person/${personId}/photos`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Falha ao carregar fotos');
      
      const data = await response.json();
      setPersonPhotos(data);
    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
    }
  };

  const handlePersonClick = async (person: Person) => {
    setSelectedPerson(person);
    await loadPersonPhotos(person.id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Reconhecimento Facial - PhotoFinder</title>
        </Head>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Faça login para acessar o reconhecimento facial
          </h1>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reconhecimento Facial - PhotoFinder</title>
      </Head>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Título */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reconhecimento Facial</h1>
              <p className="text-slate-600">Gerencie pessoas e agrupe rostos similares</p>
            </div>
          </div>

          {/* Painel de Agrupamento */}
          <FaceClusteringPanel />

          {/* Lista de Pessoas */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Pessoas Identificadas ({persons.length})
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
              </div>
            ) : persons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {persons.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => handlePersonClick(person)}
                    className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-600">
                          {person.photo_count} foto(s)
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>Nenhuma pessoa identificada ainda</p>
                <p className="text-sm text-slate-400 mt-1">
                  Analise fotos e agrupe rostos para começar
                </p>
              </div>
            )}
          </div>

          {/* Modal de Fotos da Pessoa */}
          {selectedPerson && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPerson(null)}
            >
              <div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedPerson.name}
                    </h3>
                    <button
                      onClick={() => setSelectedPerson(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {personPhotos.length} foto(s)
                  </p>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {personPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                        onClick={() => window.open(`/photo/${photo.id}`, '_blank')}
                      >
                        <img
                          src={photo.thumbnail_url || getImageUrl(photo.id)}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

