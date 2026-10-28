import express from 'express';
import multer from 'multer';
import faceRecognitionService from '../services/faceRecognition.service.js';
import driveService from '../services/drive.service.js';
import { supabase } from '../config/supabase.config.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getLibrarySourceId } from '../config/google.config.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * POST /api/faces/search-by-image
 * Upload/selfie → detecta rosto → busca no acervo
 */
router.post('/search-by-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem no campo image' });
    }

    // Distância euclidiana Face-API: quanto menor, mais parecido.
    // 0.5 ≈ bom equilíbrio (0.7 mistura pessoas; 0.4 é bem restrito).
    const threshold = req.body?.threshold
      ? parseFloat(req.body.threshold)
      : 0.5;

    const result = await faceRecognitionService.searchByImageBuffer(
      req.file.buffer,
      req.file.mimetype,
      Number.isFinite(threshold) ? threshold : 0.5,
      getLibrarySourceId()
    );

    if (result.error === 'no_face') {
      return res.status(400).json(result);
    }

    if (result.indexedFaces === 0) {
      return res.json({
        ...result,
        message: 'Nenhum rosto indexado no acervo ainda. Peça a um admin para indexar as fotos.'
      });
    }

    if (result.matches.length === 0) {
      return res.json({
        ...result,
        message: 'Nenhuma foto correspondente encontrada no acervo.'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Erro em search-by-image:', error);
    res.status(500).json({ error: 'Falha na busca por imagem' });
  }
});

/**
 * POST /api/faces/search-by-leader
 * Usa vetor facial da liderança cadastrada
 */
router.post('/search-by-leader', requireAuth, async (req, res) => {
  try {
    const { leaderId, threshold = 0.5 } = req.body || {};
    if (!leaderId) {
      return res.status(400).json({ error: 'leaderId é obrigatório' });
    }

    const { data: leader, error } = await supabase
      .from('leaders')
      .select('id, name, city, role_title, face_vector, photo_data')
      .eq('id', leaderId)
      .single();

    if (error || !leader) {
      return res.status(404).json({ error: 'Liderança não encontrada' });
    }

    if (!leader.face_vector || leader.face_vector.length === 0) {
      return res.status(400).json({ error: 'Liderança sem vetor facial. Recadastre com outra foto.' });
    }

    const result = await faceRecognitionService.searchArchiveByDescriptor(
      leader.face_vector,
      threshold,
      getLibrarySourceId()
    );

    res.json({
      leader: {
        id: leader.id,
        name: leader.name,
        city: leader.city,
        role_title: leader.role_title,
        photo_data: leader.photo_data
      },
      facesDetected: 1,
      matches: result.matches,
      indexedFaces: result.indexedFaces,
      message: result.matches.length === 0
        ? (result.indexedFaces === 0
          ? 'Nenhum rosto indexado no acervo ainda.'
          : 'Nenhuma foto correspondente encontrada no acervo.')
        : undefined
    });
  } catch (error) {
    console.error('Erro em search-by-leader:', error);
    res.status(500).json({ error: 'Falha na busca por liderança' });
  }
});

/**
 * POST /api/faces/index-library
 * Admin: indexa rostos de fotos ainda sem descritores (lote)
 */
router.post('/index-library', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.body?.limit || '30', 10), 100);
    const libraryId = getLibrarySourceId();

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, drive_id, mime_type')
      .eq('user_id', libraryId)
      .limit(limit * 3);

    if (error) throw error;

    const results = [];
    let processed = 0;
    let facesTotal = 0;

    for (const photo of photos || []) {
      if (processed >= limit) break;

      const { count } = await supabase
        .from('face_descriptors')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', photo.id);

      if ((count || 0) > 0) continue;

      try {
        const imageBuffer = await driveService.getFileContent(photo.drive_id);
        const detections = await faceRecognitionService.detectFaces(imageBuffer, photo.mime_type);
        if (detections.length > 0) {
          await faceRecognitionService.saveFaceDescriptors(photo.id, detections);
          facesTotal += detections.length;
        }
        results.push({ photoId: photo.id, facesDetected: detections.length });
        processed++;
      } catch (err) {
        console.error(`Erro ao indexar ${photo.id}:`, err.message);
      }
    }

    res.json({
      processed,
      facesTotal,
      results,
      message: processed === 0
        ? 'Nenhuma foto pendente de indexação neste lote.'
        : `${processed} foto(s) indexada(s), ${facesTotal} rosto(s).`
    });
  } catch (error) {
    console.error('Erro ao indexar biblioteca:', error);
    res.status(500).json({ error: 'Falha ao indexar rostos do acervo' });
  }
});


/**
 * POST /api/faces/analyze/:photoId
 * Analisa uma foto e extrai descritores faciais
 */
