import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * POST /api/auth/logout
 * Faz logout do usuário removendo o cookie de sessão
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Remover cookie de sessão
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_URL;
    
    const cookieOptions = [
      'session=',
      'HttpOnly',
      isProduction ? 'Secure' : '',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=0', // Expirar imediatamente
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Falha ao fazer logout' });
  }
}

