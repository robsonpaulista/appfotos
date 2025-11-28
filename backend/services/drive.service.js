import { google } from 'googleapis';
import { oauth2Client } from '../config/google.config.js';
import stream from 'stream';

/**
 * Serviço para interação com Google Drive API
 */
class DriveService {
  constructor() {
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Lista arquivos de imagem do Google Drive
   * @param {string} pageToken - Token para paginação
   * @param {number} pageSize - Quantidade de itens por página
   * @returns {Promise<Object>} Lista de arquivos e próximo pageToken
   */
  async listPhotoFiles(pageToken = null, pageSize = 100) {
    try {
      const query = "mimeType contains 'image/' and trashed = false";
      
      const response = await this.drive.files.list({
        pageSize,
        pageToken,
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, imageMediaMetadata, webContentLink, thumbnailLink)',
        orderBy: 'createdTime desc'
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

  /**
   * Obtém metadados de um arquivo específico
   * @param {string} fileId - ID do arquivo no Drive
   * @returns {Promise<Object>} Metadados do arquivo
   */
  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, imageMediaMetadata, thumbnailLink'
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao obter metadados do arquivo ${fileId}:`, error.message);
      throw new Error(`Falha ao obter metadados: ${error.message}`);
    }
  }

  /**
   * Faz streaming de um arquivo do Drive
   * @param {string} fileId - ID do arquivo
   * @param {Object} res - Response object do Express
   */
  async streamFile(fileId, res) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
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

  /**
   * Obtém conteúdo de um arquivo como buffer
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Buffer>} Conteúdo do arquivo
   */
  async getFileContent(fileId) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Erro ao obter conteúdo do arquivo ${fileId}:`, error.message);
      throw new Error(`Falha ao obter conteúdo: ${error.message}`);
    }
  }

  /**
   * Obtém thumbnail de uma imagem
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<string>} URL do thumbnail
   */
  async getThumbnailUrl(fileId) {
    try {
      const metadata = await this.getFileMetadata(fileId);
      return metadata.thumbnailLink || null;
    } catch (error) {
      console.error(`Erro ao obter thumbnail do arquivo ${fileId}:`, error.message);
      return null;
    }
  }

  /**
   * Extrai metadados de imagem (GPS, dimensões, etc)
   * @param {Object} imageMediaMetadata - Metadados da imagem do Drive
   * @returns {Object} Metadados processados
   */
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