router.post('/analyze/:photoId', requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;

    // Buscar foto
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, drive_id, user_id, mime_type')
      .eq('id', photoId)
      .eq('user_id', getLibrarySourceId())
      .single();

    if (photoError || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Baixar imagem do Drive
    const imageBuffer = await driveService.getFileContent(photo.drive_id);

    // Detectar rostos (passando mime_type para conversão HEIC se necessário)
    const detections = await faceRecognitionService.detectFaces(imageBuffer, photo.mime_type);

    if (detections.length === 0) {
      return res.json({ faces: [], message: 'Nenhum rosto detectado' });
    }

    // Salvar descritores no banco
    const savedDescriptors = await faceRecognitionService.saveFaceDescriptors(photoId, detections);

    res.json({
      faces: savedDescriptors,
      count: savedDescriptors.length,
      message: `${savedDescriptors.length} rosto(s) detectado(s)`
    });
  } catch (error) {
    console.error('Erro ao analisar foto:', error);
    res.status(500).json({ error: 'Falha ao analisar foto' });
  }
});

/**
 * POST /api/faces/analyze-batch
 * Analisa múltiplas fotos em lote
 */
router.post('/analyze-batch', requireAuth, async (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'photoIds deve ser um array não vazio' });
    }

    const results = [];
    let processed = 0;
    let errors = 0;

    for (const photoId of photoIds) {
      try {
        // Buscar foto
        const { data: photo } = await supabase
          .from('photos')
          .select('id, drive_id, mime_type')
          .eq('id', photoId)
          .eq('user_id', getLibrarySourceId())
          .single();

        if (!photo) continue;

        // Baixar e analisar
        const imageBuffer = await driveService.getFileContent(photo.drive_id);
        const detections = await faceRecognitionService.detectFaces(imageBuffer, photo.mime_type);
        
        if (detections.length > 0) {
          await faceRecognitionService.saveFaceDescriptors(photoId, detections);
        }

        results.push({
          photoId,
          facesDetected: detections.length
        });

        processed++;
      } catch (error) {
        console.error(`Erro ao processar foto ${photoId}:`, error);
        errors++;
      }
    }

    res.json({
      processed,
      errors,
      results
    });
  } catch (error) {
    console.error('Erro no processamento em lote:', error);
    res.status(500).json({ error: 'Falha no processamento em lote' });
  }
});

/**
 * GET /api/faces/photo/:photoId
 * Lista rostos detectados em uma foto
 */
router.get('/photo/:photoId', requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;

    const { data: faces, error } = await supabase
      .from('face_descriptors')
      .select(`
        id,
        bounding_box,
        confidence,
        person_id,
        persons (
          id,
          name
        )
      `)
      .eq('photo_id', photoId);

    if (error) throw error;

    res.json(faces || []);
  } catch (error) {
    console.error('Erro ao buscar rostos:', error);
    res.status(500).json({ error: 'Falha ao buscar rostos' });
  }
});

/**
 * POST /api/faces/find-similar
 * Busca fotos com rostos similares
 */
router.post('/find-similar', requireAuth, async (req, res) => {
  try {
    const { descriptorId, threshold = 0.6 } = req.body;

    // Buscar descritor de referência
    const { data: descriptor, error } = await supabase
      .from('face_descriptors')
      .select('face_vector')
      .eq('id', descriptorId)
      .single();

    if (error || !descriptor) {
      return res.status(404).json({ error: 'Descritor não encontrado' });
    }

    // Buscar rostos similares
    const matches = await faceRecognitionService.findSimilarFaces(
      descriptor.face_vector,
      threshold
    );

    // Buscar informações das fotos
    const photoIds = [...new Set(matches.map(m => m.photo_id))];
    
    const { data: photos } = await supabase
      .from('photos')
      .select('id, name, thumbnail_url, created_at')
      .in('id', photoIds)
      .eq('user_id', getLibrarySourceId());

    const enrichedMatches = matches.map(match => ({
      ...match,
      photo: photos?.find(p => p.id === match.photo_id)
    }));

    res.json(enrichedMatches);
  } catch (error) {
    console.error('Erro ao buscar rostos similares:', error);
    res.status(500).json({ error: 'Falha ao buscar rostos similares' });
  }
});

/**
 * POST /api/faces/cluster
 * Agrupa rostos similares automaticamente
 */
router.post('/cluster', requireAuth, async (req, res) => {
  try {
    const { threshold = 0.6 } = req.body;

    const clusters = await faceRecognitionService.clusterFaces(threshold);

    // Enriquecer com informações das fotos
    const enrichedClusters = await Promise.all(
      clusters.map(async (cluster, index) => {
        const photoIds = [...new Set(cluster.map(f => f.photo_id))];
        
        const { data: photos } = await supabase
          .from('photos')
          .select('id, name, thumbnail_url')
          .in('id', photoIds)
          .eq('user_id', getLibrarySourceId());

        return {
          id: `cluster-${index}`,
          count: cluster.length,
          faces: cluster.map(face => ({
            ...face,
            photo: photos?.find(p => p.id === face.photo_id)
          }))
        };
      })
    );

    res.json({
      clusters: enrichedClusters.length,
      groups: enrichedClusters
    });
  } catch (error) {
    console.error('Erro ao agrupar rostos:', error);
    res.status(500).json({ error: 'Falha ao agrupar rostos' });
  }
});

