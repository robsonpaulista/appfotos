import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';
import { getOAuth2Client, setCredentials } from '../../../lib/api-server/google.config';
import { google } from 'googleapis';

const CHUNK_SIZE = 10; // Processar apenas 10 fotos por vez para evitar timeout

/**
 * POST /api/sync/process-chunk
 * Processa um chunk pequeno de fotos (adaptado para timeout do Vercel)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { syncId, pageToken } = req.body;
    const userId = auth.userId;

    if (!syncId) {
      return res.status(400).json({ error: 'syncId é obrigatório' });
    }

    // Obter evento de sincronização
    const { data: syncEvent, error: syncError } = await supabase
      .from('sync_events')
      .select('*')
      .eq('id', syncId)
      .eq('user_id', userId)
      .single();

    if (syncError || !syncEvent) {
      return res.status(404).json({ error: 'Sincronização não encontrada' });
    }

    if (syncEvent.status === 'completed' || syncEvent.status === 'failed') {
      return res.json({
        done: true,
        stats: {
          processed: syncEvent.photos_processed,
          added: syncEvent.photos_added,
          updated: syncEvent.photos_updated
        }
      });
    }

    // Configurar cliente do Google Drive com tokens do usuário
    const { data: userTokens } = await supabase
      .from('users')
      .select('access_token, refresh_token, token_expiry')
      .eq('id', userId)
      .single();

    if (!userTokens || !userTokens.access_token) {
      return res.status(401).json({ error: 'Tokens não encontrados' });
    }

    // Configurar credenciais
    setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token,
      expiry_date: userTokens.token_expiry ? new Date(userTokens.token_expiry).getTime() : undefined
    });
    
    const oauth2Client = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Buscar fotos do Google Drive
    const response = await drive.files.list({
      q: "mimeType contains 'image/' and trashed=false",
      pageSize: CHUNK_SIZE,
      pageToken: pageToken || undefined,
      fields: 'nextPageToken, files(id, name, createdTime, modifiedTime, size, thumbnailLink, webViewLink)'
    });

    const files = response.data.files || [];
    const nextPageToken = response.data.nextPageToken || null;

    if (files.length === 0) {
      // Finalizar sincronização
      await supabase
        .from('sync_events')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', syncId);

      return res.json({
        done: true,
        stats: {
          processed: syncEvent.photos_processed,
          added: syncEvent.photos_added,
          updated: syncEvent.photos_updated
        }
      });
    }

    // Processar chunk de fotos
    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const file of files) {
      try {
        // Verificar se foto já existe (usar drive_id que é o campo correto)
        const { data: existing } = await supabase
          .from('photos')
          .select('id')
          .eq('drive_id', file.id)
          .eq('user_id', userId)
          .single();

        const photoData: any = {
          drive_id: file.id,
          user_id: userId,
          name: file.name || 'Sem nome',
          created_at: file.createdTime || new Date().toISOString(),
          modified_at: file.modifiedTime || new Date().toISOString(),
          size_bytes: file.size ? parseInt(file.size) : null,
          thumbnail_url: file.thumbnailLink || null,
          storage_url: file.webViewLink || null,
          mime_type: 'image/jpeg' // Será atualizado quando processar metadados
        };

        if (existing) {
          // Atualizar
          await supabase
            .from('photos')
            .update(photoData)
            .eq('id', existing.id);
          updated++;
        } else {
          // Adicionar
          await supabase
            .from('photos')
            .insert(photoData);
          added++;
        }
      } catch (error: any) {
        console.error(`Erro ao processar foto ${file.id}:`, error.message);
        errors++;
      }
    }

    // Atualizar evento de sincronização
    const newProcessed = syncEvent.photos_processed + files.length;
    const newAdded = syncEvent.photos_added + added;
    const newUpdated = syncEvent.photos_updated + updated;

    await supabase
      .from('sync_events')
      .update({
        status: 'in_progress',
        photos_processed: newProcessed,
        photos_added: newAdded,
        photos_updated: newUpdated
      })
      .eq('id', syncId);

    res.json({
      done: false,
      nextPageToken,
      chunkStats: {
        processed: files.length,
        added,
        updated,
        errors
      },
      totalStats: {
        processed: newProcessed,
        added: newAdded,
        updated: newUpdated
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar chunk:', error);
    res.status(500).json({ error: 'Falha ao processar chunk' });
  }
}

