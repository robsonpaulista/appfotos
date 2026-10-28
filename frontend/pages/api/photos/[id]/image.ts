import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../../lib/api-server/auth';
import { getDriveClient, getLibrarySourceId } from '../../../../lib/api-server/google.config';
import { supabase } from '../../../../lib/api-server/supabase.config';

/**
 * GET /api/photos/[id]/image
 * Busca imagem do Google Drive via service account
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

    let auth = await requireAuth(req);

    // Fallback: token na query (userId em base64) — valida perfil em app_users
    if (!auth && token && typeof token === 'string') {
      try {
        const userId = Buffer.from(token, 'base64').toString('utf-8');
        const { data: user, error } = await supabase
          .from('app_users')
          .select('id, email, name, role')
          .eq('id', userId)
          .single();

        if (!error && user) {
          auth = {
            userId: user.id,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            },
            accessToken: ''
          };
        }
      } catch {
        // ignore
      }
    }

    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const libraryId = getLibrarySourceId();

    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('drive_id, mime_type, name, thumbnail_url')
      .eq('id', id)
      .eq('user_id', libraryId)
      .single();

    if (photoError || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Fixture local (teste): drive_id = local:fotosteste/arquivo.jpg
    if (typeof photo.drive_id === 'string' && photo.drive_id.startsWith('local:')) {
      const relative = photo.drive_id.slice('local:'.length);
      const path = await import('path');
      const fs = await import('fs');
      const fullPath = path.join(process.cwd(), '..', relative);
      const altPath = path.join(process.cwd(), relative);
      const filePath = fs.existsSync(fullPath) ? fullPath : altPath;
      if (!fs.existsSync(filePath)) {
        // fallback: data-URL thumbnail gravado no banco
        if (photo.thumbnail_url?.startsWith('data:')) {
          const base64 = photo.thumbnail_url.split(',')[1];
          const buf = Buffer.from(base64, 'base64');
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'private, max-age=60');
          return res.send(buf);
        }
        return res.status(404).json({ error: 'Arquivo local de teste não encontrado' });
      }
      const buf = fs.readFileSync(filePath);
      res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=60');
      return res.send(buf);
    }

    // Thumbnail já é data URL (fixtures)
    if (photo.thumbnail_url?.startsWith('data:image')) {
      const base64 = photo.thumbnail_url.split(',')[1];
      if (base64) {
        const buf = Buffer.from(base64, 'base64');
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'private, max-age=60');
        return res.send(buf);
      }
    }

    const drive = await getDriveClient();

    const isHEIC = photo.mime_type?.toLowerCase().includes('heif') ||
                   photo.mime_type?.toLowerCase().includes('heic');

    if (isHEIC) {
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

      try {
        const thumbnailResponse = await drive.files.get({
          fileId: photo.drive_id,
          fields: 'thumbnailLink',
          supportsAllDrives: true
        });

        if (thumbnailResponse.data.thumbnailLink) {
          const thumbnailFetch = await fetch(thumbnailResponse.data.thumbnailLink);
          if (thumbnailFetch.ok) {
            const thumbnailBuffer = await thumbnailFetch.arrayBuffer();
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(Buffer.from(thumbnailBuffer));
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar thumbnail do Drive:', error);
      }

      return res.status(503).json({
        error: 'Imagem HEIC requer conversão. Use o backend para visualização completa.'
      });
    }

    const driveResponse = await drive.files.get(
      {
        fileId: photo.drive_id,
        alt: 'media',
        supportsAllDrives: true
      },
      { responseType: 'arraybuffer' }
    );

    const contentType = photo.mime_type || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const imageBuffer = Buffer.from(driveResponse.data as ArrayBuffer);
    res.send(imageBuffer);
  } catch (error: unknown) {
    console.error('Erro ao carregar imagem:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao carregar imagem' });
    }
  }
}
