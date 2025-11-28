import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';

interface GeocodingButtonProps {
  onComplete?: () => void;
}

export function GeocodingButton({ onComplete }: GeocodingButtonProps) {
  const [stats, setStats] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/geocoding/stats`, {
        credentials: 'include'
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar stats de GPS:', error);
    }
  };

  const handleProcess = async () => {
    if (!confirm(`Processar ${stats.withoutLocation} fotos com GPS?\n\nIsso pode demorar alguns minutos (1 segundo por foto).`)) {
      return;
    }

    try {
      setProcessing(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/geocoding/process`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 })
      });

      const result = await response.json();
      
      alert(`✅ Processamento iniciado!\n\n${result.total} fotos sendo processadas em background.\n\nEste processo pode demorar alguns minutos.`);
      
      onComplete?.();
    } catch (error) {
      console.error('Erro ao processar geocoding:', error);
      alert('❌ Erro ao processar');
    } finally {
      setProcessing(false);
    }
  };

  // Só mostra se tiver fotos com GPS pendentes
  if (!stats || stats.withoutLocation === 0) return null;

  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30 flex-shrink-0">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Converter GPS em Cidades</h3>
          <p className="text-sm text-slate-600 mb-3">
            {stats.withGps} fotos têm coordenadas GPS. {stats.withoutLocation} ainda não têm cidade identificada.
          </p>

          {stats.withoutLocation > 0 && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Processar {stats.withoutLocation} fotos
                </>
              )}
            </button>
          )}

          {stats.withoutLocation === 0 && stats.withGps > 0 && (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Todas as fotos com GPS já foram processadas!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

