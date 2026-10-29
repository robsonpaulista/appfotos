import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import {
  faceBackendMissingResponse,
  getFaceBackendUrl,
} from '../../../lib/api-server/backend-proxy';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/faces/search-by-image
 * Proxy multipart → Express Face-API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await requireAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const backend = getFaceBackendUrl();
  if (!backend) {
    return res.status(503).json(faceBackendMissingResponse());
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || 'multipart/form-data';

    const upstream = await fetch(`${backend}/api/faces/search-by-image`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(body.length),
        Cookie: req.headers.cookie || '',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body,
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
    console.error('Proxy search-by-image falhou:', error);
    return res.status(502).json({
      error:
        'Não foi possível alcançar o backend Face-API. Confira BACKEND_URL no Vercel e se o serviço está no ar.',
    });
  }
}
