import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
  variant?: 'default' | 'mandate' | 'glass' | 'embedded';
}

export function LoginForm({
  onSubmit,
  error,
  loading,
  variant = 'default',
}: LoginFormProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Informe e-mail e senha');
      return;
    }

    try {
      await onSubmit(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar';
      setLocalError(message);
    }
  };

  const displayError = localError || error;
  const isGlass = variant === 'glass';
  const isEmbedded = variant === 'embedded';
  const isMandate = variant === 'mandate' || isGlass || isEmbedded;

  if (!isMandate) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-left">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-primary-500"
            placeholder="seu@email.com"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-primary-500"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
        {displayError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {displayError}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-2.5 font-semibold text-ink disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    );
  }

  const fieldClass = isEmbedded
    ? 'login-field-embedded w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink'
    : isGlass
      ? 'w-full border border-ink/15 bg-white/55 px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/35 backdrop-blur-sm focus:border-ink/35 focus:bg-white/75'
      : 'w-full border border-ink/12 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/25';

  const buttonClass = isEmbedded
    ? 'mt-3 flex w-full items-center justify-center gap-2 bg-ink px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-55'
    : isGlass
      ? 'mt-2 flex w-full items-center justify-center gap-2 bg-ink px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-55'
      : 'mt-2 flex w-full items-center justify-center gap-2 bg-primary-500 px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-55';

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm font-medium text-ink/70"
        >
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          placeholder="nome@equipe.com"
          disabled={loading}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-ink/70">
            Senha
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-xs font-medium text-ink/45 transition-colors hover:text-ink"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {displayError && (
        <p className="border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800">
          {displayError}
        </p>
      )}

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? 'Entrando…' : 'Acessar acervo'}
      </button>
    </form>
  );
}
