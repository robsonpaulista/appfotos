import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { getFaceBackendUrl } from '../../../lib/api-server/backend-proxy';

/**
 * GET /api/faces/backend-status
 * Diagnóstico: BACKEND_URL configurada? Render responde /health?
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await requireAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const backend = getFaceBackendUrl();
  if (!backend) {
    return res.json({
      ok: false,
      configured: false,
      message:
        'BACKEND_URL não está definida no Vercel (ou ainda aponta para localhost). Defina a URL do Render e faça Redeploy.',
    });
  }

  const healthUrl = `${backend}/health`;
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const upstream = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await upstream.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }

    return res.json({
      ok: upstream.ok,
      configured: true,
      backend,
      healthUrl,
      status: upstream.status,
      ms: Date.now() - started,
      body,
      message: upstream.ok
        ? 'Backend Face-API alcançável'
        : `Render respondeu HTTP ${upstream.status}. Veja os logs do serviço.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.json({
      ok: false,
      configured: true,
      backend,
      healthUrl,
      ms: Date.now() - started,
      message: `Falha ao conectar no Render: ${message}. Se for plano Free, aguarde o cold start e tente de novo; confira se o serviço está Live.`,
    });
  }
}
