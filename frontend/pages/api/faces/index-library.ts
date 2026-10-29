import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/api-server/auth';
import {
  faceBackendMissingResponse,
  getFaceBackendUrl,
} from '../../../lib/api-server/backend-proxy';

/**
 * POST /api/faces/index-library
 * Proxy admin → Express Face-API (não roda no Vercel serverless)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await requireAdmin(req);
  if (!auth) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  const backend = getFaceBackendUrl();
  if (!backend) {
    return res.status(503).json(faceBackendMissingResponse());
  }

  try {
    const limit = req.body?.limit ?? 30;
    const upstream = await fetch(`${backend}/api/faces/index-library`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.cookie || '',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ limit }),
    });

    const text = await upstream.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || 'Resposta inválida do backend Face-API' };
    }

    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('Proxy index-library falhou:', error);
    return res.status(502).json({
      error:
        'Não foi possível alcançar o backend Face-API. Confira BACKEND_URL no Vercel e se o serviço está no ar.',
    });
  }
}
