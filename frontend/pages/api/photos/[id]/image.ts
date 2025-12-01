import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../../lib/api-server/auth';
import { getOAuth2Client } from '../../../../lib/api-server/google.config';
import { supabase } from '../../../../lib/api-server/supabase.config';
import { google } from 'googleapis';

/**
 * GET /api/photos/[id]/image
 * Busca imagem diretamente do Google Drive usando credenciais do usuário
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

    // Verificar autenticação e obter credenciais
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Buscar foto no banco para obter drive_id e mime_type
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('drive_id, mime_type, name, thumbnail_url')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (photoError || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Verificar se é HEIC - se for, usar thumbnail ou retornar erro
    const isHEIC = photo.mime_type?.toLowerCase().includes('heif') || 
                   photo.mime_type?.toLowerCase().includes('heic');
    
    if (isHEIC) {
      // Para HEIC, tentar usar thumbnail se disponível
      if (photo.thumbnail_url) {
        try {
          const thumbnailResponse = await fetch(photo.thumbnail_url);
          if (thumbnailResponse.ok) {
            const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(Buffer.from(thumbnailBuffer));
          }
        } catch (error) {
          console.warn('Erro ao carregar thumbnail:', error);
        }
      }
      
      // Se não tiver thumbnail, retornar erro informando que precisa do backend para conversão
      return res.status(400).json({ 
        error: 'Formato HEIC requer conversão. Use o backend para visualizar.' 
      });
    }

    // Para outros formatos, buscar diretamente do Google Drive
    const oauth2Client = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Buscar arquivo do Google Drive como arraybuffer
    const driveResponse = await drive.files.get(
      { 
        fileId: photo.drive_id, 
        alt: 'media' 
      },
      { 
        responseType: 'arraybuffer' 
      }
    );

    // Configurar headers
    const contentType = photo.mime_type || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Converter arraybuffer para buffer e enviar
    const imageBuffer = Buffer.from(driveResponse.data as ArrayBuffer);
    res.send(imageBuffer);
    
  } catch (error: any) {
    console.error('Erro ao carregar imagem:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao carregar imagem' });
    }
  }
}

