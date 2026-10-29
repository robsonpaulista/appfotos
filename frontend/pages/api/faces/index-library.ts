import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/api-server/auth';
import {
  faceBackendMissingResponse,
  getFaceBackendUrl,
} from '../../../lib/api-server/backend-proxy';

export const config = {
  maxDuration: 60,
};

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST /api/faces/index-library
 * Proxy admin → Express no Render (BACKEND_URL)
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

  const rawLimit = Number(req.body?.limit ?? 3);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 3, 1), 10);
  const target = `${backend}/api/faces/index-library`;
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: req.headers.cookie || '',
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({ limit }),
  };

  try {
    // 1ª tentativa; se cold start do Render Free falhar, espera e tenta de novo
    let upstream: Response;
    try {
      upstream = await fetchWithTimeout(target, init, 50000);
    } catch (firstError) {
      console.warn('index-library 1ª tentativa falhou, retry (cold start?):', firstError);
      await new Promise((r) => setTimeout(r, 4000));
      upstream = await fetchWithTimeout(target, init, 50000);
    }

    const text = await upstream.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = {
        error:
          text?.slice(0, 300) ||
          `Resposta inválida do Render (HTTP ${upstream.status}). Abra ${backend}/health`,
      };
    }

    if (data.error != null && typeof data.error !== 'string') {
      const errObj = data.error as { message?: unknown };
      data.error =
        typeof errObj?.message === 'string'
          ? errObj.message
          : JSON.stringify(data.error);
    }

    if (!upstream.ok && !data.error) {
      data.error = `Backend Face-API respondeu HTTP ${upstream.status}. Veja logs no Render.`;
    }

    data.backend = backend;
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('Proxy index-library falhou:', error);
    const message = error instanceof Error ? error.message : String(error);
    const coldHint = /abort|timeout|econnrefused|enotfound|fetch failed/i.test(message)
      ? ' Se o Render Free estiver dormindo, abra o /health no navegador, espere ~1 min e tente de novo.'
      : '';
    return res.status(502).json({
      error: `502 ao falar com o Render (${message}). BACKEND_URL=${backend}. Confira se o serviço está Live e ${backend}/health.${coldHint}`,
      backend,
    });
  }
}
