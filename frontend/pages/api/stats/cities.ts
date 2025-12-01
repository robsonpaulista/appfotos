import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/stats/cities
 * Lista todas as cidades disponíveis
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const cities = new Set<string>();

    // Buscar de event_city (se coluna existir)
    try {
      const { data: eventCities } = await supabase
        .from('photos')
        .select('event_city')
        .eq('user_id', auth.userId)
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
      .eq('user_id', auth.userId)
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
  } catch (error: any) {
    console.error('Erro ao listar cidades:', error);
    res.status(500).json({ error: 'Falha ao listar cidades' });
  }
}

