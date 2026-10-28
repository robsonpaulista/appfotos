import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { getDriveClient, getDriveFolderId } from '../../../lib/api-server/google.config';

/**
 * GET /api/folders
 * Lista pastas sob DRIVE_FOLDER_ID (service account)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const drive = await getDriveClient();
    const rootFolderId = getDriveFolderId();

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
    const allIds = [rootFolderId, ...subIds];

    const folders: Array<{
      id: string;
      name: string | null | undefined;
      parents: string[];
      createdTime?: string | null;
      modifiedTime?: string | null;
    }> = [];

    for (const folderId of allIds) {
      try {
        const info = await drive.files.get({
          fileId: folderId,
          fields: 'id, name, parents, createdTime, modifiedTime',
          supportsAllDrives: true
        });
        folders.push({
          id: info.data.id!,
          name: info.data.name,
          parents: info.data.parents || [],
          createdTime: info.data.createdTime,
          modifiedTime: info.data.modifiedTime
        });
      } catch {
        // ignore
      }
    }

    const folderMap = new Map<string, {
      id: string;
      name: string | null | undefined;
      parents: string[];
      children: unknown[];
    }>();
    const rootFolders: unknown[] = [];

    folders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parents: folder.parents || [],
        children: []
      });
    });

    folders.forEach(folder => {
      const folderData = folderMap.get(folder.id);
      if (!folderData) return;
      if (folderData.parents.length === 0 || folder.id === rootFolderId) {
        if (!rootFolders.includes(folderData)) {
          rootFolders.push(folderData);
        }
      } else {
        const parent = folderMap.get(folderData.parents[0]);
        if (parent) {
          parent.children.push(folderData);
        } else {
          rootFolders.push(folderData);
        }
      }
    });

    res.json({
      folders,
      tree: rootFolders,
      total: folders.length,
      rootFolderId
    });
  } catch (error) {
    console.error('Erro ao listar pastas:', error);
    res.status(500).json({ error: 'Falha ao listar pastas' });
  }
}
