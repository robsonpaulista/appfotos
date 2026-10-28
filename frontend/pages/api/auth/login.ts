import type { NextApiRequest, NextApiResponse } from 'next';
import {
  signInWithPassword,
  setAuthCookies,
  clearAuthCookies
} from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * POST /api/auth/login
 * Login com e-mail e senha (Supabase Auth)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const data = await signInWithPassword(
      String(email).trim().toLowerCase(),
      String(password)
    );

    if (!process.env.SUPABASE_SERVICE_KEY && process.env.VERCEL) {
      console.error('SUPABASE_SERVICE_KEY ausente no Vercel — login/perfil podem falhar');
    }

    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      clearAuthCookies(res);
      console.error('Login Auth OK, mas sem app_users:', data.user.id, data.user.email, profileError?.message);
      return res.status(403).json({
        error:
          'Usuário autenticado, mas sem perfil em app_users. No Supabase SQL, vincule o UUID do Auth à tabela app_users (role admin/viewer).'
      });
    }

    setAuthCookies(
      res,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_in || 3600
    );

    const imageToken = Buffer.from(profile.id, 'utf-8').toString('base64');

    return res.status(200).json({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      },
      imageToken
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao fazer login';
    console.error('Erro no login:', message);
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }
}
