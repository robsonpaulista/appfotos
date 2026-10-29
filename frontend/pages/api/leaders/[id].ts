import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, requireAdmin } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/leaders/:id
 * DELETE /api/leaders/:id
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'GET') {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { data, error } = await supabase
      .from('leaders')
      .select('id, name, city, role_title, photo_data, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Liderança não encontrada' });
    }
    return res.json({ leader: data });
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }

    const { error } = await supabase.from('leaders').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ error: 'Falha ao remover liderança' });
    }
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
