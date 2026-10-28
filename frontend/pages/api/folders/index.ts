import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import {
  getDriveClient,
  getDriveEnvStatus,
  getDriveFolderId,
  getServiceAccessToken,
} from '../../../lib/api-server/google.config';

type FolderNode = {
  id: string;
  name: string;
  parents: string[];
  createdTime?: string | null;
  modifiedTime?: string | null;
  children: FolderNode[];
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const withResponse = error as Error & {
      response?: { data?: { error?: { message?: string } | string } };
    };
    const nested = withResponse.response?.data?.error;
    if (typeof nested === 'string' && nested.trim()) return nested;
    if (nested && typeof nested === 'object' && typeof nested.message === 'string') {
      return nested.message;
    }
    return error.message || 'Falha ao listar pastas';
  }
  if (typeof error === 'string') return error;
  return 'Falha ao listar pastas';
}

/**
 * GET /api/folders
 * Lista pastas sob DRIVE_FOLDER_ID (service account)
 * ?diagnose=1 → status das env vars + teste de token (sem listar árvore)
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

    const env = getDriveEnvStatus();

    if (req.query.diagnose === '1') {
      const diagnose: Record<string, unknown> = { ok: true, env };
      try {
        if (!env.hasServiceAccountJson && !env.hasCredentialsFile) {
          diagnose.token = 'skipped';
          diagnose.error = 'Sem credencial de service account';
        } else {
          await getServiceAccessToken();
          diagnose.token = 'ok';
          if (env.hasDriveFolderId) {
            const drive = await getDriveClient();
            const root = await drive.files.get({
              fileId: getDriveFolderId(),
              fields: 'id, name',
              supportsAllDrives: true,
            });
            diagnose.root = { id: root.data.id, name: root.data.name };
          }
        }
      } catch (diagError) {
        diagnose.ok = false;
        diagnose.token = 'fail';
        diagnose.error = toErrorMessage(diagError);
      }
      return res.json(diagnose);
    }

    if (!env.hasServiceAccountJson && !env.hasCredentialsFile) {
      return res.status(500).json({
        error:
          'GOOGLE_SERVICE_ACCOUNT_JSON não está definida no Vercel. Cole o JSON da service account e faça Redeploy.',
        env,
      });
    }
    if (!env.hasDriveFolderId) {
      return res.status(500).json({
        error:
          'DRIVE_FOLDER_ID não está definida no Vercel. Use o ID da pasta raiz compartilhada com a service account.',
        env,
      });
    }

    let drive;
    try {
      drive = await getDriveClient();
    } catch (credError) {
      return res.status(500).json({
        error: `Falha ao autenticar a service account: ${toErrorMessage(credError)}`,
        env,
      });
    }

    const rootFolderId = getDriveFolderId();

    let rootMeta: { id: string; name: string; parents: string[] };
    try {
      const rootInfo = await drive.files.get({
        fileId: rootFolderId,
        fields: 'id, name, parents, createdTime, modifiedTime',
        supportsAllDrives: true,
      });
      rootMeta = {
        id: rootInfo.data.id!,
        name: rootInfo.data.name || 'Raiz',
        parents: rootInfo.data.parents || [],
      };
    } catch (getError) {
      return res.status(500).json({
        error: `Não foi possível ler a pasta raiz DRIVE_FOLDER_ID. Confira o ID e o compartilhamento com a service account. (${toErrorMessage(getError)})`,
        env,
      });
    }

    // BFS: um files.list por pasta, já com name/parents (sem N files.get)
    const folders: Array<{
      id: string;
      name: string;
      parents: string[];
      createdTime?: string | null;
      modifiedTime?: string | null;
    }> = [
      {
        id: rootMeta.id,
        name: rootMeta.name,
        parents: rootMeta.parents,
      },
    ];

    const queue: string[] = [rootFolderId];
    const seen = new Set<string>([rootFolderId]);
    const maxFolders = 500;

    try {
      while (queue.length > 0 && folders.length < maxFolders) {
        const folderId = queue.shift()!;
        let pageToken: string | undefined;

        do {
          const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields:
              'nextPageToken, files(id, name, parents, createdTime, modifiedTime)',
            pageSize: 100,
            pageToken,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });

          for (const file of response.data.files || []) {
            if (!file.id || seen.has(file.id)) continue;
            seen.add(file.id);
            folders.push({
              id: file.id,
              name: file.name || 'Sem nome',
              parents: file.parents || [],
              createdTime: file.createdTime,
              modifiedTime: file.modifiedTime,
            });
            queue.push(file.id);
            if (folders.length >= maxFolders) break;
          }

          pageToken = response.data.nextPageToken || undefined;
        } while (pageToken && folders.length < maxFolders);
      }
    } catch (listError) {
      return res.status(500).json({
        error: `Drive recusou listar pastas (compartilhe a pasta com jarchive@…iam.gserviceaccount.com): ${toErrorMessage(listError)}`,
        env,
      });
    }

    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    for (const folder of folders) {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parents: folder.parents,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
        children: [],
      });
    }

    for (const folder of folders) {
      const node = folderMap.get(folder.id);
      if (!node) continue;
      if (folder.id === rootFolderId) {
        rootFolders.push(node);
        continue;
      }
      const parentId = folder.parents[0];
      const parent = parentId ? folderMap.get(parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        rootFolders.push(node);
      }
    }

    res.json({
      folders,
      tree: rootFolders,
      total: folders.length,
      rootFolderId,
    });
  } catch (error) {
    console.error('Erro ao listar pastas:', error);
    res.status(500).json({ error: toErrorMessage(error), env: getDriveEnvStatus() });
  }
}
