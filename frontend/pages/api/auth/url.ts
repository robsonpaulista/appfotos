import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUrl } from '../../../lib/api-server/google.config';
import { getFrontendUrl } from '../../../lib/api-server/utils';

/**
 * GET /api/auth/url
 * Retorna URL de autenticação do Google
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Detectar URL do frontend
    const frontendUrl = getFrontendUrl(req);
    
    // Usar a URL da requisição atual (header host) para garantir que funciona em preview e produção
    let baseUrl: string;
    
    if (req.headers.host) {
      // Usar o host da requisição atual (funciona em preview e produção)
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      baseUrl = `${protocol}://${req.headers.host}`;
    } else if (process.env.VERCEL_URL) {
      // Fallback para VERCEL_URL se host não estiver disponível
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Fallback para desenvolvimento local
      baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    }
    
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    const authUrl = getAuthUrl(redirectUri, frontendUrl);
    
    res.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({ error: 'Falha ao gerar URL de autenticação' });
  }
}

