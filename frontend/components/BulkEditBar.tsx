import React, { useState } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

interface BulkEditBarProps {
  selectedCount: number;
  selectedPhotos: string[];
  onComplete: () => void;
  onCancel: () => void;
}

type EditMode = 'person' | 'location' | 'event' | null;

export function BulkEditBar({ selectedCount, selectedPhotos, onComplete, onCancel }: BulkEditBarProps) {
  const { imageToken } = useAuth();
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (!inputValue.trim()) {
      alert('Digite um valor primeiro!');
      return;
    }

    const fieldNames = {
      person: 'pessoa',
      location: 'local',
      event: 'evento'
    };

    const fieldName = editMode ? fieldNames[editMode] : '';

    if (!confirm(`Adicionar "${inputValue}" como ${fieldName} em ${selectedCount} fotos?`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Mapear o modo de edição para o campo correto
      const updateData: any = {};
      if (editMode === 'person') {
        updateData.person_tag = inputValue;
      } else if (editMode === 'location') {
        updateData.location_name = inputValue;
      } else if (editMode === 'event') {
        updateData.event_type = inputValue;
      }

      // Atualizar todas as fotos selecionadas
      const promises = selectedPhotos.map(photoId => {
        // Construir URL com token se disponível (fallback para produção)
        let url = `/api/photos/${photoId}`;
        if (imageToken) {
          url += `?token=${encodeURIComponent(imageToken)}`;
        }
        
        return axios.put(url, updateData, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });
      });

      await Promise.all(promises);
      
      alert(`✅ ${selectedCount} fotos atualizadas com sucesso!`);
      setInputValue('');
      setEditMode(null);
      onComplete();
    } catch (error) {
      console.error('Erro ao atualizar fotos:', error);
      alert('❌ Erro ao atualizar fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (!confirm(`Deseja baixar ${selectedCount} fotos selecionadas?`)) {
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    
    // Abrir cada foto em uma nova aba para download
    selectedPhotos.forEach((photoId, index) => {
      setTimeout(() => {
        const downloadUrl = `${backendUrl}/api/photos/${photoId}/download`;
        window.open(downloadUrl, '_blank');
      }, index * 300); // Delay de 300ms entre downloads para não sobrecarregar
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 shadow-2xl border-t-4 border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-white">
                  <div className="font-bold text-lg">{selectedCount} {selectedCount === 1 ? 'foto selecionada' : 'fotos selecionadas'}</div>
                  <div className="text-xs text-primary-100">Modo de seleção ativo</div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 flex-wrap">
              {!editMode ? (
                <>
                  {/* Botão Adicionar Pessoa */}
                  <button
                    onClick={() => setEditMode('person')}
                    className="px-5 py-2.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Pessoa
                  </button>

                  {/* Botão Adicionar Local */}
                  <button
                    onClick={() => setEditMode('location')}
                    className="px-5 py-2.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Local
                  </button>

                  {/* Botão Adicionar Evento */}
                  <button
                    onClick={() => setEditMode('event')}
                    className="px-5 py-2.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Evento
                  </button>

                  {/* Separador */}
                  <div className="h-8 w-px bg-white/30"></div>

                  {/* Botão Baixar Fotos */}
                  <button
                    onClick={handleBulkDownload}
                    className="px-5 py-2.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar {selectedCount}
                  </button>

                  {/* Botão Cancelar */}
                  <button
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300 border-2 border-white/30"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBulkUpdate()}
                    placeholder={
                      editMode === 'person' ? 'Nome da pessoa...' :
                      editMode === 'location' ? 'Nome do local...' :
                      'Nome do evento...'
                    }
                    className="px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-slate-900 placeholder:text-slate-400 min-w-[250px]"
                    autoFocus
                  />
                  <button
                    onClick={handleBulkUpdate}
                    disabled={loading || !inputValue.trim()}
                    className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvar em {selectedCount}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(null);
                      setInputValue('');
                    }}
                    className="px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

