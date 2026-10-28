import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';
import { PhotoCard } from '@/components/PhotoCard';
import type { FaceSearchMatch, Leader } from '@/types/photo';

type SearchMode = 'camera' | 'upload' | 'leader';

interface FaceSearchHubProps {
  isAdmin?: boolean;
}

export function FaceSearchHub({ isAdmin = false }: FaceSearchHubProps) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>('camera');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [matches, setMatches] = useState<FaceSearchMatch[]>([]);

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leadersLoading, setLeadersLoading] = useState<boolean>(false);
  const [leaderQuery, setLeaderQuery] = useState<string>('');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);

  // getUserMedia em http://IP costuma falhar no celular; aí usamos input nativo
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const secureCam =
      typeof window !== 'undefined' &&
      (window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');
    const update = () => setIsMobile(mq.matches || !secureCam);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopCamera, previewUrl]);

  useEffect(() => {
    if (!cameraOn || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {
      setError('Não foi possível iniciar o preview da câmera.');
    });
  }, [cameraOn]);

  useEffect(() => {
    if (mode !== 'leader') return;
    let cancelled = false;
    (async () => {
      setLeadersLoading(true);
      try {
        const list = await api.getLeaders(leaderQuery ? { q: leaderQuery } : undefined);
        if (!cancelled) setLeaders(list);
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar lideranças. Verifique se o backend está no ar.');
        }
      } finally {
        if (!cancelled) setLeadersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, leaderQuery]);

  const switchMode = (next: SearchMode) => {
    setMode(next);
    setError(null);
    setMessage(null);
    if (next !== 'camera') stopCamera();
    if (next === 'camera') {
      clearPreviewKeepErrors();
    }
  };

  const clearPreviewKeepErrors = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageBlob(null);
    setMatches([]);
  };

  const setImageFromBlob = (blob: Blob) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setImageBlob(blob);
    setError(null);
    setMessage(null);
    setMatches([]);
  };

  const startCamera = async () => {
    setError(null);
    try {
      stopCamera();
      clearPreviewKeepErrors();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError('Não foi possível acessar a câmera. Use o upload de arquivo.');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) {
      setError('Câmera ainda não está pronta.');
      return;
    }
    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    if (!width || !height) {
      setError('Aguarde o preview da câmera carregar e tente de novo.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Falha ao capturar a imagem.');
          return;
        }
        setImageFromBlob(blob);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const onFileSelected = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }
    stopCamera();
    setImageFromBlob(file);
  };

  const clearPreview = () => {
    clearPreviewKeepErrors();
    setMessage(null);
    setError(null);
  };

  const runImageSearch = async () => {
    if (!imageBlob) {
      setError('Capture ou envie uma foto primeiro.');
      return;
    }
    setSearching(true);
    setError(null);
    setMessage(null);
    setMatches([]);
    try {
      const result = await api.searchByImage(imageBlob);
      if (result.error === 'no_face') {
        setError(result.message || 'Nenhum rosto detectado na imagem.');
        return;
      }
      setMatches(result.matches || []);
      if (result.message) setMessage(result.message);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; message?: string } } };
      setError(
        ax.response?.data?.message ||
          ax.response?.data?.error ||
          'Falha na busca. Confirme que o backend (porta 4000) está rodando.'
      );
    } finally {
      setSearching(false);
    }
  };

  const runLeaderSearch = async (leaderId?: string) => {
    const id = leaderId || selectedLeaderId;
    if (!id) {
      setError('Escolha uma liderança.');
      return;
    }
    if (leaderId) setSelectedLeaderId(leaderId);
    setSearching(true);
    setError(null);
    setMessage(null);
    setMatches([]);
    try {
      const result = await api.searchByLeader(id);
      setMatches(result.matches || []);
      if (result.message) setMessage(result.message);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; message?: string } } };
      setError(
        ax.response?.data?.message ||
          ax.response?.data?.error ||
          'Falha na busca por liderança.'
      );
    } finally {
      setSearching(false);
    }
  };

  const cameraIcon = (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  );

  const uploadIcon = (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );

  const leaderIcon = (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );

  const actions: {
    id: SearchMode;
    label: string;
    onSelect: () => void;
    icon: React.ReactNode;
  }[] = isMobile
    ? [
        {
          id: 'camera',
          label: 'Tirar foto',
          onSelect: () => {
            switchMode('camera');
            captureInputRef.current?.click();
          },
          icon: cameraIcon,
        },
        {
          id: 'upload',
          label: 'Galeria',
          onSelect: () => {
            switchMode('upload');
            fileInputRef.current?.click();
          },
          icon: uploadIcon,
        },
        {
          id: 'leader',
          label: 'Lideranças',
          onSelect: () => switchMode('leader'),
          icon: leaderIcon,
        },
      ]
    : [
        {
          id: 'camera',
          label: 'Tirar foto',
          onSelect: () => {
            switchMode('camera');
            void startCamera();
          },
          icon: cameraIcon,
        },
        {
          id: 'upload',
          label: 'Upload',
          onSelect: () => {
            switchMode('upload');
            fileInputRef.current?.click();
          },
          icon: uploadIcon,
        },
        {
          id: 'leader',
          label: 'Lideranças',
          onSelect: () => switchMode('leader'),
          icon: leaderIcon,
        },
      ];

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="relative overflow-hidden bg-primary-500 px-5 py-6 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-primary-300/40 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/50">
            Busca facial
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:mt-2 sm:text-4xl">
            Encontre fotos pelo rosto
          </h1>
          <p className="mt-2 hidden max-w-lg text-sm leading-relaxed text-ink/65 sm:mt-3 sm:block">
            Tire uma foto, envie um arquivo ou escolha uma liderança cadastrada para
            localizar aparições no acervo.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
      />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {actions.map((action) => {
          const active = mode === action.id;
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onSelect}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 transition-colors sm:py-4 ${
                active
                  ? 'bg-primary-500 text-ink'
                  : 'border border-ink/10 bg-white text-ink/55 hover:border-ink/25 hover:text-ink'
              }`}
            >
              {action.icon}
              <span className="text-center text-[11px] font-semibold leading-tight sm:text-xs">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {(mode === 'camera' || mode === 'upload') && (
        <div className="space-y-4 border border-ink/8 bg-white p-4 sm:p-5">
          {mode === 'camera' && !isMobile && (
            <div className="flex flex-wrap gap-2">
              {!cameraOn ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-primary-500 px-4 py-2.5 text-sm font-semibold text-ink"
                >
                  Abrir câmera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="bg-ink px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Capturar
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/60"
                  >
                    Fechar
                  </button>
                </>
              )}
            </div>
          )}

          {mode === 'camera' && isMobile && !previewUrl && (
            <button
              type="button"
              onClick={() => captureInputRef.current?.click()}
              className="bg-primary-500 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              Abrir câmera
            </button>
          )}

          {mode === 'upload' && !previewUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary-500 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              {isMobile ? 'Escolher da galeria' : 'Escolher foto'}
            </button>
          )}

          {cameraOn && !isMobile && (
            <div className="overflow-hidden bg-ink/5">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.muted = true;
                    el.playsInline = true;
                    el.play().catch(() => undefined);
                  }
                }}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full object-cover sm:aspect-video"
              />
            </div>
          )}

          {previewUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden bg-ink/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                  className="max-h-64 w-full object-contain sm:max-h-72"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runImageSearch}
                  disabled={searching}
                  className="bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {searching ? 'Buscando…' : 'Buscar no acervo'}
                </button>
                <button
                  type="button"
                  onClick={clearPreview}
                  className="border border-ink/15 px-4 py-2.5 text-sm text-ink/60"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {!previewUrl && !cameraOn && (
            <p className="text-sm text-ink/45">
              {mode === 'camera'
                ? isMobile
                  ? 'Abra a câmera do aparelho e tire uma foto nítida, de frente.'
                  : 'Abra a câmera e capture um rosto nítido, de frente.'
                : isMobile
                  ? 'Escolha uma foto da galeria, sua ou de outra pessoa.'
                  : 'Envie uma foto sua ou de outra pessoa, com o rosto bem visível.'}
            </p>
          )}
        </div>
      )}

      {mode === 'leader' && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                Buscar liderança
              </span>
              <input
                type="search"
                value={leaderQuery}
                onChange={(e) => setLeaderQuery(e.target.value)}
                placeholder="Nome, cidade ou cargo"
                className="border border-ink/12 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => runLeaderSearch()}
                disabled={searching || !selectedLeaderId}
                className="flex-1 bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 sm:flex-none"
              >
                {searching ? 'Buscando…' : 'Buscar fotos'}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push('/liderancas')}
                  className="border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink/70"
                >
                  Gerenciar
                </button>
              )}
            </div>
          </div>

          {leadersLoading ? (
            <div className="flex justify-center py-10">
              <div className="spinner border-ink/15 border-t-primary-600" />
            </div>
          ) : leaders.length === 0 ? (
            <div className="border border-dashed border-ink/15 bg-white/60 px-4 py-10 text-center">
              <p className="font-medium text-ink">Nenhuma liderança cadastrada</p>
              <p className="mt-2 text-sm text-ink/50">
                {isAdmin
                  ? 'Cadastre na área Lideranças com uma foto de referência.'
                  : 'Peça a um administrador para cadastrar referências.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-ink/45">
                {leaders.length}{' '}
                {leaders.length === 1 ? 'resultado' : 'resultados'}
                {leaderQuery ? ` para “${leaderQuery}”` : ''}
              </p>
              <ul className="max-h-[min(360px,45vh)] divide-y divide-ink/8 overflow-y-auto border border-ink/10 bg-white">
                {leaders.map((leader) => {
                  const selected = selectedLeaderId === leader.id;
                  const meta = [leader.role_title, leader.city]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li key={leader.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLeaderId(leader.id)}
                        onDoubleClick={() => {
                          void runLeaderSearch(leader.id);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                          selected ? 'bg-primary-500/25' : 'hover:bg-primary-500/10'
                        }`}
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden bg-ink/5 sm:h-10 sm:w-10">
                          {leader.photo_data ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={leader.photo_data}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-ink/30">
                              {(leader.name || '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {leader.name}
                          </p>
                          {meta ? (
                            <p className="truncate text-xs text-ink/45">{meta}</p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {message && !error && (
        <div className="border border-ink/10 bg-primary-500/15 px-4 py-3 text-sm text-ink/70">
          {message}
        </div>
      )}

      {searching && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner mb-4 border-ink/15 border-t-primary-600" />
          <p className="text-sm font-medium text-ink/50">Comparando rostos no acervo…</p>
        </div>
      )}

      {!searching && matches.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
              Resultados
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {matches.length} {matches.length === 1 ? 'foto' : 'fotos'}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matches.map((match) =>
              match.photo ? (
                <div key={`${match.photo_id}-${match.distance}`} className="relative">
                  <div className="absolute left-2 top-2 z-10 bg-ink/85 px-2 py-1 text-[11px] font-semibold text-white">
                    {Math.round((match.similarity || 0) * 100)}%
                  </div>
                  <PhotoCard
                    photo={match.photo}
                    onClick={() => router.push(`/photo/${match.photo.id}`)}
                  />
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
