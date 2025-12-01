import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../../lib/api-server/auth';
import { getBackendUrl } from '../../../../lib/api-server/utils';

/**
 * GET /api/photos/[id]/image
 * Proxy para a imagem do backend
 * Isso resolve o problema de cookies não serem enviados em requisições cross-origin
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de foto inválido' });
    }

    // Verificar autenticação
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Obter URL do backend
    const backendUrl = getBackendUrl();
    const imageUrl = `${backendUrl}/api/photos/${id}/image`;

    // Fazer requisição para o backend com os cookies
    const cookieHeader = req.headers.cookie || '';
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ Proxy de imagem:', {
        photoId: id,
        backendUrl,
        hasCookies: !!cookieHeader,
      });
    }
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': req.headers['user-agent'] || 'PhotoFinder-Proxy',
      },
    });

    if (!response.ok) {
      // Se o backend retornar erro, tentar obter mensagem de erro
      let errorMessage = 'Erro ao carregar imagem';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Se não for JSON, tentar texto
        try {
          errorMessage = await response.text() || errorMessage;
        } catch {
          // Ignorar erro ao ler resposta
        }
      }
      
      console.error('❌ Erro do backend:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      });
      
      return res.status(response.status).json({ 
        error: errorMessage 
      });
    }

    // Obter o tipo de conteúdo da resposta
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const cacheControl = response.headers.get('cache-control') || 'public, max-age=3600';

    // Configurar headers da resposta
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', cacheControl);

    // Obter o buffer da imagem
    const imageBuffer = await response.arrayBuffer();

    // Enviar a imagem
    res.send(Buffer.from(imageBuffer));
  } catch (error: any) {
    console.error('Erro ao fazer proxy da imagem:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao carregar imagem' });
    }
  }
}

