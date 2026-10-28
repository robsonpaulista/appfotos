import heicConvert from 'heic-convert';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Serviço para conversão de imagens HEIC/HEIF para JPEG
 */
class ImageConversionService {
  constructor() {
    // Cache em disco para imagens convertidas
    this.cacheDir = path.join(__dirname, '../../.cache/converted-images');
    this.ensureCacheDir();
  }

  /**
   * Garante que o diretório de cache existe
   */
  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de cache:', error);
    }
  }

  /**
   * Gera hash para nome de arquivo em cache
   * @param {string} driveId - ID do arquivo no Drive
   * @returns {string} Nome do arquivo em cache
   */
  getCacheFileName(driveId) {
    const hash = crypto.createHash('md5').update(driveId).digest('hex');
    return `${hash}.jpg`;
  }

  /**
   * Verifica se arquivo está em cache
   * @param {string} driveId - ID do arquivo no Drive
   * @returns {Promise<string|null>} Caminho do arquivo em cache ou null
   */
  async getCachedFile(driveId) {
    try {
      const cacheFile = path.join(this.cacheDir, this.getCacheFileName(driveId));
      await fs.access(cacheFile);
      return cacheFile;
    } catch {
      return null;
    }
  }

  /**
   * Converte HEIC para JPEG e salva em cache
   * @param {Buffer} heicBuffer - Buffer da imagem HEIC
   * @param {string} driveId - ID do arquivo no Drive
   * @returns {Promise<Buffer>} Buffer da imagem convertida
   */
  async convertHEICtoJPEG(heicBuffer, driveId) {
    try {
      console.log(`  🔄 Convertendo HEIC para JPEG...`);
      const startTime = Date.now();

      // Converter HEIC para JPEG usando heic-convert
      const jpegBuffer = await heicConvert({
        buffer: heicBuffer,
        format: 'JPEG',
        quality: 0.95 // Alta qualidade (95%)
      });

      // Otimizar com Sharp (sem redimensionar, só otimizar)
      const optimizedBuffer = await sharp(jpegBuffer)
        .jpeg({ 
          quality: 95, 
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer();

      const elapsedTime = Date.now() - startTime;
      const sizeInMB = optimizedBuffer.length / 1024 / 1024;
      console.log(`  ✅ Convertido em ${elapsedTime}ms (${sizeInMB.toFixed(2)}MB)`);

      // Salvar em cache
      try {
        const cacheFile = path.join(this.cacheDir, this.getCacheFileName(driveId));
        await fs.writeFile(cacheFile, optimizedBuffer);
        console.log(`  💾 Salvo em cache`);
      } catch (cacheError) {
        console.error('  ⚠️  Erro ao salvar em cache:', cacheError.message);
      }

      return optimizedBuffer;
    } catch (error) {
      console.error('  ❌ Erro na conversão HEIC:', error.message);
      throw new Error('Falha ao converter imagem HEIC');
    }
  }

  /**
   * Processa imagem (converte HEIC se necessário)
   * @param {Buffer} imageBuffer - Buffer da imagem
   * @param {string} mimeType - Tipo MIME da imagem
   * @param {string} driveId - ID do arquivo no Drive
   * @returns {Promise<Object>} { buffer: Buffer, mimeType: string }
   */
  async processImage(imageBuffer, mimeType, driveId) {
    // Verificar se é HEIC/HEIF
    const isHEIC = mimeType?.toLowerCase().includes('heif') || 
                   mimeType?.toLowerCase().includes('heic');

    if (!isHEIC) {
      // Não é HEIC, retornar original
      return {
        buffer: imageBuffer,
        mimeType: mimeType || 'image/jpeg'
      };
    }

    // Verificar cache primeiro
    const cachedFile = await this.getCachedFile(driveId);
    if (cachedFile) {
      console.log(`  📦 Usando versão em cache`);
      const buffer = await fs.readFile(cachedFile);
      return {
        buffer,
        mimeType: 'image/jpeg'
      };
    }

    // Converter HEIC para JPEG
    const convertedBuffer = await this.convertHEICtoJPEG(imageBuffer, driveId);
    return {
      buffer: convertedBuffer,
      mimeType: 'image/jpeg'
    };
  }

  /**
   * Limpa cache de conversões antigas (mais de 7 dias)
   */
  async cleanOldCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️  Cache antigo removido: ${file}`);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}

export default new ImageConversionService();

