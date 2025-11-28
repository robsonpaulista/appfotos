import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const router = useRouter();
  const { authenticated, user, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  PhotoFinder
                </h1>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Organização inteligente de fotos
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            {authenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => router.push('/')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    router.pathname === '/' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Minhas Fotos
                </button>
                <button
                  onClick={() => router.push('/face-test')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                    router.pathname === '/face-test' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">🤖</span>
                  Teste de IA
                </button>
              </nav>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {authenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-700">
                    {user.name || 'Usuário'}
                  </span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                  {(user.name || user.email)?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Entrar com Google</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
