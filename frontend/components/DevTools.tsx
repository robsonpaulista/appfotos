import React, { useState } from 'react';
import { api } from '@/utils/api';

interface DevToolsProps {
  onDataCleared?: () => void;
}

export function DevTools({ onDataCleared }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const handleClearAll = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso vai APAGAR TODOS OS METADADOS!\n\nAs fotos no Google Drive NÃO serão afetadas.\n\nDeseja continuar?')) {
      return;
    }

    if (!confirm('Tem CERTEZA ABSOLUTA? Esta ação NÃO pode ser desfeita!')) {
      return;
    }

    try {
      setLoading(true);
      await api.clearAllData();
      alert('✅ Todos os dados foram apagados com sucesso!\n\nVocê pode fazer uma nova sincronização agora.');
      onDataCleared?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      alert('❌ Erro ao limpar dados. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDevStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); handleLoadStats(); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-full shadow-2xl hover:shadow-slate-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 border-2 border-slate-600"
        title="Ferramentas de Desenvolvimento"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-700 p-6 w-96">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dev Tools</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">📊 Banco de Dados:</h4>
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Fotos:</span>
                <span className="font-bold text-slate-900">{stats.photos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tags:</span>
                <span className="font-bold text-slate-900">{stats.tags || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Sincronizações:</span>
                <span className="font-bold text-slate-900">{stats.syncs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Usuários:</span>
                <span className="font-bold text-slate-900">{stats.users || 0}</span>
              </div>
            </div>
            <button
              onClick={handleLoadStats}
              className="mt-3 w-full px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors font-medium"
              disabled={loading}
            >
              🔄 Atualizar
            </button>
          </div>
        )}

        {/* Ações de Desenvolvimento */}
        <div className="space-y-3">
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900 mb-1">Zona de Perigo</h4>
                <p className="text-xs text-rose-700 mb-3">
                  Apaga TODOS os metadados do banco. As fotos no Google Drive NÃO são afetadas.
                </p>
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold rounded-lg hover:from-rose-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Limpando...' : '🗑️ Limpar Todos os Dados'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center">
            ⚠️ Use apenas em desenvolvimento
          </div>
        </div>
      </div>
    </div>
  );
}

