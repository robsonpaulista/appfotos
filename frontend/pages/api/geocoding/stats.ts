import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/geocoding/stats
 * Retorna estatísticas de geocoding (fotos com GPS sem localização)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação - tentar cookie primeiro, depois token na query string
    let auth = await requireAuth(req);
    
    // Se não autenticado via cookie, tentar token na query string
    if (!auth) {
      const { token } = req.query;
      if (token && typeof token === 'string') {
        try {
          const userId = Buffer.from(token, 'base64').toString('utf-8');
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (user) {
            auth = { userId: user.id, user };
          }
        } catch {
          // Ignorar erro
        }
      }
    }
    
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Contar fotos com GPS
    const { count: withGpsCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null);

    // Contar fotos com GPS mas sem location_name
    const { count: withoutLocationCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null)
      .is('location_name', null);

    res.json({
      withGps: withGpsCount || 0,
      withoutLocation: withoutLocationCount || 0
    });
  } catch (error: any) {
    console.error('Erro ao obter stats de geocoding:', error);
    res.status(500).json({ error: 'Falha ao obter estatísticas' });
  }
}


