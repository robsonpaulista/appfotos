import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '@/components/Header';
import { FaceAnalysisTest } from '@/components/FaceAnalysisTest';
import { useAuth } from '@/hooks/useAuth';

export default function FaceTestPage() {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-slate-600 font-medium">Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    router.push('/');
    return null;
  }

  return (
    <>
      <Head>
        <title>Teste de IA - Reconhecimento Facial | PhotoFinder</title>
      </Head>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FaceAnalysisTest />
      </main>
    </>
  );
}

