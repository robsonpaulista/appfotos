import * as faceapi from 'face-api.js';
import canvas from 'canvas';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.config.js';
import imageConversionService from './imageConversion.service.js';
import '@tensorflow/tfjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

/**
 * Serviço para reconhecimento facial usando Face-API.js
 */
class FaceRecognitionService {
  constructor() {
    this.modelsLoaded = false;
    this.modelsPath = path.join(__dirname, '..', 'models');
  }

  /**
   * Carrega os modelos de ML (executar uma vez na inicialização)
   */
  async loadModels() {
    if (this.modelsLoaded) {
      return;
    }

    console.log('🤖 Carregando modelos de reconhecimento facial...');
    
    try {
      await faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath);
      await faceapi.nets.faceExpressionNet.loadFromDisk(this.modelsPath);
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelsPath);
      } catch (ssdError) {
        console.warn('⚠️ Modelo SSD Mobilenet não encontrado. Continuando sem fallback SSD.', ssdError?.message || ssdError);
      }
      
      this.modelsLoaded = true;
      console.log('✅ Modelos carregados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar modelos:', error);
      throw new Error('Falha ao carregar modelos de reconhecimento facial');
    }
  }

  /**
   * Detecta rostos em uma imagem e extrai descritores faciais
   * @param {Buffer} imageBuffer - Buffer da imagem
   * @param {string} mimeType - Tipo MIME da imagem
   * @returns {Promise<Array>} Array de detecções com descritores
   */
  /**
   * @param {Buffer} imageBuffer
   * @param {string} mimeType
   * @param {{ fast?: boolean }} [options] - fast=true para indexação no Render Free (evita 504)
   */
  async detectFaces(imageBuffer, mimeType = 'image/jpeg', options = {}) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    const fast = Boolean(options.fast);

    try {
      let processedBuffer = imageBuffer;

      const isHEIC = mimeType?.toLowerCase().includes('heif') ||
                     mimeType?.toLowerCase().includes('heic');

      if (isHEIC) {
        console.log('  🔄 Convertendo HEIC para JPEG...');
        processedBuffer = await imageConversionService.convertHEICtoJPEG(imageBuffer, 'temp');
      }

      // fast: 800px (indexação); normal: 1280px
      const maxPx = fast ? 800 : 1280;
      try {
        const meta = await sharp(processedBuffer).metadata();
        const maxSide = Math.max(meta.width || 0, meta.height || 0);
        if (maxSide > maxPx) {
          console.log(`  📐 Redimensionando ${meta.width}x${meta.height} → máx ${maxPx}px`);
          processedBuffer = await sharp(processedBuffer)
            .rotate()
            .resize(maxPx, maxPx, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: fast ? 80 : 85 })
            .toBuffer();
        }
      } catch (resizeErr) {
        console.warn('  ⚠️ Resize Sharp falhou, usando buffer original:', resizeErr?.message || resizeErr);
      }

      const img = await canvas.loadImage(processedBuffer);

      let chain = faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: fast ? 416 : 512,
          // Limiar mais baixo = detecta mais rostos (incl. perfil / longe)
          scoreThreshold: fast ? 0.35 : 0.3,
        })
      ).withFaceLandmarks().withFaceDescriptors();

      if (!fast) {
        chain = chain.withFaceExpressions();
      }

      const detections = await chain;
      console.log(`  📊 Detectados ${detections.length} rosto(s) na imagem ${img.width}x${img.height}px`);

      if (detections.length > 0) {
        return detections.map(detection => ({
          box: detection.detection.box,
          descriptor: Array.from(detection.descriptor),
          expressions: detection.expressions,
          landmarks: detection.landmarks
        }));
      }

      // Indexação rápida: um único fallback curto (sem SSD — modelo ausente no deploy)
      console.log('  ⚠️ Nenhum rosto, fallback TinyFace 320…');
      const fallbackDetections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.45,
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (fallbackDetections.length > 0) {
        console.log(`  ✅ Fallback detectou ${fallbackDetections.length} rosto(s)`);
        return fallbackDetections.map(detection => ({
          box: detection.detection.box,
          descriptor: Array.from(detection.descriptor),
        }));
      }

      if (!fast && faceapi.nets.ssdMobilenetv1.params) {
        console.log('  ⚠️ Tentando fallback com SSD Mobilenet...');
        const ssdDetections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (ssdDetections.length > 0) {
          console.log(`  ✅ SSD Mobilenet detectou ${ssdDetections.length} rosto(s)`);
          return ssdDetections.map(detection => ({
            box: detection.detection.box,
            descriptor: Array.from(detection.descriptor),
          }));
        }
      }

      console.log('  ❌ Nenhum rosto detectado.');
      return [];
    } catch (error) {
      console.error('Erro ao detectar rostos:', error);
      return [];
    }
  }

  /**
   * Salva descritores faciais no banco de dados
   * @param {string} photoId - ID da foto
   * @param {Array} detections - Detecções do detectFaces
   */
  async saveFaceDescriptors(photoId, detections) {
    try {
      const descriptors = detections.map(detection => ({
        photo_id: photoId,
        face_vector: detection.descriptor,
        bounding_box: {
          x: Math.round(detection.box.x),
          y: Math.round(detection.box.y),
          width: Math.round(detection.box.width),
          height: Math.round(detection.box.height)
        },
        confidence: detection.box.score || 0.0
      }));

      if (descriptors.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('face_descriptors')
        .insert(descriptors)
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao salvar descritores:', error);
      throw error;
    }
  }

  /**
   * Compara dois descritores faciais
   * @param {Array} descriptor1 - Primeiro descritor (array de 128 números)
   * @param {Array} descriptor2 - Segundo descritor
   * @returns {number} Distância euclidiana (quanto menor, mais similar)
   */
  compareFaces(descriptor1, descriptor2) {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
  }

  /**
   * Busca rostos similares no banco de dados
   * @param {Array} targetDescriptor - Descritor do rosto a buscar
   * @param {number} threshold - Limite de similaridade (padrão: 0.6)
   * @returns {Promise<Array>} Array de matches com foto_id e distância
   */
  async findSimilarFaces(targetDescriptor, threshold = 0.6) {
    try {
      // Buscar todos os descritores do banco
      const { data: allDescriptors, error } = await supabase
        .from('face_descriptors')
        .select('id, photo_id, face_vector, person_id');

      if (error) throw error;

      if (!allDescriptors || allDescriptors.length === 0) {
        return [];
      }

      // Comparar com cada descritor
      const matches = allDescriptors
        .map(desc => ({
          id: desc.id,
          photo_id: desc.photo_id,
          person_id: desc.person_id,
          distance: this.compareFaces(targetDescriptor, desc.face_vector)
        }))
        .filter(match => match.distance < threshold)
        .sort((a, b) => a.distance - b.distance);

      return matches;
    } catch (error) {
      console.error('Erro ao buscar rostos similares:', error);
      return [];
    }
  }

  /**
   * Escolhe o maior rosto entre detecções
   */
  pickPrimaryDetection(detections) {
    if (!detections || detections.length === 0) return null;
    return detections.reduce((best, current) => {
      const bestArea = (best.box?.width || 0) * (best.box?.height || 0);
      const currentArea = (current.box?.width || 0) * (current.box?.height || 0);
      return currentArea > bestArea ? current : best;
    });
  }

  /**
   * Busca no acervo e devolve fotos únicas enriquecidas
   */
  async searchArchiveByDescriptor(targetDescriptor, threshold = 0.5, libraryUserId) {
    const matches = await this.findSimilarFaces(targetDescriptor, threshold);

    if (matches.length === 0) {
      return { matches: [], indexedFaces: await this.countIndexedFaces() };
    }

    // Melhor match por foto
    const bestByPhoto = new Map();
    for (const match of matches) {
      const existing = bestByPhoto.get(match.photo_id);
      if (!existing || match.distance < existing.distance) {
        bestByPhoto.set(match.photo_id, match);
      }
    }

    const photoIds = [...bestByPhoto.keys()];
    let query = supabase
      .from('photos')
      .select('*')
      .in('id', photoIds);

    if (libraryUserId) {
      query = query.eq('user_id', libraryUserId);
    }

    const { data: photos, error } = await query;
    if (error) throw error;

    const enriched = [...bestByPhoto.values()]
      .map((match) => {
        const photo = photos?.find((p) => p.id === match.photo_id);
        if (!photo) return null;
        const similarity = Math.max(0, Math.min(1, 1 - match.distance));
        return {
          ...match,
          similarity,
          photo
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    return {
      matches: enriched,
      indexedFaces: await this.countIndexedFaces()
    };
  }

  async countIndexedFaces() {
    const { count } = await supabase
      .from('face_descriptors')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  /**
   * Detecta rostos a partir de um buffer e busca no acervo
   */
  async searchByImageBuffer(imageBuffer, mimeType = 'image/jpeg', threshold = 0.5, libraryUserId) {
    const detections = await this.detectFaces(imageBuffer, mimeType);
    if (detections.length === 0) {
      return {
        error: 'no_face',
        message: 'Nenhum rosto detectado na imagem. Tente outra foto, mais nítida e de frente.',
        matches: [],
        facesDetected: 0,
        indexedFaces: await this.countIndexedFaces()
      };
    }

    const primary = this.pickPrimaryDetection(detections);
    const result = await this.searchArchiveByDescriptor(
      primary.descriptor,
      threshold,
      libraryUserId
    );

    return {
      facesDetected: detections.length,
      matches: result.matches,
      indexedFaces: result.indexedFaces
    };
  }

  /**
   * Agrupa rostos similares automaticamente
   * @param {number} threshold - Limite de similaridade (padrão: 0.6)
   * @returns {Promise<Array>} Array de clusters de rostos
   */
  async clusterFaces(threshold = 0.6) {
    try {
      // Buscar todos os descritores sem pessoa atribuída
      const { data: descriptors, error } = await supabase
        .from('face_descriptors')
        .select('id, photo_id, face_vector')
        .is('person_id', null);

      if (error) throw error;

      if (descriptors.length === 0) {
        return [];
      }

      const clusters = [];
      const processed = new Set();

      for (const desc1 of descriptors) {
        if (processed.has(desc1.id)) continue;

        const cluster = [desc1];
        processed.add(desc1.id);

        for (const desc2 of descriptors) {
          if (processed.has(desc2.id)) continue;

          const distance = this.compareFaces(desc1.face_vector, desc2.face_vector);
          
          if (distance < threshold) {
            cluster.push(desc2);
            processed.add(desc2.id);
          }
        }

        if (cluster.length > 1) {
          clusters.push(cluster);
        }
      }

      return clusters;
    } catch (error) {
      console.error('Erro ao agrupar rostos:', error);
      return [];
    }
  }

  /**
   * Atribui uma pessoa a um descritor facial
   * @param {string} descriptorId - ID do descritor
   * @param {string} personId - ID da pessoa
   */
  async assignPerson(descriptorId, personId) {
    try {
      const { data, error } = await supabase
        .from('face_descriptors')
        .update({ person_id: personId })
        .eq('id', descriptorId)
        .select();

      if (error) throw error;

      return data[0];
    } catch (error) {
      console.error('Erro ao atribuir pessoa:', error);
      throw error;
    }
  }

  /**
   * Cria ou busca uma pessoa pelo nome
   * @param {string} name - Nome da pessoa
   * @returns {Promise<Object>} Pessoa criada ou encontrada
   */
  async getOrCreatePerson(name) {
    try {
      // Buscar pessoa existente
      const { data: existing, error: searchError } = await supabase
        .from('persons')
        .select('*')
        .ilike('name', name)
        .single();

      if (existing) {
        return existing;
      }

      // Criar nova pessoa
      const { data: newPerson, error: createError } = await supabase
        .from('persons')
        .insert({ name })
        .select()
        .single();

      if (createError) throw createError;

      return newPerson;
    } catch (error) {
      console.error('Erro ao criar/buscar pessoa:', error);
      throw error;
    }
  }

  async getDescriptorById(descriptorId, userId) {
    const { data, error } = await supabase
      .from('face_descriptors')
      .select(`
        id,
        photo_id,
        face_vector,
        person_id,
        photos!inner (
          id,
          user_id,
          name,
          thumbnail_url,
          created_at
        )
      `)
      .eq('id', descriptorId)
      .single();

    if (error || !data) {
      return null;
    }

    if (data.photos?.user_id && userId && data.photos.user_id !== userId) {
      return null;
    }

    const photoData = data.photos
      ? {
          id: data.photos.id,
          user_id: data.photos.user_id,
          name: data.photos.name,
          thumbnail_url: data.photos.thumbnail_url,
          created_at: data.photos.created_at,
        }
      : null;

    return {
      id: data.id,
      photo_id: data.photo_id,
      face_vector: data.face_vector,
      person_id: data.person_id,
      user_id: data.photos?.user_id || null,
      photo: photoData,
    };
  }

  async listDescriptorsForUser(userId) {
    const { data, error } = await supabase
      .from('face_descriptors')
      .select(`
        id,
        photo_id,
        face_vector,
        person_id,
        photos!inner (
          id,
          user_id
        )
      `)
      .eq('photos.user_id', userId);

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      id: item.id,
      photo_id: item.photo_id,
      face_vector: item.face_vector,
      person_id: item.person_id,
      user_id: item.photos?.user_id || null,
    }));
  }

  async updatePhotoPrimaryPerson(photoIds, personName, userId) {
    if (!photoIds || photoIds.length === 0) {
      return 0;
    }

    const uniqueIds = [...new Set(photoIds)];

    const { data, error } = await supabase
      .from('photos')
      .update({ person_tag: personName })
      .in('id', uniqueIds)
      .eq('user_id', userId)
      .is('person_tag', null)
      .select('id');

    if (error) {
      console.error('Erro ao atualizar person_tag das fotos:', error);
      return 0;
    }

    return data?.length || 0;
  }

  async autoAssignSimilarFaces({ descriptorId, personId, personName, userId, threshold = 0.48 }) {
    if (!descriptorId || !personId || !userId) {
      return {
        processed: 0,
        totalMatches: 0,
        newlyAssigned: 0,
        photoTagsUpdated: 0,
        assignedDescriptorIds: [],
        assignedPhotos: [],
      };
    }

    const targetDescriptor = await this.getDescriptorById(descriptorId, userId);

    if (!targetDescriptor || !targetDescriptor.face_vector) {
      return {
        processed: 0,
        totalMatches: 0,
        newlyAssigned: 0,
        photoTagsUpdated: 0,
        assignedDescriptorIds: [],
        assignedPhotos: [],
      };
    }

    const descriptors = await this.listDescriptorsForUser(userId);

    if (descriptors.length === 0) {
      return {
        processed: 0,
        totalMatches: 0,
        newlyAssigned: 0,
        photoTagsUpdated: 0,
        assignedDescriptorIds: [],
        assignedPhotos: [],
      };
    }

    const matches = descriptors
      .filter(desc => desc.id !== targetDescriptor.id)
      .map(desc => ({
        ...desc,
        distance: this.compareFaces(targetDescriptor.face_vector, desc.face_vector),
      }))
      .filter(match => match.distance < threshold)
      .sort((a, b) => a.distance - b.distance);

    if (matches.length === 0) {
      return {
        processed: descriptors.length,
        totalMatches: 0,
        newlyAssigned: 0,
        photoTagsUpdated: 0,
        assignedDescriptorIds: [],
        assignedPhotos: [],
      };
    }

    const assignable = matches.filter(match => !match.person_id || match.person_id === personId);
    const newAssignments = assignable.filter(match => !match.person_id);
    const descriptorIdsToAssign = [...new Set(newAssignments.map(match => match.id))];

    let assignedCount = 0;
    let updatedPhotos = 0;
    let assignedPhotos = [];

    if (descriptorIdsToAssign.length > 0) {
      const { error: assignError } = await supabase
        .from('face_descriptors')
        .update({ person_id: personId })
        .in('id', descriptorIdsToAssign);

      if (assignError) {
        console.error('Erro ao propagar pessoa para descritores similares:', assignError);
      } else {
        assignedCount = descriptorIdsToAssign.length;

        const uniquePhotoIds = [
          ...new Set(
            newAssignments
              .filter(item => descriptorIdsToAssign.includes(item.id))
              .map(match => match.photo_id)
          ),
        ];

        if (uniquePhotoIds.length > 0) {
          const { data: photosData, error: photosError } = await supabase
            .from('photos')
            .select('id, name, thumbnail_url, created_at')
            .in('id', uniquePhotoIds)
            .eq('user_id', userId);

          if (photosError) {
            console.error('Erro ao buscar fotos atribuídas automaticamente:', photosError);
          } else {
            assignedPhotos = photosData || [];
          }
        }

        updatedPhotos = await this.updatePhotoPrimaryPerson(
          descriptorIdsToAssign.map(matchId => {
            const descriptorMatch = newAssignments.find(item => item.id === matchId);
            return descriptorMatch ? descriptorMatch.photo_id : null;
          }).filter(Boolean),
          personName,
          userId
        );
      }
    }

    return {
      processed: descriptors.length,
      totalMatches: matches.length,
      newlyAssigned: assignedCount,
      photoTagsUpdated: updatedPhotos,
      assignedDescriptorIds: descriptorIdsToAssign,
      assignedPhotos,
    };
  }
}

export default new FaceRecognitionService();

