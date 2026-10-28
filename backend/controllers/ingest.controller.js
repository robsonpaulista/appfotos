import driveService from '../services/drive.service.js';
import visionService from '../services/vision.service.js';
import databaseService from '../services/database.service.js';

/**
 * Controller para ingestão de fotos do Google Drive
 * Sincroniza metadados e analisa imagens com IA
 */

/**
 * Inicia o processo de ingestão de fotos
 */
export async function startIngest(req, res) {
  try {
    const { folderId, enableVision = false } = req.body;

    res.json({
      message: 'Ingestão iniciada em background',
      status: 'processing'
    });

    // Processa em background para não bloquear a resposta
    processIngest(folderId, enableVision).catch(error => {
      console.error('Erro durante ingestão:', error);
    });
  } catch (error) {
    console.error('Erro ao iniciar ingestão:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Processa a ingestão de fotos
 */
async function processIngest(folderId, enableVision) {
  console.log('🚀 Iniciando ingestão de fotos...');
  let processedCount = 0;
  let errorCount = 0;
  let pageToken = null;

  do {
    try {
      // Lista fotos do Drive
      const { files, nextPageToken } = await driveService.listPhotos(
        folderId,
        100,
        pageToken
      );

      console.log(`📥 Processando ${files.length} arquivos...`);

      // Processa cada arquivo
      for (const file of files) {
        try {
          await processFile(file, enableVision);
          processedCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`✅ Processados: ${processedCount} arquivos`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar ${file.name}:`, error.message);
          errorCount++;
        }
      }

      pageToken = nextPageToken;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      break;
    }
  } while (pageToken);

  console.log(`✨ Ingestão concluída!`);
  console.log(`  ✅ Processados: ${processedCount}`);
  console.log(`  ❌ Erros: ${errorCount}`);
}

/**
 * Processa um arquivo individual
 */
async function processFile(file, enableVision) {
  // Verifica se já existe no banco
  const existing = await databaseService.getPhotoByDriveId(file.id);
  
  // Extrai metadados
  const photoData = {
    drive_id: file.id,
    name: file.name,
    mime_type: file.mimeType,
    created_at: file.createdTime,
    storage_url: file.webContentLink,
    thumbnail_url: file.thumbnailLink
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

  // Análise com Vision API (se habilitado e não processado ainda)
  if (enableVision && (!existing || !existing.joy_likelihood)) {
    try {
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
    } catch (error) {
      console.warn(`⚠️  Não foi possível analisar ${file.name}:`, error.message);
    }
  }

  // Salva no banco
  await databaseService.upsertPhoto(photoData);
}

/**
 * Obtém o status da ingestão
 */
export async function getIngestStatus(req, res) {
  try {
    const stats = await databaseService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reprocessa uma foto específica com Vision API
 */
export async function reprocessPhoto(req, res) {
  try {
    const { id } = req.params;
    
    // Busca a foto no banco
    const photo = await databaseService.getPhotoById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Faz streaming da imagem
    const imageStream = await driveService.streamFile(photo.drive_id);
    
    // Converte stream para buffer
    const chunks = [];
    for await (const chunk of imageStream) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    // Analisa com Vision API
    const analysis = await visionService.analyzeImage(imageBuffer);
    
    // Atualiza no banco
    const updatedPhoto = await databaseService.upsertPhoto({
      id: photo.id,
      drive_id: photo.drive_id,
      faces_detected: analysis.facesDetected,
      joy_likelihood: analysis.joyLikelihood,
      expression: analysis.expression,
      detection_confidence: analysis.detectionConfidence
    });

    res.json(updatedPhoto);
  } catch (error) {
    console.error('Erro ao reprocessar foto:', error);
    res.status(500).json({ error: error.message });
  }
}

