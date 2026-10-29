import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';
import { getDriveClient, getDriveFolderId, getLibrarySourceId } from '../../../lib/api-server/google.config';
import {
  isStructuralFolderName,
  resolvePhotoLocation,
} from '../../../lib/folder-location';

const CHUNK_SIZE = 10;

type SyncTags = { person?: string; location?: string; event?: string };

/**
 * POST /api/sync/process-chunk
 * Processa um chunk de fotos (admin + service account)
 * Body: syncId, pageToken?, folderId?, folderName?, tags?, folderMap?
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

    const {
      syncId,
      pageToken,
      folderId: bodyFolderId,
      folderName: bodyFolderName,
      tags: bodyTags,
      folderMap: cachedFolderMap,
    } = req.body as {
      syncId?: string;
      pageToken?: string;
      folderId?: string;
      folderName?: string;
      tags?: SyncTags | null;
      folderMap?: Record<string, string>;
    };

    const userId = auth.userId;
    const libraryId = getLibrarySourceId();
    const syncRootId =
      (typeof bodyFolderId === 'string' && bodyFolderId.trim()) || getDriveFolderId();
    const tags = bodyTags || null;

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
          updated: syncEvent.photos_updated,
        },
      });
    }

    const drive = await getDriveClient();

    async function buildFolderMap(rootId: string): Promise<Record<string, string>> {
      const map: Record<string, string> = {};
      const rootInfo = await drive.files.get({
        fileId: rootId,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      if (rootInfo.data.id) {
        map[rootInfo.data.id] = rootInfo.data.name || 'Pasta';
      }

      const queue = [rootId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        let page: string | undefined;
        do {
          const listed = await drive.files.list({
            q: `'${current}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'nextPageToken, files(id, name)',
            pageSize: 100,
            pageToken: page,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });
          for (const f of listed.data.files || []) {
            if (!f.id || map[f.id]) continue;
            map[f.id] = f.name || 'Sem nome';
            queue.push(f.id);
          }
          page = listed.data.nextPageToken || undefined;
        } while (page);
      }
      return map;
    }

    let folderMap: Record<string, string>;
    let syncFolderName = bodyFolderName?.trim() || '';
    try {
      folderMap =
        cachedFolderMap && Object.keys(cachedFolderMap).length > 0
          ? cachedFolderMap
          : await buildFolderMap(syncRootId);
      if (!syncFolderName) {
        syncFolderName = folderMap[syncRootId] || '';
      }
    } catch (mapError) {
      console.error('Erro ao mapear pastas:', mapError);
      return res.status(500).json({
        error: 'Falha ao mapear pastas do Drive para classificar locais',
      });
    }

    const folderIds = Object.keys(folderMap);
    const folderQuery = folderIds.map((id) => `'${id}' in parents`).join(' or ');
    const query = `mimeType contains 'image/' and trashed=false and (${folderQuery})`;

    const response = await drive.files.list({
      q: query,
      pageSize: CHUNK_SIZE,
      pageToken: pageToken || undefined,
      fields:
        'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, thumbnailLink, webViewLink, parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files || [];
    const nextPageToken = response.data.nextPageToken || null;

    if (files.length === 0) {
      await supabase
        .from('sync_events')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncId);

      return res.json({
        done: true,
        folderMap,
        folderId: syncRootId,
        folderName: syncFolderName,
        tags,
        stats: {
          processed: syncEvent.photos_processed,
          added: syncEvent.photos_added,
          updated: syncEvent.photos_updated,
        },
      });
    }

    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const parentId = file.parents?.[0] || null;
        const parentName = parentId ? folderMap[parentId] || null : null;
        const location = resolvePhotoLocation({
          manualLocation: tags?.location,
          syncFolderId: syncRootId,
          syncFolderName,
          parentFolderId: parentId,
          parentFolderName: parentName,
        });

        const { data: existing } = await supabase
          .from('photos')
          .select('id')
          .eq('drive_id', file.id)
          .eq('user_id', libraryId)
          .single();

        const photoData: Record<string, unknown> = {
          drive_id: file.id,
          user_id: libraryId,
          drive_folder_id: parentId || syncRootId,
          name: file.name || 'Sem nome',
          created_at: file.createdTime || new Date().toISOString(),
          modified_at: file.modifiedTime || new Date().toISOString(),
          size_bytes: file.size ? parseInt(file.size, 10) : null,
          thumbnail_url: file.thumbnailLink || null,
          storage_url: file.webViewLink || null,
          mime_type: file.mimeType || 'image/jpeg',
        };

        if (location) {
          photoData.location_name = location;
          // event_city só se não for pasta estrutural (cidade real)
          if (!isStructuralFolderName(location)) {
            photoData.event_city = location;
          }
        }
        if (tags?.person) photoData.person_tag = tags.person;
        if (tags?.event) photoData.event_type = tags.event;

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
        completed_at: nextPageToken ? null : new Date().toISOString(),
      })
      .eq('id', syncId);

    return res.json({
      done: !nextPageToken,
      nextPageToken,
      folderMap,
      folderId: syncRootId,
      folderName: syncFolderName,
      tags,
      stats: {
        processed: newProcessed,
        added: newAdded,
        updated: newUpdated,
        errors,
      },
    });
  } catch (error: unknown) {
    console.error('Erro no process-chunk:', error);
    return res.status(500).json({ error: 'Falha ao processar chunk' });
  }
}
