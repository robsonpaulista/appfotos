import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/photos
 * Lista fotos com filtros
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('📸 Requisição para /api/photos');
    console.log('🍪 Cookies recebidos:', req.headers.cookie ? 'Sim' : 'Não');
    
    const auth = await requireAuth(req);
    if (!auth) {
      console.error('❌ Autenticação falhou - usuário não autenticado');
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    console.log('✅ Usuário autenticado:', auth.userId);

    const {
      person,
      joy,
      city,
      dateFrom,
      dateTo,
      minFaces,
      maxFaces,
      eventType,
      search,
      withoutPerson,
      tag,
      role,
      page = '1',
      limit = '50'
    } = req.query;

    const hasTagFilter = !!tag;
    const selectColumns = hasTagFilter
      ? '*, photo_tags:photo_tags!inner(tag, tag_type)'
      : '*, photo_tags:photo_tags(tag, tag_type)';

    let query = supabase
      .from('photos')
      .select(selectColumns, { count: 'exact' })
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (hasTagFilter) {
      query = query
        .eq('photo_tags.tag', tag as string)
        .eq('photo_tags.tag_type', 'custom');
    }

    // Aplicar filtros
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (withoutPerson === 'true') {
      query = query.is('person_tag', null);
    } else if (person) {
      query = query.ilike('person_tag', `%${person}%`);
    }

    if (role) {
      query = query.ilike('role_tag', `%${role}%`);
    }

    if (joy) {
      query = query.eq('joy_likelihood', joy);
    }

    if (city) {
      query = query.or(`event_city.ilike.*${city}*,location_name.ilike.*${city}*`);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (dateFrom) {
      const startDate = `${dateFrom}T00:00:00`;
      query = query.gte('created_at', startDate);
    }

    if (dateTo) {
      const endDate = `${dateTo}T23:59:59`;
      query = query.lte('created_at', endDate);
    }

    if (minFaces) {
      query = query.gte('faces_detected', parseInt(minFaces as string));
    }

    if (maxFaces) {
      query = query.lte('faces_detected', parseInt(maxFaces as string));
    }

    // Paginação
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Erro na query do Supabase:', error);
      throw error;
    }

    console.log(`✅ Fotos encontradas: ${data?.length || 0} de ${count || 0} total`);

    res.json({
      photos: data || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar fotos:', error);
    res.status(500).json({ error: 'Falha ao listar fotos' });
  }
}

