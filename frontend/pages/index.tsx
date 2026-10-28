import React from 'react';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { FaceSearchHub } from '@/components/FaceSearchHub';
import { useAuth } from '@/hooks/useAuth';
import { LoginLanding } from '@/components/LoginLanding';

export default function Home() {
  const { authenticated, user, loading: authLoading, login, error: authError } = useAuth();
  const isAdmin = user?.role === 'admin';

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

  return (
    <>
      <Head>
        <title>JArchive — Busca por rosto</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FaceSearchHub isAdmin={isAdmin} />
      </main>
    </>
  );
}
