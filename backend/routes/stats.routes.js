import express from 'express';
import { supabase } from '../config/supabase.config.js';
import { getLibrarySourceId } from '../config/google.config.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/stats/summary
 * Retorna estatísticas gerais
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = getLibrarySourceId();

    // Estatísticas gerais
    const { data: generalStats } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Por ano
    const { data: byYear } = await supabase
      .from('photos')
      .select('event_year')
      .eq('user_id', userId)
      .not('event_year', 'is', null);

    // Por cidade
    const { data: byCity } = await supabase
      .from('photos')
      .select('event_city')
      .eq('user_id', userId)
      .not('event_city', 'is', null);

    // Por tipo
    const { data: byType } = await supabase
      .from('photos')
      .select('event_type')
      .eq('user_id', userId)
      .not('event_type', 'is', null);

    // Analisadas
    const { count: analyzedCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('analyzed', true);

    // Com GPS
    const { count: withGpsCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null);

    // Com rostos
    const { count: withFacesCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('faces_detected', 0);

    // Agrupar dados
    const yearCounts = {};
    byYear?.forEach(p => {
      yearCounts[p.event_year] = (yearCounts[p.event_year] || 0) + 1;
    });

    const cityCounts = {};
    byCity?.forEach(p => {
      cityCounts[p.event_city] = (cityCounts[p.event_city] || 0) + 1;
    });

    const typeCounts = {};
    byType?.forEach(p => {
      typeCounts[p.event_type] = (typeCounts[p.event_type] || 0) + 1;
    });

    res.json({
      total: generalStats?.count || 0,
      analyzed: analyzedCount || 0,
      withGps: withGpsCount || 0,
      withFaces: withFacesCount || 0,
      byYear: yearCounts,
      byCity: cityCounts,
      byType: typeCounts
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Falha ao obter estatísticas' });
  }
});

/**
 * GET /api/stats/cities
 * Lista todas as cidades disponíveis
 */
router.get('/cities', requireAuth, async (req, res) => {
  try {
    const userId = getLibrarySourceId();
    const cities = new Set();

    // Buscar de event_city (se coluna existir)
    try {
      const { data: eventCities } = await supabase
        .from('photos')
        .select('event_city')
        .eq('user_id', userId)
        .not('event_city', 'is', null);

      eventCities?.forEach(p => {
        if (p.event_city) cities.add(p.event_city);
      });
    } catch (error) {
      // Coluna event_city não existe ainda, ignora
      console.log('Coluna event_city não existe ainda');
    }

    // Buscar de location_name e extrair cidade
    const { data: locations } = await supabase
      .from('photos')
      .select('location_name')
      .eq('user_id', userId)
      .not('location_name', 'is', null);

    locations?.forEach(p => {
      if (p.location_name) {
        const locationName = p.location_name.trim();
        
        // Se tiver vírgula, extrair primeira parte (cidade)
        if (locationName.includes(',')) {
          const city = locationName.split(',')[0]?.trim();
          if (city) cities.add(city);
        } else {
          // Se não tiver vírgula, adicionar o nome completo
          cities.add(locationName);
        }
      }
    });

    const cityList = Array.from(cities).filter(Boolean).sort();
    res.json(cityList);
  } catch (error) {
    console.error('Erro ao listar cidades:', error);
    res.status(500).json({ error: 'Falha ao listar cidades' });
  }
});

/**
 * GET /api/stats/types
 * Lista todos os tipos de eventos disponíveis
 */
router.get('/types', requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('photos')
      .select('event_type')
      .eq('user_id', getLibrarySourceId())
      .not('event_type', 'is', null);

    const types = [...new Set(data?.map(p => p.event_type))].filter(Boolean).sort();
    res.json(types);
  } catch (error) {
    console.error('Erro ao listar tipos:', error);
    res.status(500).json({ error: 'Falha ao listar tipos' });
  }
});

export default router;

