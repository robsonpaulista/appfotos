import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';

interface Stats {
  total: number;
  analyzed: number;
  withGps: number;
  withFaces: number;
  byYear: Record<string, number>;
  byCity: Record<string, number>;
  byType: Record<string, number>;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
        <div className="flex items-center justify-center py-8">
          <div className="spinner mr-3"></div>
          <span className="text-slate-600">Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.total.toLocaleString()}</div>
          <div className="text-sm opacity-90">Total de Fotos</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.analyzed.toLocaleString()}</div>
          <div className="text-sm opacity-90">Analisadas com IA</div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.withGps.toLocaleString()}</div>
          <div className="text-sm opacity-90">Com Localização GPS</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.withFaces.toLocaleString()}</div>
          <div className="text-sm opacity-90">Com Rostos Detectados</div>
        </div>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Por Ano */}
        {Object.keys(stats.byYear).length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Por Ano
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.byYear)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([year, count]) => (
                  <div key={year} className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{year}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-slate-200 rounded-full w-24">
                        <div
                          className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Por Cidade */}
        {Object.keys(stats.byCity).length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Por Cidade
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.byCity)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium truncate">{city}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-slate-200 rounded-full w-24">
                        <div
                          className="h-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Por Tipo */}
        {Object.keys(stats.byType).length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Por Tipo
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium truncate">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-slate-200 rounded-full w-24">
                        <div
                          className="h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

