import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/api-server/auth';
import {
  faceBackendMissingResponse,
  getFaceBackendUrl,
} from '../../../lib/api-server/backend-proxy';

export const config = {
  maxDuration: 60,
};

/**
 * POST /api/faces/index-library
 * Proxy admin → Express Face-API (não roda no Vercel serverless)
 * Use limit pequeno (2–5): o free do Vercel pode cortar em 10s.
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
    const rawLimit = Number(req.body?.limit ?? 3);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 3, 1), 10);

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
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = {
        error:
          text?.slice(0, 300) ||
          'Resposta inválida do backend Face-API (HTML/timeout). Confira o Render.',
      };
    }

    // Sempre devolver error como string (evita crash no React: [object Object])
    if (data.error != null && typeof data.error !== 'string') {
      const errObj = data.error as { message?: unknown };
      data.error =
        typeof errObj?.message === 'string'
          ? errObj.message
          : JSON.stringify(data.error);
    }

    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('Proxy index-library falhou:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({
      error: `Não foi possível alcançar o backend Face-API (${message}). Confira BACKEND_URL e o /health do Render.`,
    });
  }
}
