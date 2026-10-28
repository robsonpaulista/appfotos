import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const router = useRouter();
  const { authenticated, user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!authenticated) {
    return null;
  }

  const linkClass = (active: boolean) =>
    `px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'text-ink' : 'text-ink/45 hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center bg-primary-500 text-xs font-bold text-ink">
              JA
            </span>
            <span className="text-lg font-bold tracking-tight text-ink">
              JArchive
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            <button
              onClick={() => router.push('/')}
              className={linkClass(router.pathname === '/')}
            >
              Busca
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => router.push('/liderancas')}
                  className={linkClass(router.pathname === '/liderancas')}
                >
                  Lideranças
                </button>
                <button
                  onClick={() => router.push('/usuarios')}
                  className={linkClass(router.pathname === '/usuarios')}
                >
                  Usuários
                </button>
                <button
                  onClick={() => router.push('/acervo')}
                  className={linkClass(router.pathname === '/acervo')}
                >
                  Gestão
                </button>
              </>
            )}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-medium text-ink">
                {user.name || 'Usuário'}
              </span>
              <span className="text-xs text-ink/45">
                {user.role === 'admin' ? 'Admin' : 'Equipe'}
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center bg-primary-500 text-sm font-semibold text-ink">
              {(user.name || user.email)?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="text-sm font-medium text-ink/50 transition-colors hover:text-ink"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
