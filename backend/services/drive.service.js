import { getDriveClient, getDriveFolderId } from '../config/google.config.js';
import folderService from './folder.service.js';

/**
 * Serviço para interação com Google Drive API (service account)
 */
class DriveService {
  async getDrive() {
    return getDriveClient();
  }

  /**
   * Lista arquivos de imagem na pasta configurada (e subpastas)
   */
  async listPhotoFiles(pageToken = null, pageSize = 100) {
    try {
      const drive = await this.getDrive();
      const rootFolderId = getDriveFolderId();
      const folderIds = await folderService.getAllSubfolderIds(rootFolderId);
      folderIds.push(rootFolderId);

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
      console.error('Erro ao listar arquivos:', error.message);
      throw new Error(`Falha ao listar arquivos do Drive: ${error.message}`);
    }
  }

  async getFileMetadata(fileId) {
    try {
      const drive = await this.getDrive();
      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, imageMediaMetadata, thumbnailLink',
        supportsAllDrives: true
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao obter metadados do arquivo ${fileId}:`, error.message);
      throw new Error(`Falha ao obter metadados: ${error.message}`);
    }
  }

  async streamFile(fileId, res) {
    try {
      const drive = await this.getDrive();
      const response = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
      );

      response.data
        .on('error', (err) => {
          console.error('Erro no streaming:', err);
          res.status(500).json({ error: 'Erro ao fazer streaming do arquivo' });
        })
        .pipe(res);
    } catch (error) {
      console.error(`Erro ao fazer streaming do arquivo ${fileId}:`, error.message);
      throw new Error(`Falha no streaming: ${error.message}`);
    }
  }

  async getFileContent(fileId) {
    try {
      const drive = await this.getDrive();
      const response = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Erro ao obter conteúdo do arquivo ${fileId}:`, error.message);
      throw new Error(`Falha ao obter conteúdo: ${error.message}`);
    }
  }

  async getThumbnailUrl(fileId) {
    try {
      const metadata = await this.getFileMetadata(fileId);
      return metadata.thumbnailLink || null;
    } catch (error) {
      console.error(`Erro ao obter thumbnail do arquivo ${fileId}:`, error.message);
      return null;
    }
  }

  extractImageMetadata(imageMediaMetadata) {
    if (!imageMediaMetadata) return {};

    return {
      width: imageMediaMetadata.width,
      height: imageMediaMetadata.height,
      rotation: imageMediaMetadata.rotation,
      location: imageMediaMetadata.location ? {
        latitude: imageMediaMetadata.location.latitude,
        longitude: imageMediaMetadata.location.longitude,
        altitude: imageMediaMetadata.location.altitude
      } : null,
      time: imageMediaMetadata.time,
      cameraMake: imageMediaMetadata.cameraMake,
      cameraModel: imageMediaMetadata.cameraModel,
      exposureTime: imageMediaMetadata.exposureTime,
      aperture: imageMediaMetadata.aperture,
      focalLength: imageMediaMetadata.focalLength,
      isoSpeed: imageMediaMetadata.isoSpeed
    };
  }
}

export default new DriveService();
