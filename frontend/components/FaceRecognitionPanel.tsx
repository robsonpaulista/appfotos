import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import type { Photo } from '@/types/photo';

interface Face {
  id: string;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  person_id: string | null;
  persons?: {
    id: string;
    name: string;
  };
}

interface FaceRecognitionPanelProps {
  photoId: string;
  imageUrl?: string;
  onUpdate?: () => void;
}

export function FaceRecognitionPanel({ photoId, imageUrl, onUpdate }: FaceRecognitionPanelProps) {
  const [faces, setFaces] = useState<Face[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadFaces();
  }, [photoId]);

  const loadFaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/photo/${photoId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Falha ao carregar rostos');
      
      const data = await response.json();
      setFaces(data);
    } catch (err) {
      console.error('Erro ao carregar rostos:', err);
      setError('Erro ao carregar rostos');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/analyze/${photoId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao analisar foto');
      }
      
      const result = await response.json();
      
      if (result.count > 0) {
        await loadFaces();
        onUpdate?.();
        alert(`✅ ${result.count} rosto(s) detectado(s)!`);
      } else {
        alert('⚠️ Nenhum rosto detectado nesta foto.\n\nPossíveis motivos:\n• Foto sem pessoas visíveis\n• Rostos muito pequenos ou de perfil\n• Qualidade da imagem baixa\n• Tente com outra foto');
      }
    } catch (err: any) {
      console.error('Erro ao analisar:', err);
      setError(err.message || 'Erro ao analisar foto');
      alert(`❌ Erro: ${err.message || 'Falha ao analisar foto'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAssignPerson = async (faceId: string) => {
    const personName = prompt('Digite o nome da pessoa:');
    if (!personName) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/faces/assign-person`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          descriptorIds: [faceId],
          personName: personName.trim(),
          autoAssign: true
        })
      });

      if (!response.ok) throw new Error('Falha ao atribuir pessoa');

      const result = await response.json();

      await loadFaces();
      onUpdate?.();

      const newlyAssigned = result?.autoAssignment?.newlyAssigned ?? 0;
      const totalTagsUpdated = result?.totalPhotoTagsUpdated ?? 0;
      const assignedPhotos: Photo[] = Array.isArray(result?.autoAssignment?.assignedPhotos)
        ? result.autoAssignment.assignedPhotos
        : [];
      const messageLines = [
        `✅ Pessoa "${personName}" atribuída com sucesso!`,
      ];

      if (newlyAssigned > 0) {
        messageLines.push(`🤖 ${newlyAssigned} rosto(s) adicional(is) reconhecido(s) automaticamente.`);
      } else {
        messageLines.push('ℹ️ Nenhuma outra foto foi identificada automaticamente desta vez.');
      }

      if (totalTagsUpdated > result?.updated) {
        messageLines.push(`🏷️ ${totalTagsUpdated} foto(s) receberam a tag dessa pessoa.`);
      }

      if (assignedPhotos.length > 0) {
        messageLines.push('', 'Fotos atualizadas:');
        assignedPhotos.slice(0, 5).forEach((photo: Photo) => {
          const date = photo.created_at ? new Date(photo.created_at) : null;
          const formattedDate = date ? date.toLocaleDateString('pt-BR') : '';
          messageLines.push(
            `• ${photo.name || photo.id}${formattedDate ? ` (${formattedDate})` : ''}`
          );
        });
        if (assignedPhotos.length > 5) {
          messageLines.push(`… e mais ${assignedPhotos.length - 5} foto(s).`);
        }
      }

      alert(messageLines.join('\n'));

      const shouldOpen = window.confirm('Deseja abrir as fotos que foram atualizadas automaticamente?');
      if (shouldOpen && assignedPhotos.length > 0) {
        const firstPhoto = assignedPhotos[0];
        const baseUrl = window.location.origin;
        const url = firstPhoto ? `${baseUrl}/photo/${firstPhoto.id}` : null;
        if (url) {
          if (assignedPhotos.length === 1) {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            const tab = window.open(url, '_blank', 'noopener,noreferrer');
            if (!tab) {
              alert('Não foi possível abrir uma nova aba. Verifique se o bloqueador de pop-ups está ativo.');
            }
          }
        }
      }

      return result;
    } catch (err) {
      console.error('Erro ao atribuir pessoa:', err);
      alert('Erro ao atribuir pessoa');
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          Carregando rostos...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Reconhecimento Facial
        </h3>
        
        {faces.length === 0 && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analisando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analisar Rostos
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {faces.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {faces.length} rosto(s) detectado(s)
            </p>
            <button
              onClick={() => setShowVisualization(!showVisualization)}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-xs font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showVisualization ? 'Ocultar' : 'Visualizar'}
            </button>
          </div>

          {/* Visualização com bounding boxes */}
          {showVisualization && imageUrl && (
            <div className="relative bg-slate-900 rounded-lg overflow-hidden">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Foto com rostos"
                className="w-full h-auto"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImageDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  });
                }}
              />
              
              {/* Bounding boxes */}
              {imageDimensions && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'normal' }}
                  viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {faces.map((face, index) => {
                    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                    const color = colors[index % colors.length];
                    const box = face.bounding_box;
                    
                    return (
                      <g key={face.id}>
                        <rect
                          x={box.x}
                          y={box.y}
                          width={box.width}
                          height={box.height}
                          fill="none"
                          stroke={color}
                          strokeWidth={imageDimensions.width / 200}
                          className={selectedFaceId === face.id ? 'opacity-100' : 'opacity-70'}
                        />
                        <rect
                          x={box.x}
                          y={box.y - (imageDimensions.height / 30)}
                          width={box.width}
                          height={imageDimensions.height / 30}
                          fill={color}
                          opacity="0.9"
                        />
                        <text
                          x={box.x + box.width / 2}
                          y={box.y - (imageDimensions.height / 60)}
                          fill="white"
                          fontSize={imageDimensions.height / 50}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {face.persons?.name || `${index + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          )}
          
          {faces.map((face, index) => (
            <div
              key={face.id}
              onMouseEnter={() => setSelectedFaceId(face.id)}
              onMouseLeave={() => setSelectedFaceId(null)}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                selectedFaceId === face.id
                  ? 'bg-purple-50 border-purple-400 shadow-lg'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    selectedFaceId === face.id ? 'bg-purple-500' : 'bg-primary-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {face.persons?.name || `Rosto ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Confiança: {Math.round(face.confidence * 100)}%
                    </p>
                  </div>
                </div>
                
                {!face.person_id && (
                  <button
                    onClick={() => handleAssignPerson(face.id)}
                    className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium"
                  >
                    Identificar
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                Reanalisando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reanalisar
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-sm">Nenhum rosto analisado ainda</p>
          <p className="text-xs text-slate-400 mt-1">Clique em "Analisar Rostos" para começar</p>
        </div>
      )}
    </div>
  );
}

