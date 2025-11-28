import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';

interface Folder {
  id: string;
  name: string;
  parents?: string[];
  children?: Folder[];
}

interface FolderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string, folderName: string, tags?: { person?: string; location?: string; event?: string }) => void;
}

export function FolderSelector({ isOpen, onClose, onSelectFolder }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Tags para aplicar nas fotos importadas
  const [personTag, setPersonTag] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [eventTag, setEventTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await api.getFolders();
      setFolders(response.tree || []);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSelectFolder = () => {
    if (selectedFolder) {
      const tags: { person?: string; location?: string; event?: string } = {};
      
      if (personTag.trim()) tags.person = personTag.trim();
      if (locationTag.trim()) tags.location = locationTag.trim();
      if (eventTag.trim()) tags.event = eventTag.trim();
      
      onSelectFolder(selectedFolder.id, selectedFolder.name, Object.keys(tags).length > 0 ? tags : undefined);
      
      // Limpar formulário
      setSelectedFolder(null);
      setPersonTag('');
      setLocationTag('');
      setEventTag('');
      onClose();
    }
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder?.id === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
              : 'hover:bg-slate-100'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => setSelectedFolder(folder)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-1 hover:bg-slate-200 rounded"
            >
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-6" />}
          
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          
          <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
          
          {isSelected && (
            <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Selecionar Pasta</h2>
            <p className="text-sm text-slate-600 mt-1">Escolha a pasta do Google Drive para sincronizar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Lista de Pastas */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="spinner mb-4"></div>
              <p className="text-slate-600">Carregando pastas...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-lg font-medium">Nenhuma pasta encontrada</p>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => renderFolder(folder))}
            </div>
          )}

          {/* Tags para aplicar (só aparece se pasta selecionada) */}
          {selectedFolder && (
            <div className="border-t border-slate-200 pt-6 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Organizar automaticamente (opcional)</p>
                    <p className="text-blue-700">Preencha os campos abaixo para adicionar tags em todas as fotos desta pasta.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Pessoa */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Pessoa (opcional)
                  </label>
                  <input
                    type="text"
                    value={personTag}
                    onChange={(e) => setPersonTag(e.target.value)}
                    placeholder="Ex: João Silva, Família, Amigos..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                {/* Local */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Local (opcional)
                  </label>
                  <input
                    type="text"
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                    placeholder="Ex: São Paulo, Paris, Praia..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                {/* Evento */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Evento (opcional)
                  </label>
                  <input
                    type="text"
                    value={eventTag}
                    onChange={(e) => setEventTag(e.target.value)}
                    placeholder="Ex: Aniversário, Viagem, Casamento..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {selectedFolder ? (
              <span>
                <span className="font-medium text-slate-900">{selectedFolder.name}</span> selecionada
              </span>
            ) : (
              <span>Nenhuma pasta selecionada</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSelectFolder}
              disabled={!selectedFolder}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              Sincronizar Pasta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

