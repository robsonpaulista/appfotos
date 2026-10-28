import express from 'express';
import geocodingService from '../services/geocoding.service.js';
import { supabase } from '../config/supabase.config.js';
import { getLibrarySourceId } from '../config/google.config.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/geocoding/process
 * Processa fotos com GPS e preenche cidades
 */
router.post('/process', requireAuth, async (req, res) => {
  try {
    const { limit = 100 } = req.body;
    const userId = getLibrarySourceId();

    console.log(`🌍 Iniciando geocoding para usuário ${userId}...`);

    // Buscar fotos com GPS mas sem location_name
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, drive_id, gps_lat, gps_lng, location_name')
      .eq('user_id', userId)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null)
      .is('location_name', null)
      .limit(limit);

    if (error) throw error;

    console.log(`📍 ${photos.length} fotos com GPS para processar`);

    if (photos.length === 0) {
      return res.json({
        message: 'Nenhuma foto com GPS para processar',
        processed: 0
      });
    }

    // Responder imediatamente
    res.json({
      message: `Processando ${photos.length} fotos em background`,
      total: photos.length
    });

    // Processar em background
    geocodingService.batchReverseGeocode(photos)
      .then(async (locations) => {
        console.log(`✅ ${locations.length} localizações encontradas`);

        // Atualizar fotos no banco
        for (const loc of locations) {
          try {
            // Tentar atualizar com event_city (se coluna existir)
            const { error } = await supabase
              .from('photos')
              .update({
                location_name: loc.location_name,
                event_city: loc.city
              })
              .eq('drive_id', loc.drive_id)
              .or('event_city.is.null,location_name.is.null');

            if (error) {
              console.error(`Erro ao atualizar ${loc.drive_id}:`, error.message);
              
              // Fallback: tentar atualizar apenas location_name
              await supabase
                .from('photos')
                .update({
                  location_name: loc.location_name
                })
                .eq('drive_id', loc.drive_id);
            } else {
              console.log(`📍 Atualizado: ${loc.city} (${loc.drive_id})`);
            }
          } catch (error) {
            console.error(`Erro ao processar ${loc.drive_id}:`, error);
          }
        }

        console.log(`🎊 Geocoding concluído! ${locations.length} fotos atualizadas`);
      })
      .catch(error => {
        console.error('❌ Erro no geocoding:', error);
      });

  } catch (error) {
    console.error('Erro ao iniciar geocoding:', error);
    res.status(500).json({ error: 'Falha ao iniciar geocoding' });
  }
});

/**
 * GET /api/geocoding/stats
 * Retorna estatísticas de GPS
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = getLibrarySourceId();

    // Total com GPS
    const { count: withGps } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null);

    // Com GPS mas sem localização
    const { count: withoutLocation } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null)
      .is('location_name', null);

    res.json({
      withGps: withGps || 0,
      withoutLocation: withoutLocation || 0,
      processed: (withGps || 0) - (withoutLocation || 0),
      cacheSize: geocodingService.getCacheSize()
    });
  } catch (error) {
    console.error('Erro ao obter stats de geocoding:', error);
    res.status(500).json({ error: 'Falha ao obter stats' });
  }
});

export default router;

