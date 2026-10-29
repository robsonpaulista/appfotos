import driveService from './drive.service.js';
import visionService from './vision.service.js';
import folderService from './folder.service.js';
import geocodingService from './geocoding.service.js';
import { supabase } from '../config/supabase.config.js';
import { getLibrarySourceId, getDriveFolderId } from '../config/google.config.js';
import {
  extractTagsFromFolderName,
  isStructuralFolderName,
  resolvePhotoLocation,
} from '../utils/folderParser.js';

/**
 * Serviço para ingestão e sincronização de fotos do Google Drive
 */
class IngestService {
  constructor() {
    this.batchSize = 50; // Processar 50 fotos por vez
  }

  /**
   * Sincroniza fotos do Google Drive com o banco de dados
   * @param {string} adminUserId - ID do admin que iniciou a sync (sync_events)
   * @param {boolean} analyzeWithVision - Se deve usar Vision API
   * @param {string} folderId - ID da pasta específica (opcional; default = DRIVE_FOLDER_ID)
   * @param {Object} manualTags - Tags manuais para aplicar (opcional)
   * @returns {Promise<Object>} Estatísticas da sincronização
   */
  async syncPhotos(adminUserId, analyzeWithVision = false, folderId = null, manualTags = null) {
    const libraryId = getLibrarySourceId();
    const effectiveFolderId = folderId || getDriveFolderId();
    const syncEvent = await this.createSyncEvent(adminUserId);
    
    try {
      let stats = {
        processed: 0,
        added: 0,
        updated: 0,
        errors: 0
      };

      let pageToken = null;
      let hasMore = true;

      // Obter nome da pasta + mapa id→nome (para local = pasta da cidade)
      let folderName = null;
      let folderMap = new Map();
      try {
        const folderInfo = await folderService.getFolderInfo(effectiveFolderId);
        folderName = folderInfo.name;
        folderMap.set(effectiveFolderId, folderName);
        const subIds = await folderService.getAllSubfolderIds(effectiveFolderId);
        for (const id of subIds) {
          try {
            const info = await folderService.getFolderInfo(id);
            folderMap.set(id, info.name);
          } catch {
            // ignore
          }
        }
        console.log(`📁 Sincronizando pasta: ${folderName} (${folderMap.size} pastas no mapa)`);

        if (manualTags) {
          console.log(`🏷️  Tags manuais que serão aplicadas:`);
          if (manualTags.person) console.log(`   👤 Pessoa: ${manualTags.person}`);
          if (manualTags.location) console.log(`   📍 Local: ${manualTags.location}`);
          if (manualTags.event) console.log(`   📅 Evento: ${manualTags.event}`);
        }
      } catch (error) {
        console.error('Erro ao obter nome da pasta:', error.message);
      }

      while (hasMore) {
        try {
          const { files, nextPageToken } = await folderService.listPhotosInFolder(
            effectiveFolderId,
            this.batchSize,
            pageToken
          );
          
          if (!files || files.length === 0) {
            hasMore = false;
            break;
          }

          // Fotos ficam sob libraryId (DRIVE_FOLDER_ID), não sob o admin
          const batchStats = await this.processBatch(
            files,
            libraryId,
            analyzeWithVision,
            folderName,
            manualTags,
            effectiveFolderId,
            folderMap
          );
          stats.processed += batchStats.processed;
          stats.added += batchStats.added;
          stats.updated += batchStats.updated;
          stats.errors += batchStats.errors;

          // Atualizar evento de sincronização
          await this.updateSyncEvent(syncEvent.id, {
            status: 'in_progress',
            photos_processed: stats.processed,
            photos_added: stats.added,
            photos_updated: stats.updated
          });

          pageToken = nextPageToken;
          hasMore = !!nextPageToken;

          console.log(`📊 Progresso: ${stats.processed} fotos processadas`);
        } catch (error) {
          console.error('Erro ao processar batch:', error);
          stats.errors++;
        }
      }

      // Finalizar sincronização
      await this.completeSyncEvent(syncEvent.id, stats);
      
      return stats;
    } catch (error) {
      await this.failSyncEvent(syncEvent.id, error.message);
      throw error;
    }
  }

