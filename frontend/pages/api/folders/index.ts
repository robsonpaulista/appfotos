import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import {
  getDriveClient,
  getDriveEnvStatus,
  getDriveFolderId,
  getServiceAccessToken,
} from '../../../lib/api-server/google.config';
import type { drive_v3 } from 'googleapis';

type FolderNode = {
  id: string;
  name: string;
  parents: string[];
  createdTime?: string | null;
  modifiedTime?: string | null;
  children: FolderNode[];
  childrenLoaded: boolean;
  mayHaveChildren: boolean;
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

async function listChildFolders(
  drive: drive_v3.Drive,
  parentId: string
): Promise<FolderNode[]> {
  const children: FolderNode[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken, files(id, name, parents, createdTime, modifiedTime)',
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of response.data.files || []) {
      if (!file.id) continue;
      children.push({
        id: file.id,
        name: file.name || 'Sem nome',
        parents: file.parents || [parentId],
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        children: [],
        childrenLoaded: false,
        // assume que pode ter subpastas até carregar
        mayHaveChildren: true,
      });
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return children;
}

/**
 * GET /api/folders
 * - sem params: raiz + 1 nível (rápido no Vercel)
 * - ?parentId=ID: só filhos diretos (lazy load)
 * - ?diagnose=1: status env + token + pasta raiz
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

    let drive: drive_v3.Drive;
    try {
      drive = await getDriveClient();
    } catch (credError) {
      return res.status(500).json({
        error: `Falha ao autenticar a service account: ${toErrorMessage(credError)}`,
        env,
      });
    }

    const rootFolderId = getDriveFolderId();
    const parentId =
      typeof req.query.parentId === 'string' && req.query.parentId.trim()
        ? req.query.parentId.trim()
        : null;

    // Lazy: filhos de uma pasta específica
    if (parentId) {
      try {
        const children = await listChildFolders(drive, parentId);
        return res.json({
          parentId,
          folders: children,
          tree: children,
          total: children.length,
        });
      } catch (listError) {
        return res.status(500).json({
          error: `Drive recusou listar subpastas: ${toErrorMessage(listError)}`,
          env,
        });
      }
    }

    // Carga inicial: só raiz + filhos diretos (cabe no limite de 10s do Vercel)
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

    let children: FolderNode[];
    try {
      children = await listChildFolders(drive, rootFolderId);
    } catch (listError) {
      return res.status(500).json({
        error: `Drive recusou listar pastas (compartilhe a pasta com jarchive@…iam.gserviceaccount.com): ${toErrorMessage(listError)}`,
        env,
      });
    }

    const rootNode: FolderNode = {
      id: rootMeta.id,
      name: rootMeta.name,
      parents: rootMeta.parents,
      children,
      childrenLoaded: true,
      mayHaveChildren: children.length > 0,
    };

    res.json({
      folders: [rootNode, ...children],
      tree: [rootNode],
      total: 1 + children.length,
      rootFolderId,
    });
  } catch (error) {
    console.error('Erro ao listar pastas:', error);
    res.status(500).json({ error: toErrorMessage(error), env: getDriveEnvStatus() });
  }
}
