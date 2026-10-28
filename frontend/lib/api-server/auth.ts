import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase.config';

export type AppRole = 'admin' | 'viewer';

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
}

export interface AuthResult {
  userId: string;
  user: AppUser;
  accessToken: string;
}

const SESSION_COOKIE = 'pf_access_token';
const REFRESH_COOKIE = 'pf_refresh_token';

function getCookie(req: NextApiRequest, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) return acc;
    const key = trimmed.substring(0, equalIndex);
    const value = trimmed.substring(equalIndex + 1);
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  return cookies[name] || null;
}

function cookieOptions(maxAgeSeconds: number): string {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL_URL;
  return [
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    isProduction ? 'SameSite=Lax; Secure' : 'SameSite=Lax'
  ].join('; ');
}

export function setAuthCookies(
  res: NextApiResponse,
  accessToken: string,
  refreshToken?: string | null,
  expiresIn = 3600
) {
  const cookies = [
    `${SESSION_COOKIE}=${encodeURIComponent(accessToken)}; ${cookieOptions(expiresIn)}`
  ];
  if (refreshToken) {
    cookies.push(
      `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; ${cookieOptions(60 * 60 * 24 * 30)}`
    );
  }
  res.setHeader('Set-Cookie', cookies);
}

export function clearAuthCookies(res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=; ${cookieOptions(0)}`,
    `${REFRESH_COOKIE}=; ${cookieOptions(0)}`
  ]);
}

function createAnonAuthClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios para login');
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function signInWithPassword(email: string, password: string) {
  const client = createAnonAuthClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Credenciais inválidas');
  }
  return data;
}

async function loadAppUser(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, email, name, role')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as AppRole
  };
}

/**
 * Valida JWT do cookie e carrega perfil em app_users
 */
export async function requireAuth(req: NextApiRequest): Promise<AuthResult | null> {
  const accessToken = getCookie(req, SESSION_COOKIE);
  if (!accessToken) return null;

  try {
    const { data: authData, error } = await supabase.auth.getUser(accessToken);
    if (error || !authData.user) return null;

    const profile = await loadAppUser(authData.user.id);
    if (!profile) return null;

    return {
      userId: profile.id,
      user: profile,
      accessToken
    };
  } catch (err) {
    console.error('Erro na autenticação:', err);
    return null;
  }
}

export async function requireAdmin(req: NextApiRequest): Promise<AuthResult | null> {
  const auth = await requireAuth(req);
  if (!auth || auth.user.role !== 'admin') return null;
  return auth;
}

/** @deprecated Preferir requireAuth; mantido para compatibilidade */
export function parseSessionCookie(req: NextApiRequest): { userId: string } | null {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  return { userId: 'pending' };
}
