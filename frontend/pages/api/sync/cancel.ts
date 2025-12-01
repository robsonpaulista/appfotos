import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * POST /api/sync/cancel
 * Cancela/reseta a sincronização em andamento
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Buscar sincronização em andamento
    const { data: syncEvent } = await supabase
      .from('sync_events')
      .select('id')
      .eq('user_id', auth.userId)
      .in('status', ['started', 'in_progress'])
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (syncEvent) {
      // Marcar como cancelada
      await supabase
        .from('sync_events')
        .update({
          status: 'failed',
          error_message: 'Cancelado pelo usuário',
          completed_at: new Date().toISOString()
        })
        .eq('id', syncEvent.id);
    }

    res.json({ 
      message: 'Sincronização cancelada',
      success: true
    });
  } catch (error: any) {
    console.error('Erro ao cancelar sincronização:', error);
    res.status(500).json({ error: 'Falha ao cancelar sincronização' });
  }
}

