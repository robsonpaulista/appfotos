import type { NextApiRequest } from 'next';

/**
 * Detecta a URL do frontend baseado na requisição
 */
export function getFrontendUrl(req: NextApiRequest): string {
  const origin = req.headers.origin || req.headers.referer || process.env.NEXT_PUBLIC_FRONTEND_URL;
  
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return `${originUrl.protocol}//${originUrl.host}`;
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Fallback para URL do Vercel em produção
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
}

/**
 * Obtém o base URL do backend (mesmo domínio do frontend no Vercel)
 */
export function getBackendUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

