import { google } from 'googleapis';
import { oauth2Client } from '../config/google.config.js';
import sharp from 'sharp';
import axios from 'axios';

/**
 * Serviço para análise de imagens com Google Cloud Vision API
 */
class VisionService {
  constructor() {
    this.isEnabled = !!process.env.GOOGLE_CLOUD_VISION_ENABLED;
    this.maxImageSize = 4 * 1024 * 1024; // 4MB - limite seguro para Vision API
    this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
  }

  /**
   * Redimensiona imagem se for muito grande
   * @param {Buffer} imageBuffer - Buffer da imagem original
   * @returns {Promise<Buffer>} Buffer da imagem processada
   */
  async processImageBuffer(imageBuffer) {
    try {
      const sizeInMB = imageBuffer.length / 1024 / 1024;
      console.log(`  📏 Tamanho original: ${sizeInMB.toFixed(2)}MB`);

      // SEMPRE redimensiona imagens grandes para garantir que passem
      if (imageBuffer.length > this.maxImageSize) {
        console.log(`  ⚠️  Imagem grande, redimensionando...`);
      } else {
        console.log(`  ✅ Tamanho OK, mas redimensionando por segurança...`);
      }

      // SEMPRE redimensiona para garantir compatibilidade
      // Máximo 1280px no lado maior para garantir que fique pequeno
      const processedBuffer = await sharp(imageBuffer)
        .resize(1280, 1280, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 }) // JPEG com qualidade 80%
        .toBuffer();

      const newSizeInMB = processedBuffer.length / 1024 / 1024;
      console.log(`  ✅ Nova imagem: ${newSizeInMB.toFixed(2)}MB`);
      
      return processedBuffer;
    } catch (error) {
      // Se for erro de HEIC ou formato não suportado, usa imagem original
      if (error.message.includes('heif') || error.message.includes('compression format')) {
        console.log('  ⚠️  Formato HEIC/não suportado, usando imagem original...');
        return imageBuffer;
      }
      
      console.error('  ❌ Erro ao processar imagem:', error.message);
      // Tenta um redimensionamento mais agressivo
      try {
        console.log('  🔄 Tentando redimensionamento mais agressivo...');
        const fallbackBuffer = await sharp(imageBuffer)
          .resize(800, 800, { fit: 'inside' })
          .jpeg({ quality: 70 })
          .toBuffer();
        console.log(`  ✅ Fallback: ${(fallbackBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        return fallbackBuffer;
      } catch (fallbackError) {
        console.log('  ⚠️  Fallback falhou, usando imagem original...');
        return imageBuffer;
      }
    }
  }

  /**
   * Analisa uma imagem para detectar rostos e emoções
   * @param {Buffer} imageBuffer - Buffer da imagem
   * @returns {Promise<Object>} Resultado da análise
   */
  async analyzeImage(imageBuffer) {
    if (!this.isEnabled) {
      console.log('Vision API desabilitada. Pulando análise.');
      return this.getEmptyAnalysis();
    }

    try {
      // Processa a imagem (redimensiona se necessário)
      const processedBuffer = await this.processImageBuffer(imageBuffer);
      const base64Image = processedBuffer.toString('base64');
      
      // Obter token de acesso
      const { token } = await oauth2Client.getAccessToken();
      
      // Fazer requisição direta via API REST
      const requestBody = {
        requests: [{
          image: { content: base64Image },
          features: [
            { type: 'FACE_DETECTION', maxResults: 10 },
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'SAFE_SEARCH_DETECTION' }
          ]
        }]
      };

      const response = await axios.post(
        this.apiEndpoint,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      const result = response.data.responses[0];
      return this.processAnalysisResult(result);
      
    } catch (error) {
      console.error('Erro na análise Vision API:', error.response?.data || error.message);
      // Em caso de erro, retorna análise vazia ao invés de falhar
      return this.getEmptyAnalysis();
    }
  }

  /**
   * Processa resultado da análise do Vision API
   * @param {Object} result - Resultado raw do Vision API
   * @returns {Object} Análise processada
   */
  processAnalysisResult(result) {
    const faces = result.faceAnnotations || [];
    const labels = result.labelAnnotations || [];
    const safeSearch = result.safeSearchAnnotation || {};

    // Analisa emoções dos rostos detectados
    const emotionAnalysis = this.analyzeEmotions(faces);

    return {
      facesDetected: faces.length,
      emotions: emotionAnalysis,
      labels: labels.map(label => ({
        description: label.description,
        score: label.score,
        confidence: label.confidence
      })),
      safeSearch: {
        adult: safeSearch.adult,
        violence: safeSearch.violence,
        racy: safeSearch.racy
      }
    };
  }

  /**
   * Analisa emoções predominantes nos rostos detectados
   * @param {Array} faces - Array de rostos detectados
   * @returns {Object} Análise de emoções
   */
  analyzeEmotions(faces) {
    if (!faces || faces.length === 0) {
      return this.getEmptyEmotions();
    }

    // Conta likelihood de cada emoção
    const emotionCounts = {
      joy: { VERY_LIKELY: 0, LIKELY: 0, POSSIBLE: 0, UNLIKELY: 0, VERY_UNLIKELY: 0 },
      sorrow: { VERY_LIKELY: 0, LIKELY: 0, POSSIBLE: 0, UNLIKELY: 0, VERY_UNLIKELY: 0 },
      anger: { VERY_LIKELY: 0, LIKELY: 0, POSSIBLE: 0, UNLIKELY: 0, VERY_UNLIKELY: 0 },
      surprise: { VERY_LIKELY: 0, LIKELY: 0, POSSIBLE: 0, UNLIKELY: 0, VERY_UNLIKELY: 0 }
    };

    faces.forEach(face => {
      if (face.joyLikelihood) emotionCounts.joy[face.joyLikelihood]++;
      if (face.sorrowLikelihood) emotionCounts.sorrow[face.sorrowLikelihood]++;
      if (face.angerLikelihood) emotionCounts.anger[face.angerLikelihood]++;
      if (face.surpriseLikelihood) emotionCounts.surprise[face.surpriseLikelihood]++;
    });

    // Determina emoção predominante
    const predominant = this.getPredominantEmotion(emotionCounts, faces.length);

    return {
      joyLikelihood: predominant.joy,
      sorrowLikelihood: predominant.sorrow,
      angerLikelihood: predominant.anger,
      surpriseLikelihood: predominant.surprise,
      predominantEmotion: predominant.main
    };
  }

  /**
   * Determina emoção predominante
   * @param {Object} emotionCounts - Contagem de emoções
   * @param {number} totalFaces - Total de rostos
   * @returns {Object} Emoção predominante
   */
  getPredominantEmotion(emotionCounts, totalFaces) {
    const getLikelihood = (emotion) => {
      const counts = emotionCounts[emotion];
      if (counts.VERY_LIKELY > totalFaces * 0.5) return 'VERY_LIKELY';
      if (counts.VERY_LIKELY + counts.LIKELY > totalFaces * 0.5) return 'LIKELY';
      if (counts.VERY_LIKELY + counts.LIKELY + counts.POSSIBLE > totalFaces * 0.3) return 'POSSIBLE';
      if (counts.VERY_UNLIKELY > totalFaces * 0.5) return 'VERY_UNLIKELY';
      return 'UNLIKELY';
    };

    const likelihoods = {
      joy: getLikelihood('joy'),
      sorrow: getLikelihood('sorrow'),
      anger: getLikelihood('anger'),
      surprise: getLikelihood('surprise')
    };

    // Determina qual é a principal
    let mainEmotion = 'neutral';
    if (likelihoods.joy === 'VERY_LIKELY' || likelihoods.joy === 'LIKELY') {
      mainEmotion = 'joy';
    } else if (likelihoods.sorrow === 'VERY_LIKELY' || likelihoods.sorrow === 'LIKELY') {
      mainEmotion = 'sorrow';
    } else if (likelihoods.anger === 'VERY_LIKELY' || likelihoods.anger === 'LIKELY') {
      mainEmotion = 'anger';
    } else if (likelihoods.surprise === 'VERY_LIKELY' || likelihoods.surprise === 'LIKELY') {
      mainEmotion = 'surprise';
    }

    return {
      ...likelihoods,
      main: mainEmotion
    };
  }

  /**
   * Retorna análise vazia (quando Vision API está desabilitada ou falha)
   */
  getEmptyAnalysis() {
    return {
      facesDetected: 0,
      emotions: this.getEmptyEmotions(),
      labels: [],
      safeSearch: {}
    };
  }

  /**
   * Retorna emoções vazias
   */
  getEmptyEmotions() {
    return {
      joyLikelihood: 'UNKNOWN',
      sorrowLikelihood: 'UNKNOWN',
      angerLikelihood: 'UNKNOWN',
      surpriseLikelihood: 'UNKNOWN',
      predominantEmotion: 'neutral'
    };
  }
}

export default new VisionService();
