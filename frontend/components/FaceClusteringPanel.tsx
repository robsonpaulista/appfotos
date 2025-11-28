import React, { useState } from 'react';

interface Cluster {
  id: string;
  count: number;
  faces: Array<{
    id: string;
    photo_id: string;
    bounding_box: any;
    photo?: {
      id: string;
      name: string;
      thumbnail_url: string;
    };
  }>;
}

export function FaceClusteringPanel() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(0.6);

  const handleCluster = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/cluster`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ threshold })
      });

      if (!response.ok) throw new Error('Falha ao agrupar rostos');

      const result = await response.json();
      setClusters(result.groups || []);
      
      if (result.clusters === 0) {
        alert('Nenhum agrupamento encontrado. Analise mais fotos primeiro!');
      } else {
        alert(`✅ ${result.clusters} grupo(s) de rostos similares encontrado(s)!`);
      }
    } catch (err) {
      console.error('Erro ao agrupar:', err);
      alert('Erro ao agrupar rostos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCluster = async (cluster: Cluster) => {
    const personName = prompt(`Identificar ${cluster.count} rostos como:`);
    if (!personName) return;

    try {
      const descriptorIds = cluster.faces.map(f => f.id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/assign-person`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          descriptorIds,
          personName: personName.trim()
        })
      });

      if (!response.ok) throw new Error('Falha ao atribuir pessoa');

      alert(`✅ ${cluster.count} rostos identificados como "${personName}"!`);
      
      // Remover cluster da lista
      setClusters(prev => prev.filter(c => c.id !== cluster.id));
    } catch (err) {
      console.error('Erro ao atribuir:', err);
      alert('Erro ao atribuir pessoa');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Agrupar Rostos Similares
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Encontre automaticamente a mesma pessoa em múltiplas fotos
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sensibilidade (threshold)
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Restritivo (0.3)</span>
              <span className="font-semibold text-primary-600">{threshold}</span>
              <span>Permissivo (0.9)</span>
            </div>
          </div>
          
          <button
            onClick={handleCluster}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Agrupando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Agrupar Rostos
              </>
            )}
          </button>
        </div>

        {clusters.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-gray-900">
              {clusters.length} grupo(s) encontrado(s)
            </h3>
            
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {cluster.count}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Grupo com {cluster.count} rostos similares
                      </p>
                      <p className="text-sm text-gray-600">
                        Provavelmente a mesma pessoa
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAssignCluster(cluster)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Identificar
                  </button>
                </div>

                {/* Miniaturas das fotos */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {cluster.faces.slice(0, 6).map((face) => (
                    face.photo && (
                      <div
                        key={face.id}
                        className="relative group"
                        title={face.photo.name}
                      >
                        <img
                          src={face.photo.thumbnail_url || `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/photos/${face.photo.id}/image`}
                          alt={face.photo.name}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                          onClick={() => window.open(`/photo/${face.photo.id}`, '_blank')}
                        />
                      </div>
                    )
                  ))}
                  {cluster.count > 6 && (
                    <div className="w-16 h-16 rounded-lg bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm border-2 border-white shadow-md">
                      +{cluster.count - 6}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {clusters.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">Clique em "Agrupar Rostos" para encontrar pessoas repetidas</p>
            <p className="text-xs text-slate-400 mt-1">Analise algumas fotos primeiro</p>
          </div>
        )}
      </div>
    </div>
  );
}

