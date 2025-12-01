import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { getOAuth2Client } from '../../../lib/api-server/google.config';
import { google } from 'googleapis';

/**
 * GET /api/folders
 * Lista todas as pastas do Google Drive
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Configurar Google Drive
    const oauth2Client = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Buscar pastas do Google Drive
    const query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, parents, createdTime, modifiedTime)',
      orderBy: 'name',
      pageSize: 100
    });

    const folders = response.data.files || [];

    // Construir árvore de pastas
    const folderMap = new Map<string, any>();
    const rootFolders: any[] = [];

    // Primeiro, criar mapa de todas as pastas
    folders.forEach(folder => {
      folderMap.set(folder.id!, {
        id: folder.id,
        name: folder.name,
        parents: folder.parents || [],
        children: []
      });
    });

    // Depois, construir árvore
    folders.forEach(folder => {
      const folderData = folderMap.get(folder.id!);
      if (folderData) {
        if (folderData.parents.length === 0) {
          // Pasta raiz
          rootFolders.push(folderData);
        } else {
          // Adicionar como filho do pai
          const parentId = folderData.parents[0];
          const parent = folderMap.get(parentId);
          if (parent) {
            parent.children.push(folderData);
          } else {
            // Se o pai não está na lista, adicionar como raiz
            rootFolders.push(folderData);
          }
        }
      }
    });

    res.json({
      folders: folders,
      tree: rootFolders,
      total: folders.length
    });
  } catch (error: any) {
    console.error('Erro ao listar pastas:', error);
    res.status(500).json({ error: 'Falha ao listar pastas' });
  }
}

