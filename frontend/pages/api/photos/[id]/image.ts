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
    const { id, token } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de foto inválido' });
    }

    // Verificar autenticação - tentar cookie primeiro, depois token na query string
    let auth = await requireAuth(req);
    
    // Se não autenticado via cookie, tentar token na query string
    if (!auth && token && typeof token === 'string') {
      try {
        // Token é simplesmente o userId codificado em base64 (temporário, para desenvolvimento)
        // Em produção, deveria ser um JWT assinado
        const userId = Buffer.from(token, 'base64').toString('utf-8');
        
        // Buscar usuário no banco
        const { data: user, error } = await supabase
          .from('users')
          .select('id, access_token, refresh_token, token_expiry')
          .eq('id', userId)
          .single();
        
        if (!error && user) {
          auth = {
            userId: user.id,
            user
          };
          
          // Configurar credenciais do Google
          if (user.access_token) {
            const { setCredentials } = await import('../../../../lib/api-server/google.config');
            setCredentials({
              access_token: user.access_token,
              refresh_token: user.refresh_token,
              expiry_date: user.token_expiry ? new Date(user.token_expiry).getTime() : undefined
            });
          }
        }
      } catch (tokenError) {
        // Ignorar erro do token, continuar sem autenticação
      }
    }
    
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

    // Configurar cliente do Google Drive
    const oauth2Client = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Verificar se é HEIC - se for, converter para JPEG
    const isHEIC = photo.mime_type?.toLowerCase().includes('heif') || 
                   photo.mime_type?.toLowerCase().includes('heic');
    
    if (isHEIC) {
      try {
        // Buscar arquivo HEIC do Google Drive
        const driveResponse = await drive.files.get(
          { 
            fileId: photo.drive_id, 
            alt: 'media' 
          },
          { 
            responseType: 'arraybuffer' 
          }
        );

        const heicBuffer = Buffer.from(driveResponse.data as ArrayBuffer);
        
        // Converter HEIC para JPEG
        const heicConvert = (await import('heic-convert')).default as (options: { buffer: Buffer; format: 'JPEG' | 'PNG'; quality?: number }) => Promise<Buffer>;
        const sharp = (await import('sharp')).default;
        
        console.log(`🔄 Convertendo HEIC para JPEG: ${photo.name}`);
        const startTime = Date.now();
        
        // Converter HEIC para JPEG
        const jpegBuffer = await heicConvert({
          buffer: heicBuffer,
          format: 'JPEG',
          quality: 0.95 // Alta qualidade (95%)
        });
        
        // Otimizar com Sharp
        const optimizedBuffer = await sharp(jpegBuffer)
          .jpeg({ 
            quality: 95, 
            progressive: true,
            mozjpeg: true 
          })
          .toBuffer();
        
        const elapsedTime = Date.now() - startTime;
        const sizeInMB = optimizedBuffer.length / 1024 / 1024;
        console.log(`✅ Convertido em ${elapsedTime}ms (${sizeInMB.toFixed(2)}MB)`);
        
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
        return res.send(optimizedBuffer);
      } catch (conversionError: any) {
        console.error('Erro ao converter HEIC:', conversionError);
        
        // Fallback: tentar usar thumbnail se disponível
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
        
        // Se tudo falhar, retornar erro
        return res.status(500).json({ 
          error: 'Falha ao converter imagem HEIC' 
        });
      }
    }

    // Para outros formatos, buscar diretamente do Google Drive
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

