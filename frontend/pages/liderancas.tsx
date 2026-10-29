import React, { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { LoginLanding } from '@/components/LoginLanding';
import { api } from '@/utils/api';
import type { Leader } from '@/types/photo';

export default function LiderancasPage() {
  const router = useRouter();
  const { authenticated, user, loading: authLoading, login, error: authError } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Liga o stream depois que o <video> monta (senão Capturar não vê frames)
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

  const loadLeaders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getLeaders(query ? { q: query } : undefined);
      setLeaders(list);
    } catch {
      setError('Não foi possível listar lideranças. Verifique a sessão e tente de novo.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (authenticated) loadLeaders();
  }, [authenticated, loadLeaders]);

  const onPhotoChange = (file: File | null) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const startCamera = async () => {
    setError(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError('Não foi possível acessar a câmera. Use o envio de arquivo.');
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

    const finish = (blob: Blob | null) => {
      if (!blob) {
        setError('Falha ao capturar a imagem.');
        return;
      }
      const file = new File([blob], `lideranca-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      onPhotoChange(file);
      if (fileRef.current) fileRef.current.value = '';
      stopCamera();
    };

    if (canvas.toBlob) {
      canvas.toBlob(finish, 'image/jpeg', 0.92);
    } else {
      // fallback raro
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const bytes = atob(dataUrl.split(',')[1] || '');
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      finish(new Blob([arr], { type: 'image/jpeg' }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name.trim() || !photoFile) {
      setError('Nome e foto de referência são obrigatórios (câmera ou arquivo).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createLeader({
        name: name.trim(),
        city: city.trim() || undefined,
        role_title: roleTitle.trim() || undefined,
        photo: photoFile,
      });
      setName('');
      setCity('');
      setRoleTitle('');
      onPhotoChange(null);
      stopCamera();
      if (fileRef.current) fileRef.current.value = '';
      await loadLeaders();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Falha ao cadastrar liderança.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Remover esta liderança?')) return;
    try {
      await api.deleteLeader(id);
      await loadLeaders();
    } catch {
      setError('Falha ao remover liderança.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-primary-500">
        <div className="spinner mb-5 border-ink/20 border-t-ink" />
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-ink/60">
          JArchive
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginLanding
        onLogin={async (email, password) => {
          await login(email, password);
        }}
        error={authError}
        loading={authLoading}
      />
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Head>
          <title>JArchive — Lideranças</title>
        </Head>
        <Header />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-ink">Acesso restrito</h1>
          <p className="mt-2 text-sm text-ink/50">
            Somente administradores gerenciam o cadastro de lideranças.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 bg-primary-500 px-4 py-2.5 text-sm font-semibold text-ink"
          >
            Voltar à busca
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>JArchive — Lideranças</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Lideranças
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink/50">
              Cadastre nome, cidade e uma foto nítida de frente. O sistema extrai o vetor facial
              para busca no acervo.
            </p>
          </div>

          <form
            onSubmit={handleCreate}
            className="grid gap-4 border border-ink/8 bg-white p-5 sm:grid-cols-2"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Nome *
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Cidade
              </span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Cargo
              </span>
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Ex.: prefeito, governador"
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Foto de referência *
              </span>
              <div className="flex flex-wrap gap-2">
                {!cameraOn ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-primary-500 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-400"
                  >
                    Tirar foto
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
                      Fechar câmera
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/30"
                >
                  Escolher arquivo
                </button>
                {photoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      onPhotoChange(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="border border-ink/15 px-4 py-2.5 text-sm text-ink/50"
                  >
                    Limpar foto
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  stopCamera();
                  onPhotoChange(e.target.files?.[0] || null);
                }}
              />
              {cameraOn && (
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
                    className="aspect-video max-h-72 w-full object-cover"
                  />
                </div>
              )}
              {photoPreview && (
                <div className="overflow-hidden bg-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-48 w-auto object-contain"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving || !photoFile}
                className="bg-primary-500 px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {saving ? 'Detectando rosto…' : 'Cadastrar liderança'}
              </button>
            </div>
          </form>

          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Filtrar
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome ou cidade"
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="spinner border-ink/15 border-t-primary-600" />
            </div>
          ) : leaders.length === 0 ? (
            <div className="border border-dashed border-ink/15 px-6 py-14 text-center text-sm text-ink/50">
              Nenhuma liderança cadastrada ainda.
            </div>
          ) : (
            <ul className="divide-y divide-ink/8 border border-ink/8 bg-white">
              {leaders.map((leader) => (
                <li
                  key={leader.id}
                  className="flex flex-wrap items-center gap-4 px-4 py-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden bg-ink/5">
                    {leader.photo_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={leader.photo_data}
                        alt={leader.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{leader.name}</p>
                    <p className="text-sm text-ink/45">
                      {[leader.role_title, leader.city].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(leader.id)}
                    className="text-sm font-medium text-red-700 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