/**
 * POST /api/faces/assign-person
 * Atribui uma pessoa a um ou mais rostos
 */
router.post('/assign-person', requireAuth, async (req, res) => {
  try {
    const { descriptorIds, personName, autoAssign = true, threshold } = req.body;

    if (!Array.isArray(descriptorIds) || !personName) {
      return res.status(400).json({ error: 'descriptorIds e personName são obrigatórios' });
    }

    const cleanedName = personName.trim();

    if (cleanedName.length === 0) {
      return res.status(400).json({ error: 'personName não pode ser vazio' });
    }

    // Criar ou buscar pessoa
    const person = await faceRecognitionService.getOrCreatePerson(cleanedName);

    const uniqueDescriptorIds = [...new Set(descriptorIds)];

    // Atribuir pessoa aos descritores selecionados
    const updates = await Promise.all(
      uniqueDescriptorIds.map(id => faceRecognitionService.assignPerson(id, person.id))
    );

    // Atualizar tag principal das fotos selecionadas
    const basePhotoUpdates = await Promise.all(
      uniqueDescriptorIds.map(async (descriptorId) => {
        const descriptor = await faceRecognitionService.getDescriptorById(descriptorId, req.session.userId);
        if (!descriptor) return 0;
        return faceRecognitionService.updatePhotoPrimaryPerson(
          [descriptor.photo_id],
          person.name,
          req.session.userId
        );
      })
    );

    const summaryAccumulator = {
      processed: 0,
      totalMatches: 0,
      newlyAssigned: 0,
      photoTagsUpdated: basePhotoUpdates.reduce((sum, value) => sum + (value || 0), 0),
      assignedDescriptorIds: [],
      assignedPhotos: [],
    };

    if (autoAssign) {
      const autoResults = await Promise.all(
        uniqueDescriptorIds.map(descriptorId =>
          faceRecognitionService.autoAssignSimilarFaces({
            descriptorId,
            personId: person.id,
            personName: person.name,
            userId: req.session.userId,
            threshold,
          })
        )
      );

      autoResults.forEach(result => {
        summaryAccumulator.processed += result.processed || 0;
        summaryAccumulator.totalMatches += result.totalMatches || 0;
        summaryAccumulator.newlyAssigned += result.newlyAssigned || 0;
        summaryAccumulator.photoTagsUpdated += result.photoTagsUpdated || 0;
        if (Array.isArray(result.assignedDescriptorIds)) {
          summaryAccumulator.assignedDescriptorIds.push(...result.assignedDescriptorIds);
        }
        if (Array.isArray(result.assignedPhotos)) {
          summaryAccumulator.assignedPhotos.push(...result.assignedPhotos);
        }
      });

      summaryAccumulator.assignedDescriptorIds = [...new Set(summaryAccumulator.assignedDescriptorIds)];

      if (summaryAccumulator.assignedPhotos.length > 0) {
        const seenPhotoIds = new Set();
        summaryAccumulator.assignedPhotos = summaryAccumulator.assignedPhotos.filter(photo => {
          if (!photo?.id) return false;
          if (seenPhotoIds.has(photo.id)) return false;
          seenPhotoIds.add(photo.id);
          return true;
        });
      }
    }

    res.json({
      person,
      updated: updates.length,
      totalPhotoTagsUpdated: summaryAccumulator.photoTagsUpdated,
      autoAssignment: {
        processed: summaryAccumulator.processed,
        totalMatches: summaryAccumulator.totalMatches,
        newlyAssigned: summaryAccumulator.newlyAssigned,
        assignedDescriptorIds: summaryAccumulator.assignedDescriptorIds,
        assignedPhotos: summaryAccumulator.assignedPhotos,
      },
    });
  } catch (error) {
    console.error('Erro ao atribuir pessoa:', error);
    res.status(500).json({ error: 'Falha ao atribuir pessoa' });
  }
});

/**
 * GET /api/faces/persons
 * Lista todas as pessoas identificadas
 */
router.get('/persons', requireAuth, async (req, res) => {
  try {
    const { data: persons, error } = await supabase
      .from('persons')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(persons || []);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Falha ao listar pessoas' });
  }
});

/**
 * GET /api/faces/person/:personId/photos
 * Lista fotos de uma pessoa específica
 */
router.get('/person/:personId/photos', requireAuth, async (req, res) => {
  try {
    const { personId } = req.params;

    const { data: descriptors, error } = await supabase
      .from('face_descriptors')
      .select(`
        photo_id,
        photos (
          id,
          name,
          thumbnail_url,
          created_at
        )
      `)
      .eq('person_id', personId);

    if (error) throw error;

    // Remover duplicatas de fotos
    const uniquePhotos = [...new Map(
      descriptors.map(d => [d.photos.id, d.photos])
    ).values()];

    res.json(uniquePhotos);
  } catch (error) {
    console.error('Erro ao buscar fotos da pessoa:', error);
    res.status(500).json({ error: 'Falha ao buscar fotos' });
  }
});

export default router;

