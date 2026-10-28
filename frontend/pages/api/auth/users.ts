import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET/POST /api/auth/users
 * Admin: listar ou criar usuários do app
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAdmin(req);
  if (!auth) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ users: data || [] });
  }

  if (req.method === 'POST') {
    try {
      const { email, password, name, role = 'viewer' } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      }
      if (!['admin', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'role deve ser admin ou viewer' });
      }

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password: String(password),
        email_confirm: true,
        user_metadata: { name: name || null }
      });

      if (createError || !created.user) {
        return res.status(400).json({ error: createError?.message || 'Falha ao criar usuário' });
      }

      const { data: profile, error: profileError } = await supabase
        .from('app_users')
        .insert({
          id: created.user.id,
          email: created.user.email,
          name: name || null,
          role
        })
        .select('id, email, name, role')
        .single();

      if (profileError) {
        return res.status(500).json({ error: profileError.message });
      }

      return res.status(201).json({ user: profile });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Falha ao criar usuário' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
