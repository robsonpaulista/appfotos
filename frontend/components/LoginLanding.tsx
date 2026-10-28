import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { LoginForm } from '@/components/LoginForm';

interface LoginLandingProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

/**
 * Splash do nome → composição amarela contínua (form integrado ao fundo).
 */
export function LoginLanding({ onLogin, error, loading }: LoginLandingProps) {
  const [phase, setPhase] = useState<'splash' | 'ready'>('splash');

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('ready'), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <Head>
        <title>JArchive — Acervo do mandato</title>
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-primary-500">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-primary-300/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-primary-600/30 blur-3xl"
          aria-hidden
        />
        <div className="grain opacity-20" aria-hidden />

        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-500 ${
            phase === 'splash' ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={phase !== 'splash'}
        >
          <p className="animate-brand-mark font-sans text-5xl font-bold tracking-tight text-ink sm:text-6xl md:text-7xl">
            JArchive
          </p>
          <p
            className="mt-3 animate-fade-in text-[11px] font-medium uppercase tracking-[0.28em] text-ink/50"
            style={{ animationDelay: '420ms' }}
          >
            Acervo oficial · Dep Fed Jadyel Alencar
          </p>
        </div>

        <div
          className={`relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10 transition-all duration-700 ease-out sm:max-w-md sm:px-6 sm:py-12 lg:max-w-5xl lg:px-10 ${
            phase === 'ready'
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <div className="flex w-full flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
            <header className="mb-8 text-center lg:mb-0 lg:text-left">
              <p className="font-sans text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                JArchive
              </p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">
                Acervo oficial · Dep Fed Jadyel Alencar
              </p>
            </header>

            <section className="w-full">
              <h2 className="mb-6 text-lg font-semibold tracking-tight text-ink">
                Entrar
              </h2>
              <LoginForm
                onSubmit={onLogin}
                error={error}
                loading={loading}
                variant="embedded"
              />
              <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 lg:text-left">
                Acesso restrito · uso interno
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
