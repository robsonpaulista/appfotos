import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { getBackendUrl } from '../../../lib/api-server/utils';

/**
 * POST /api/geocoding/process
 * Inicia processamento de geocoding (converte GPS em localização)
 * Faz proxy para o backend que tem a lógica de geocoding
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Obter URL do backend
    const backendUrl = getBackendUrl();
    const geocodingUrl = `${backendUrl}/api/geocoding/process`;

    // Fazer requisição para o backend com os cookies
    const cookieHeader = req.headers.cookie || '';
    
    const response = await fetch(geocodingUrl, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: errorText || 'Erro ao processar geocoding' 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Erro ao processar geocoding:', error);
    res.status(500).json({ error: 'Falha ao processar geocoding' });
  }
}

