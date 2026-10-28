import { getDriveClient, getDriveFolderId } from '../config/google.config.js';

/**
 * Serviço para gerenciar pastas do Google Drive (service account + pasta compartilhada)
 */
class FolderService {
  async getDrive() {
    return getDriveClient();
  }

  /**
   * Lista pastas sob a pasta raiz configurada (DRIVE_FOLDER_ID)
   */
  async listFolders() {
    try {
      const drive = await this.getDrive();
      const rootFolderId = getDriveFolderId();
      const folderIds = await this.getAllSubfolderIds(rootFolderId);

      const folders = [];
      const rootInfo = await this.getFolderInfo(rootFolderId);
      folders.push(rootInfo);

      for (const id of folderIds) {
        try {
          folders.push(await this.getFolderInfo(id));
        } catch {
          // ignore pastas inacessíveis
        }
      }

      return folders;
    } catch (error) {
      console.error('Erro ao listar pastas:', error.message);
      throw new Error(`Falha ao listar pastas: ${error.message}`);
    }
  }

  buildFolderTree(folders) {
    const folderMap = new Map();
    const tree = [];

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);

      if (folder.parents && folder.parents.length > 0) {
        const parentId = folder.parents[0];
        const parent = folderMap.get(parentId);

        if (parent) {
          parent.children.push(folderNode);
        } else {
          tree.push(folderNode);
        }
      } else {
        tree.push(folderNode);
      }
    });

    return tree;
  }

  async listPhotosInFolder(folderId, pageSize = 100, pageToken = null) {
    try {
      const drive = await this.getDrive();
      const folderIds = await this.getAllSubfolderIds(folderId);
      folderIds.push(folderId);

      const folderQuery = folderIds.map(id => `'${id}' in parents`).join(' or ');
      const query = `mimeType contains 'image/' and trashed = false and (${folderQuery})`;

      const response = await drive.files.list({
        pageSize,
        pageToken: pageToken || undefined,
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, imageMediaMetadata, webContentLink, thumbnailLink, parents)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Erro ao listar fotos da pasta:', error.message);
      throw new Error(`Falha ao listar fotos: ${error.message}`);
    }
  }

  async getAllSubfolderIds(folderId) {
    try {
      const drive = await this.getDrive();
      const query = `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await drive.files.list({
        q: query,
        fields: 'files(id)',
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      const subfolders = response.data.files || [];
      let allSubfolderIds = subfolders.map(f => f.id);

      for (const subfolder of subfolders) {
        const nestedIds = await this.getAllSubfolderIds(subfolder.id);
        allSubfolderIds = allSubfolderIds.concat(nestedIds);
      }

      return allSubfolderIds;
    } catch (error) {
      console.error('Erro ao obter subpastas:', error.message);
      return [];
    }
  }

  async getFolderInfo(folderId) {
    try {
      const drive = await this.getDrive();
      const response = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, parents, createdTime, modifiedTime',
        supportsAllDrives: true
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações da pasta:', error.message);
      throw new Error(`Falha ao obter pasta: ${error.message}`);
    }
  }
}

export default new FolderService();
