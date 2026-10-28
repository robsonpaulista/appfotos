/**
 * Script de ingestão manual para executar via CLI
 * Uso: node scripts/ingest.js [folderId] [enableVision]
 * 
 * Exemplos:
 *   node scripts/ingest.js                    # Sincroniza todas as fotos
 *   node scripts/ingest.js abc123             # Sincroniza pasta específica
 *   node scripts/ingest.js abc123 true        # Com Vision API
 */

import dotenv from 'dotenv';
import driveService from '../services/drive.service.js';
import visionService from '../services/vision.service.js';
import databaseService from '../services/database.service.js';

dotenv.config();

// Argumentos da linha de comando
const folderId = process.argv[2] || null;
const enableVision = process.argv[3] === 'true';

let processedCount = 0;
let errorCount = 0;
let skippedCount = 0;

async function main() {
  console.log('🚀 PhotoFinder - Ingestão de Fotos');
  console.log('=====================================');
  console.log(`📁 Pasta: ${folderId || 'Todas as fotos'}`);
  console.log(`🤖 Vision API: ${enableVision ? 'Habilitada' : 'Desabilitada'}`);
  console.log('=====================================\n');

  let pageToken = null;

  do {
    try {
      console.log('📥 Buscando fotos no Drive...');
      const { files, nextPageToken } = await driveService.listPhotos(
        folderId,
        100,
        pageToken
      );

      console.log(`✅ Encontradas ${files.length} fotos\n`);

      for (const file of files) {
        try {
          await processFile(file, enableVision);
          processedCount++;
          
          // Log a cada 10 fotos
          if (processedCount % 10 === 0) {
            console.log(`📊 Progresso: ${processedCount} processadas, ${errorCount} erros, ${skippedCount} puladas`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar ${file.name}:`, error.message);
          errorCount++;
        }
      }

      pageToken = nextPageToken;
    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      break;
    }
  } while (pageToken);

  console.log('\n=====================================');
  console.log('✨ Ingestão concluída!');
  console.log('=====================================');
  console.log(`✅ Processadas: ${processedCount}`);
  console.log(`⏭️  Puladas: ${skippedCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('=====================================\n');

  process.exit(0);
}

async function processFile(file, enableVision) {
  // Verifica se já existe no banco
  const existing = await databaseService.getPhotoByDriveId(file.id);
  
  // Se já existe e já foi analisada, pula
  if (existing && existing.joy_likelihood && !enableVision) {
    skippedCount++;
    return;
  }
  
  // Extrai metadados
  const photoData = {
    drive_id: file.id,
    name: file.name,
    mime_type: file.mimeType,
    created_at: file.createdTime,
    storage_url: file.webContentLink,
    thumbnail_url: file.thumbnailLink,
  };

  // Extrai metadados de imagem
  if (file.imageMediaMetadata) {
    const metadata = file.imageMediaMetadata;
    photoData.width = metadata.width;
    photoData.height = metadata.height;
    photoData.camera_make = metadata.cameraMake;
    photoData.camera_model = metadata.cameraModel;

    // Extrai GPS
    const gps = driveService.extractGPSData(metadata);
    if (gps) {
      photoData.gps_lat = gps.latitude;
      photoData.gps_lng = gps.longitude;
    }
  }

  // Análise com Vision API (se habilitado)
  if (enableVision && (!existing || !existing.joy_likelihood)) {
    try {
      console.log(`🤖 Analisando ${file.name}...`);
      
      // Faz streaming da imagem
      const imageStream = await driveService.streamFile(file.id);
      
      // Converte stream para buffer
      const chunks = [];
      for await (const chunk of imageStream) {
        chunks.push(chunk);
      }
      const imageBuffer = Buffer.concat(chunks);

      // Analisa com Vision API
      const analysis = await visionService.analyzeImage(imageBuffer);
      
      photoData.faces_detected = analysis.facesDetected;
      photoData.joy_likelihood = analysis.joyLikelihood;
      photoData.expression = analysis.expression;
      photoData.detection_confidence = analysis.detectionConfidence;
      
      console.log(`  ✅ ${analysis.facesDetected} rosto(s), expressão: ${analysis.expression}`);
    } catch (error) {
      console.warn(`  ⚠️  Não foi possível analisar: ${error.message}`);
    }
  }

  // Salva no banco
  await databaseService.upsertPhoto(photoData);
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Erro não tratado:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Processo interrompido pelo usuário');
  console.log(`📊 Progresso até agora: ${processedCount} processadas, ${errorCount} erros`);
  process.exit(0);
});

// Executa
main();

