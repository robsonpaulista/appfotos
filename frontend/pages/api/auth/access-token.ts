import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';

/**
 * GET /api/auth/access-token
 * Devolve o JWT da sessão (para o browser chamar o Render direto,
 * evitando o timeout do proxy serverless do Vercel).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await requireAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  return res.json({
    accessToken: auth.accessToken,
    role: auth.user.role,
  });
}
