import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';
import { getDriveClient, getDriveFolderId, getLibrarySourceId } from '../../../lib/api-server/google.config';

const CHUNK_SIZE = 10;

/**
 * POST /api/sync/process-chunk
 * Processa um chunk de fotos (admin + service account)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAdmin(req);
    if (!auth) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }

    const { syncId, pageToken } = req.body;
    const userId = auth.userId;
    const libraryId = getLibrarySourceId();
    const rootFolderId = getDriveFolderId();

    if (!syncId) {
      return res.status(400).json({ error: 'syncId é obrigatório' });
    }

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

    const drive = await getDriveClient();

    async function collectSubfolders(folderId: string): Promise<string[]> {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });
      const ids = (response.data.files || []).map(f => f.id!).filter(Boolean);
      let all = [...ids];
      for (const id of ids) {
        all = all.concat(await collectSubfolders(id));
      }
      return all;
    }

    const subIds = await collectSubfolders(rootFolderId);
    const folderIds = [rootFolderId, ...subIds];
    const folderQuery = folderIds.map(id => `'${id}' in parents`).join(' or ');
    const query = `mimeType contains 'image/' and trashed=false and (${folderQuery})`;

    const response = await drive.files.list({
      q: query,
      pageSize: CHUNK_SIZE,
      pageToken: pageToken || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, thumbnailLink, webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = response.data.files || [];
    const nextPageToken = response.data.nextPageToken || null;

    if (files.length === 0) {
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

    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const { data: existing } = await supabase
          .from('photos')
          .select('id')
          .eq('drive_id', file.id)
          .eq('user_id', libraryId)
          .single();

        const photoData = {
          drive_id: file.id,
          user_id: libraryId,
          drive_folder_id: rootFolderId,
          name: file.name || 'Sem nome',
          created_at: file.createdTime || new Date().toISOString(),
          modified_at: file.modifiedTime || new Date().toISOString(),
          size_bytes: file.size ? parseInt(file.size, 10) : null,
          thumbnail_url: file.thumbnailLink || null,
          storage_url: file.webViewLink || null,
          mime_type: file.mimeType || 'image/jpeg'
        };

        if (existing) {
          await supabase.from('photos').update(photoData).eq('id', existing.id);
          updated++;
        } else {
          await supabase.from('photos').insert(photoData);
          added++;
        }
      } catch (error: unknown) {
        console.error('Erro ao processar arquivo:', file.id, error);
        errors++;
      }
    }

    const newProcessed = (syncEvent.photos_processed || 0) + files.length;
    const newAdded = (syncEvent.photos_added || 0) + added;
    const newUpdated = (syncEvent.photos_updated || 0) + updated;

    await supabase
      .from('sync_events')
      .update({
        status: nextPageToken ? 'in_progress' : 'completed',
        photos_processed: newProcessed,
        photos_added: newAdded,
        photos_updated: newUpdated,
        completed_at: nextPageToken ? null : new Date().toISOString()
      })
      .eq('id', syncId);

    return res.json({
      done: !nextPageToken,
      nextPageToken,
      stats: {
        processed: newProcessed,
        added: newAdded,
        updated: newUpdated,
        errors
      }
    });
  } catch (error: unknown) {
    console.error('Erro no process-chunk:', error);
    return res.status(500).json({ error: 'Falha ao processar chunk' });
  }
}
