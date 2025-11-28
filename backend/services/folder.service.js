import { google } from 'googleapis';
import { oauth2Client } from '../config/google.config.js';

/**
 * Serviço para gerenciar pastas do Google Drive
 */
class FolderService {
  constructor() {
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Lista todas as pastas do Google Drive
   * @returns {Promise<Array>} Lista de pastas
   */
  async listFolders() {
    try {
      const query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, parents, createdTime, modifiedTime)',
        orderBy: 'name',
        pageSize: 100
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Erro ao listar pastas:', error.message);
      throw new Error(`Falha ao listar pastas: ${error.message}`);
    }
  }

  /**
   * Constrói árvore de pastas
   * @param {Array} folders - Lista plana de pastas
   * @returns {Array} Árvore de pastas
   */
  buildFolderTree(folders) {
    const folderMap = new Map();
    const tree = [];

    // Mapear todas as pastas
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Construir hierarquia
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);
      
      if (folder.parents && folder.parents.length > 0) {
        const parentId = folder.parents[0];
        const parent = folderMap.get(parentId);
        
        if (parent) {
          parent.children.push(folderNode);
        } else {
          // Se não encontrar pai, adiciona na raiz
          tree.push(folderNode);
        }
      } else {
        // Pasta raiz
        tree.push(folderNode);
      }
    });

    return tree;
  }

  /**
   * Lista fotos de uma pasta específica (incluindo subpastas)
   * @param {string} folderId - ID da pasta
   * @param {number} pageSize - Quantidade de itens
   * @param {string} pageToken - Token de paginação
   * @returns {Promise<Object>} Lista de arquivos e próximo token
   */
  async listPhotosInFolder(folderId, pageSize = 100, pageToken = null) {
    try {
      // Buscar todas as subpastas recursivamente
      const folderIds = await this.getAllSubfolderIds(folderId);
      folderIds.push(folderId); // Incluir a pasta principal

      // Construir query para buscar fotos em todas as pastas
      const folderQuery = folderIds.map(id => `'${id}' in parents`).join(' or ');
      const query = `mimeType contains 'image/' and trashed = false and (${folderQuery})`;
      
      const response = await this.drive.files.list({
        pageSize,
        pageToken,
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, imageMediaMetadata, webContentLink, thumbnailLink, parents)',
        orderBy: 'createdTime desc'
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

  /**
   * Obtém todos os IDs de subpastas recursivamente
   * @param {string} folderId - ID da pasta pai
   * @returns {Promise<Array>} Lista de IDs de subpastas
   */
  async getAllSubfolderIds(folderId) {
    try {
      const query = `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id)',
        pageSize: 100
      });

      const subfolders = response.data.files || [];
      let allSubfolderIds = subfolders.map(f => f.id);

      // Recursivamente buscar subpastas das subpastas
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

  /**
   * Obtém informações de uma pasta específica
   * @param {string} folderId - ID da pasta
   * @returns {Promise<Object>} Informações da pasta
   */
  async getFolderInfo(folderId) {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, parents, createdTime, modifiedTime'
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações da pasta:', error.message);
      throw new Error(`Falha ao obter pasta: ${error.message}`);
    }
  }
}

export default new FolderService();

