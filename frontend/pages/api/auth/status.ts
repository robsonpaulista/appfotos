import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';

/**
 * GET /api/auth/status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.json({ authenticated: false });
    }

    const imageToken = Buffer.from(auth.user.id, 'utf-8').toString('base64');

    return res.status(200).json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name || '',
        role: auth.user.role
      },
      imageToken
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ error: 'Falha ao verificar status de autenticação' });
  }
}
