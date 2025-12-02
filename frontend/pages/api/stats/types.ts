import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/stats/types
 * Lista todos os tipos de eventos disponíveis
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { data } = await supabase
      .from('photos')
      .select('event_type')
      .eq('user_id', auth.userId)
      .not('event_type', 'is', null);

    const types = [...new Set(data?.map(p => p.event_type))].filter(Boolean).sort();
    res.json(types);
  } catch (error: any) {
    console.error('Erro ao listar tipos:', error);
    res.status(500).json({ error: 'Falha ao listar tipos' });
  }
}


