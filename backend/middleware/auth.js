import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.config.js';

const SESSION_COOKIE = 'pf_access_token';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) return acc;
    const key = trimmed.substring(0, equalIndex);
    const value = trimmed.substring(equalIndex + 1);
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function getAccessToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE] || null;
}

async function loadAppUser(userId) {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, email, name, role')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

async function resolveAuth(req) {
  const accessToken = getAccessToken(req);
  if (!accessToken) return null;

  const { data: authData, error } = await supabase.auth.getUser(accessToken);
  if (error || !authData.user) return null;

  const profile = await loadAppUser(authData.user.id);
  if (!profile) return null;

  return profile;
}

/**
 * Middleware Express: exige usuário autenticado (Supabase Auth + app_users)
 */
export async function requireAuth(req, res, next) {
  try {
    const profile = await resolveAuth(req);
    if (!profile) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    req.user = profile;
    req.session = req.session || {};
    req.session.userId = profile.id;
    next();
  } catch (err) {
    console.error('Erro requireAuth:', err);
    return res.status(401).json({ error: 'Não autenticado' });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const profile = await resolveAuth(req);
    if (!profile) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }

    req.user = profile;
    req.session = req.session || {};
    req.session.userId = profile.id;
    next();
  } catch (err) {
    console.error('Erro requireAdmin:', err);
    return res.status(401).json({ error: 'Não autenticado' });
  }
}

export function createAnonAuthClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export { loadAppUser, getAccessToken, SESSION_COOKIE };
