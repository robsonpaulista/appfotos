import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAuthCookies } from '../../../lib/api-server/auth';

/**
 * POST /api/auth/logout
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    clearAuthCookies(res);
    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({ error: 'Falha ao fazer logout' });
  }
}
