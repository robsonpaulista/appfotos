import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { LoginLanding } from '@/components/LoginLanding';
import { api } from '@/utils/api';
import type { User } from '@/types/photo';

type Role = 'admin' | 'viewer';

export default function UsuariosPage() {
  const router = useRouter();
  const { authenticated, user, loading: authLoading, login, error: authError } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<Role>('viewer');

  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<Role>('viewer');
  const [editPassword, setEditPassword] = useState<string>('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getAppUsers();
      setUsers(list);
    } catch {
      setError('Não foi possível listar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated && isAdmin) loadUsers();
  }, [authenticated, isAdmin, loadUsers]);

  const resetCreateForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('viewer');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!email.trim() || !password) {
      setError('E-mail e senha são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createAppUser({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        role,
      });
      resetCreateForm();
      await loadUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Falha ao criar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditName(u.name || '');
    setEditRole((u.role as Role) || 'viewer');
    setEditPassword('');
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateAppUser(editingId, {
        name: editName.trim(),
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      });
      setEditingId(null);
      await loadUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Falha ao atualizar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este usuário? Ele não poderá mais acessar o app.')) return;
    setError(null);
    try {
      await api.deleteAppUser(id);
      if (editingId === id) setEditingId(null);
      await loadUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Falha ao remover usuário.');
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
        onLogin={async (emailValue, passwordValue) => {
          await login(emailValue, passwordValue);
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
          <title>JArchive — Usuários</title>
        </Head>
        <Header />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-ink">Acesso restrito</h1>
          <p className="mt-2 text-sm text-ink/50">
            Somente administradores gerenciam usuários.
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
        <title>JArchive — Usuários</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Usuários
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink/50">
              Crie contas de e-mail/senha. Admin gerencia o sistema; viewer usa a busca no acervo.
            </p>
          </div>

          <form
            onSubmit={handleCreate}
            className="grid gap-4 border border-ink/8 bg-white p-5 sm:grid-cols-2"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/40 sm:col-span-2">
              Novo usuário
            </h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Nome
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Perfil
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              >
                <option value="viewer">Equipe (viewer)</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                E-mail *
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Senha *
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border border-ink/12 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-500 px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {saving && !editingId ? 'Criando…' : 'Criar usuário'}
              </button>
            </div>
          </form>

          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="spinner border-ink/15 border-t-primary-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="border border-dashed border-ink/15 px-6 py-14 text-center text-sm text-ink/50">
              Nenhum usuário cadastrado.
            </div>
          ) : (
            <ul className="divide-y divide-ink/8 border border-ink/8 bg-white">
              {users.map((u) => (
                <li key={u.id} className="px-4 py-3">
                  {editingId === u.id ? (
                    <form onSubmit={handleUpdate} className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                          Nome
                        </span>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-ink/12 px-3 py-2 text-sm outline-none focus:border-primary-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                          Perfil
                        </span>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                          className="border border-ink/12 px-3 py-2 text-sm outline-none focus:border-primary-500"
                        >
                          <option value="viewer">Equipe (viewer)</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                          Nova senha (opcional)
                        </span>
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          minLength={6}
                          placeholder="Deixe em branco para manter"
                          className="border border-ink/12 px-3 py-2 text-sm outline-none focus:border-primary-500"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="border border-ink/12 px-4 py-2 text-sm text-ink/60"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary-500 text-sm font-semibold text-ink">
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{u.name || 'Sem nome'}</p>
                        <p className="truncate text-sm text-ink/45">{u.email}</p>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider text-ink/45">
                        {u.role === 'admin' ? 'Admin' : 'Equipe'}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        className="text-sm font-medium text-ink/60 hover:text-ink"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user?.id}
                        className="text-sm font-medium text-red-700 hover:underline disabled:opacity-30"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
