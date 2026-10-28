import express from 'express';
import visionService from '../services/vision.service.js';
import driveService from '../services/drive.service.js';
import { supabase } from '../config/supabase.config.js';
import { getLibrarySourceId } from '../config/google.config.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/analysis/reanalyze
 * Re-analisa fotos específicas ou todas as fotos
 */
router.post('/reanalyze', requireAuth, async (req, res) => {
  try {
    const userId = getLibrarySourceId();
    const { photoIds, force = false } = req.body;

    console.log('🔄 Iniciando re-análise de fotos...');

    let query = supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId);

    // Se IDs específicos foram fornecidos
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      query = query.in('id', photoIds);
    } else if (!force) {
      // Por padrão, apenas re-analisa fotos não analisadas
      query = query.eq('analyzed', false);
    }

    const { data: photos, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Erro ao buscar fotos:', fetchError);
      return res.status(500).json({ error: 'Erro ao buscar fotos' });
    }

    if (!photos || photos.length === 0) {
      return res.json({ 
        message: 'Nenhuma foto para analisar',
        processed: 0,
        success: 0,
        failed: 0
      });
    }

    console.log(`📊 Analisando ${photos.length} fotos...`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      details: []
    };

    for (const photo of photos) {
      try {
        results.processed++;
        console.log(`  🔍 Analisando: ${photo.name} (${results.processed}/${photos.length})`);

        // Baixar imagem do Drive
        const imageBuffer = await driveService.getFileContent(photo.drive_id);
        
        // Analisar com Vision API
        const analysis = await visionService.analyzeImage(imageBuffer);

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('photos')
          .update({
            faces_detected: analysis.facesDetected,
            joy_likelihood: analysis.emotions.joyLikelihood,
            sorrow_likelihood: analysis.emotions.sorrowLikelihood,
            anger_likelihood: analysis.emotions.angerLikelihood,
            surprise_likelihood: analysis.emotions.surpriseLikelihood,
            analyzed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', photo.id);

        if (updateError) {
          throw updateError;
        }

        results.success++;
        results.details.push({
          id: photo.id,
          name: photo.name,
          status: 'success',
          facesDetected: analysis.facesDetected,
          predominantEmotion: analysis.emotions.predominantEmotion
        });

        console.log(`    ✅ ${analysis.facesDetected} rostos detectados, emoção: ${analysis.emotions.predominantEmotion}`);

      } catch (error) {
        results.failed++;
        results.details.push({
          id: photo.id,
          name: photo.name,
          status: 'failed',
          error: error.message
        });
        console.error(`    ❌ Erro ao analisar ${photo.name}:`, error.message);
      }
    }

    console.log(`✅ Re-análise concluída: ${results.success} sucesso, ${results.failed} falhas`);

    res.json(results);

  } catch (error) {
    console.error('❌ Erro na re-análise:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analysis/stats
 * Retorna estatísticas de análise
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = getLibrarySourceId();

    // Total de fotos
    const { count: total } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Fotos analisadas
    const { count: analyzed } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('analyzed', true);

    // Fotos com rostos
    const { count: withFaces } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('faces_detected', 0);

    // Distribuição de emoções
    const { data: emotionData } = await supabase
      .from('photos')
      .select('joy_likelihood, sorrow_likelihood, anger_likelihood, surprise_likelihood, faces_detected')
      .eq('user_id', userId)
      .gt('faces_detected', 0);

    const emotions = {
      joy: 0,
      sorrow: 0,
      anger: 0,
      surprise: 0,
      neutral: 0
    };

    emotionData?.forEach(photo => {
      if (photo.joy_likelihood === 'VERY_LIKELY' || photo.joy_likelihood === 'LIKELY') {
        emotions.joy++;
      } else if (photo.sorrow_likelihood === 'VERY_LIKELY' || photo.sorrow_likelihood === 'LIKELY') {
        emotions.sorrow++;
      } else if (photo.anger_likelihood === 'VERY_LIKELY' || photo.anger_likelihood === 'LIKELY') {
        emotions.anger++;
      } else if (photo.surprise_likelihood === 'VERY_LIKELY' || photo.surprise_likelihood === 'LIKELY') {
        emotions.surprise++;
      } else {
        emotions.neutral++;
      }
    });

    res.json({
      total: total || 0,
      analyzed: analyzed || 0,
      pending: (total || 0) - (analyzed || 0),
      withFaces: withFaces || 0,
      withoutFaces: (total || 0) - (withFaces || 0),
      emotions
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

