import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../../lib/api-server/auth';
import { supabase } from '../../../../lib/api-server/supabase.config';

/**
 * PUT/DELETE /api/auth/users/:id
 * Admin: atualizar perfil/senha ou remover usuário
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAdmin(req);
  if (!auth) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, role, password } = req.body || {};

      if (role !== undefined && !['admin', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'role deve ser admin ou viewer' });
      }

      if (password !== undefined && String(password).length > 0 && String(password).length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }

      const authUpdate: { password?: string; user_metadata?: { name?: string | null } } = {};
      if (password) authUpdate.password = String(password);
      if (name !== undefined) authUpdate.user_metadata = { name: name || null };

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdate);
        if (authError) {
          return res.status(400).json({ error: authError.message });
        }
      }

      const profileUpdate: { name?: string | null; role?: string; updated_at?: string } = {};
      if (name !== undefined) profileUpdate.name = name ? String(name).trim() : null;
      if (role !== undefined) profileUpdate.role = role;
      profileUpdate.updated_at = new Date().toISOString();

      const { data: profile, error: profileError } = await supabase
        .from('app_users')
        .update(profileUpdate)
        .eq('id', id)
        .select('id, email, name, role, created_at')
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: profileError?.message || 'Usuário não encontrado' });
      }

      return res.json({ user: profile });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Falha ao atualizar usuário' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      if (id === auth.userId) {
        return res.status(400).json({ error: 'Você não pode remover a si mesmo' });
      }

      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
      if (deleteAuthError) {
        return res.status(400).json({ error: deleteAuthError.message });
      }

      await supabase.from('app_users').delete().eq('id', id);

      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      return res.status(500).json({ error: 'Falha ao remover usuário' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