  /**
   * Processa um batch de fotos
   * @param {Array} files - Array de arquivos do Drive
   * @param {string} userId - ID do usuário
   * @param {boolean} analyzeWithVision - Se deve usar Vision API
   * @param {string} folderName - Nome da pasta para extrair tags
   * @param {Object} manualTags - Tags manuais para aplicar
   * @returns {Promise<Object>} Estatísticas do batch
   */
  async processBatch(
    files,
    userId,
    analyzeWithVision,
    folderName = null,
    manualTags = null,
    syncFolderId = null,
    folderMap = null
  ) {
    const stats = { processed: 0, added: 0, updated: 0, errors: 0 };

    for (const file of files) {
      try {
        const parentId = file.parents?.[0] || null;
        const parentName = parentId && folderMap ? folderMap.get(parentId) : null;
        const locationFolderName =
          resolvePhotoLocation({
            manualLocation: manualTags?.location,
            syncFolderId: syncFolderId || '',
            syncFolderName: folderName,
            parentFolderId: parentId,
            parentFolderName: parentName,
          }) || folderName;

        const photoData = await this.preparePhotoData(
          file,
          userId,
          analyzeWithVision,
          locationFolderName
        );

        // Local explícito pela pasta-cidade (ou tag manual)
        const location = resolvePhotoLocation({
          manualLocation: manualTags?.location,
          syncFolderId: syncFolderId || '',
          syncFolderName: folderName,
          parentFolderId: parentId,
          parentFolderName: parentName,
        });
        if (location) {
          photoData.location_name = location;
          if (!isStructuralFolderName(location)) {
            photoData.event_city = location;
          }
        }

        if (manualTags) {
          if (manualTags.person) photoData.person_tag = manualTags.person;
          if (manualTags.event) photoData.event_type = manualTags.event;
        }

        if (parentId) {
          photoData.drive_folder_id = parentId;
        }
        
        const result = await this.upsertPhoto(photoData);
        
        if (result.isNew) {
          stats.added++;
        } else {
          stats.updated++;
        }
        
        stats.processed++;
      } catch (error) {
        console.error(`Erro ao processar foto ${file.id}:`, error.message);
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Prepara dados da foto para inserção no banco
   * @param {Object} file - Arquivo do Drive
   * @param {string} userId - ID do usuário
   * @param {boolean} analyzeWithVision - Se deve usar Vision API
   * @param {string} folderName - Nome da pasta (para extrair tags)
   * @returns {Promise<Object>} Dados preparados
   */
  async preparePhotoData(file, userId, analyzeWithVision, folderName = null) {
    const metadata = driveService.extractImageMetadata(file.imageMediaMetadata);
    
    let visionAnalysis = null;
    if (analyzeWithVision) {
      try {
        const fileContent = await driveService.getFileContent(file.id);
        visionAnalysis = await visionService.analyzeImage(fileContent);
      } catch (error) {
        console.error(`Erro na análise Vision para ${file.id}:`, error.message);
      }
    }

    // Extrair tags automáticas do nome da pasta
    const autoTags = folderName ? extractTagsFromFolderName(folderName) : {};

    // Geocoding automático se tiver GPS (usando cache para ser rápido)
    let locationData = {};
    if (metadata.location?.latitude && metadata.location?.longitude) {
      try {
        // Geocoding com cache - rápido se já foi processado antes
        const location = await geocodingService.reverseGeocode(
          metadata.location.latitude,
          metadata.location.longitude
        );
        
        if (location) {
          locationData = {
            location_name: location.fullAddress,
            // Só preenche event_city se não veio da pasta
            ...(!autoTags.event_city && { event_city: location.city })
          };
        }
      } catch (error) {
        // Se der erro, continua sem geocoding (não trava a sincronização)
        console.log(`⏭️  Geocoding pulado para ${file.id}`);
      }
    }

    return {
      drive_id: file.id,
      name: file.name,
      mime_type: file.mimeType,
      width: metadata.width,
      height: metadata.height,
      size_bytes: parseInt(file.size) || 0,
      created_at: file.createdTime,
      modified_at: file.modifiedTime,
      gps_lat: metadata.location?.latitude || null,
      gps_lng: metadata.location?.longitude || null,
      thumbnail_url: file.thumbnailLink,
      user_id: userId,
      drive_folder_id: getDriveFolderId(),
      analyzed: !!visionAnalysis,
      // Auto-tags extraídas do nome da pasta
      ...autoTags,
      // Localização do GPS
      ...locationData,
      ...(visionAnalysis && {
        faces_detected: visionAnalysis.facesDetected,
        joy_likelihood: visionAnalysis.emotions?.joyLikelihood,
        sorrow_likelihood: visionAnalysis.emotions?.sorrowLikelihood,
        anger_likelihood: visionAnalysis.emotions?.angerLikelihood,
        surprise_likelihood: visionAnalysis.emotions?.surpriseLikelihood
      })
    };
  }

  /**
   * Insere ou atualiza foto no banco de dados
   * @param {Object} photoData - Dados da foto
   * @returns {Promise<Object>} Resultado da operação
   */
  async upsertPhoto(photoData) {
    // Verificar se foto já existe
    const { data: existing } = await supabase
      .from('photos')
      .select('id')
      .eq('drive_id', photoData.drive_id)
      .single();

    if (existing) {
      // Atualizar foto existente
      const { error } = await supabase
        .from('photos')
        .update(photoData)
        .eq('id', existing.id);

      if (error) throw error;
      return { isNew: false, id: existing.id };
    } else {
      // Inserir nova foto
      const { data, error } = await supabase
        .from('photos')
        .insert(photoData)
        .select('id')
        .single();

      if (error) throw error;
      return { isNew: true, id: data.id };
    }
  }

  /**
   * Cria evento de sincronização
   */
  async createSyncEvent(userId) {
    const { data, error } = await supabase
      .from('sync_events')
      .insert({
        user_id: userId,
        status: 'started'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza evento de sincronização
   */
  async updateSyncEvent(eventId, updates) {
    const { error } = await supabase
      .from('sync_events')
      .update(updates)
      .eq('id', eventId);

    if (error) throw error;
  }

  /**
   * Completa evento de sincronização
   */
  async completeSyncEvent(eventId, stats) {
    await this.updateSyncEvent(eventId, {
      status: 'completed',
      photos_processed: stats.processed,
      photos_added: stats.added,
      photos_updated: stats.updated,
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Marca evento de sincronização como falho
   */
  async failSyncEvent(eventId, errorMessage) {
    await this.updateSyncEvent(eventId, {
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Analisa fotos existentes que ainda não foram analisadas
   * @param {string} userId - ID do usuário
   * @param {number} limit - Limite de fotos a processar
   * @returns {Promise<Object>} Estatísticas da análise
   */
  async analyzeUnprocessedPhotos(_userId, limit = 100) {
    const libraryId = getLibrarySourceId();
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, drive_id')
      .eq('user_id', libraryId)
      .eq('analyzed', false)
      .limit(limit);

    if (error) throw error;

    let analyzed = 0;
    let errors = 0;

    for (const photo of photos) {
      try {
        const fileContent = await driveService.getFileContent(photo.drive_id);
        const analysis = await visionService.analyzeImage(fileContent);

        await supabase
          .from('photos')
          .update({
            faces_detected: analysis.facesDetected,
            joy_likelihood: analysis.emotions?.joyLikelihood,
            sorrow_likelihood: analysis.emotions?.sorrowLikelihood,
            anger_likelihood: analysis.emotions?.angerLikelihood,
            surprise_likelihood: analysis.emotions?.surpriseLikelihood,
            analyzed: true
          })
          .eq('id', photo.id);

        analyzed++;
        console.log(`✅ Foto ${photo.id} analisada`);
      } catch (error) {
        console.error(`❌ Erro ao analisar foto ${photo.id}:`, error.message);
        errors++;
      }
    }

    return { analyzed, errors, total: photos.length };
  }
}

export default new IngestService();

