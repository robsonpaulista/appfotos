import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/api-server/supabase.config';
import { parseSessionCookie } from '../../../lib/api-server/auth';

/**
 * GET /api/auth/status
 * Verifica status de autenticação
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const session = parseSessionCookie(req);
    
    if (!session || !session.userId) {
      return res.json({ authenticated: false });
    }

    // Verificar se usuário ainda existe
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, google_id')
      .eq('id', session.userId)
      .single();

    if (error || !user) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Falha ao verificar status de autenticação' });
  }
}

