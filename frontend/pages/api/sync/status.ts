import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/sync/status
 * Retorna status da sincronização atual
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { data: syncEvent, error } = await supabase
      .from('sync_events')
      .select('*')
      .eq('user_id', auth.userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!syncEvent) {
      return res.json({ status: 'never_synced' });
    }

    res.json(syncEvent);
  } catch (error: any) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Falha ao obter status de sincronização' });
  }
}

