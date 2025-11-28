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
    
    // Usar URL do Vercel para redirect_uri em produção
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    const authUrl = getAuthUrl(redirectUri, frontendUrl);
    
    res.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({ error: 'Falha ao gerar URL de autenticação' });
  }
}

