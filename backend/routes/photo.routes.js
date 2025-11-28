import express from 'express';
import driveService from '../services/drive.service.js';
import imageConversionService from '../services/imageConversion.service.js';
import { supabase } from '../config/supabase.config.js';
import { setCredentials } from '../config/google.config.js';

const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    // Obter tokens do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('access_token, refresh_token, token_expiry')
      .eq('id', req.session.userId)
      .single();

    if (error) throw error;

    // Configurar credenciais para esta requisição
    setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      expiry_date: new Date(user.token_expiry).getTime()
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Sessão inválida' });
  }
};

/**
 * GET /api/photos
 * Lista fotos com filtros
 */
router.get('/', requireAuth, async (req, res) => {
  try {
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
      page = 1,
      limit = 50
    } = req.query;

    let query = supabase
      .from('photos')
      .select('*', { count: 'exact' })
      .eq('user_id', req.session.userId)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (search) {
      // Busca parcial no nome do arquivo (case-insensitive)
      query = query.ilike('name', `%${search}%`);
    }

    if (withoutPerson === 'true') {
      // Mostrar apenas fotos SEM pessoa marcada
      query = query.is('person_tag', null);
    } else if (person) {
      // Busca parcial no campo pessoa (case-insensitive)
      query = query.ilike('person_tag', `%${person}%`);
    }

    if (joy) {
      query = query.eq('joy_likelihood', joy);
    }

    if (city) {
      // Buscar tanto em event_city quanto em location_name (case-insensitive parcial)
      // Sintaxe correta: usar * ao invés de % dentro do or()
      query = query.or(`event_city.ilike.*${city}*,location_name.ilike.*${city}*`);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (dateFrom) {
      // Data inicial - início do dia em horário local
      const startDate = `${dateFrom}T00:00:00`;
      query = query.gte('created_at', startDate);
    }

    if (dateTo) {
      // Data final - fim do dia em horário local
      const endDate = `${dateTo}T23:59:59`;
      query = query.lte('created_at', endDate);
    }

    if (minFaces) {
      query = query.gte('faces_detected', parseInt(minFaces));
    }

    if (maxFaces) {
      query = query.lte('faces_detected', parseInt(maxFaces));
    }

    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      photos: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar fotos:', error);
    res.status(500).json({ error: 'Falha ao listar fotos' });
  }
});

/**
 * GET /api/photos/:id
 * Obtém detalhes de uma foto específica
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao obter foto:', error);
    res.status(500).json({ error: 'Falha ao obter foto' });
  }
});

/**
 * GET /api/photos/stream/:driveId
 * Faz streaming seguro da imagem do Drive (com conversão HEIC→JPEG)
 */
router.get('/stream/:driveId', requireAuth, async (req, res) => {
  try {
    const { driveId } = req.params;

    // Verificar se o usuário tem acesso a esta foto
    const { data: photo, error } = await supabase
      .from('photos')
      .select('id, mime_type, name')
      .eq('drive_id', driveId)
      .eq('user_id', req.session.userId)
      .single();

    if (error || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    const isHEIC = photo.mime_type?.toLowerCase().includes('heif') || 
                   photo.mime_type?.toLowerCase().includes('heic');

    if (isHEIC) {
      // Para HEIC: baixar, converter e enviar
      console.log(`🔄 Convertendo HEIC: ${photo.name}`);
      
      const imageBuffer = await driveService.getFileContent(driveId);
      const { buffer: convertedBuffer, mimeType } = await imageConversionService.processImage(
        imageBuffer, 
        photo.mime_type, 
        driveId
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
      res.send(convertedBuffer);
    } else {
      // Para outros formatos: streaming normal
      res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      await driveService.streamFile(driveId, res);
    }
  } catch (error) {
    console.error('Erro ao fazer streaming:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao carregar imagem' });
    }
  }
});

/**
 * GET /api/photos/:id/image
 * Retorna a imagem para visualização (com conversão HEIC→JPEG)
 */
router.get('/:id/image', requireAuth, async (req, res) => {
  try {
    const { data: photo, error } = await supabase
      .from('photos')
      .select('drive_id, mime_type, name')
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .single();

    if (error || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    const isHEIC = photo.mime_type?.toLowerCase().includes('heif') || 
                   photo.mime_type?.toLowerCase().includes('heic');

    if (isHEIC) {
      // Para HEIC: converter para JPEG
      const imageBuffer = await driveService.getFileContent(photo.drive_id);
      const { buffer: convertedBuffer } = await imageConversionService.processImage(
        imageBuffer, 
        photo.mime_type, 
        photo.drive_id
      );

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(convertedBuffer);
    } else {
      // Outros formatos: streaming normal
      res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      await driveService.streamFile(photo.drive_id, res);
    }
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao carregar imagem' });
    }
  }
});

/**
 * GET /api/photos/:id/download
 * Download direto da foto (com conversão HEIC→JPEG)
 */
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .single();

    if (error || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    const isHEIC = photo.mime_type?.toLowerCase().includes('heif') || 
                   photo.mime_type?.toLowerCase().includes('heic');

    if (isHEIC) {
      // Para HEIC: baixar, converter e enviar como JPEG
      console.log(`📥 Download com conversão HEIC: ${photo.name}`);
      
      const imageBuffer = await driveService.getFileContent(photo.drive_id);
      const { buffer: convertedBuffer } = await imageConversionService.processImage(
        imageBuffer, 
        photo.mime_type, 
        photo.drive_id
      );

      // Nome do arquivo convertido
      const newName = photo.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
      
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(newName)}"`);
      res.send(convertedBuffer);
    } else {
      // Para outros formatos: streaming normal
      res.setHeader('Content-Type', photo.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(photo.name)}"`);
      await driveService.streamFile(photo.drive_id, res);
    }
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao fazer download' });
    }
  }
});

/**
 * PUT /api/photos/:id
 * Atualiza metadados de uma foto (tags, pessoa, local, etc)
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { person, location, event_type, event_city, event_year, event_month, person_tag, location_name } = req.body;

    const updates = {};
    
    // Aceitar tanto o formato antigo (person_tag) quanto novo (person)
    if (person !== undefined) updates.person_tag = person;
    if (person_tag !== undefined) updates.person_tag = person_tag;
    if (location !== undefined) updates.location_name = location;
    if (location_name !== undefined) updates.location_name = location_name;
    
    // Novos campos de eventos
    if (event_type !== undefined) updates.event_type = event_type;
    if (event_city !== undefined) updates.event_city = event_city;
    if (event_year !== undefined) updates.event_year = event_year;
    if (event_month !== undefined) updates.event_month = event_month;

    const { data, error } = await supabase
      .from('photos')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    res.status(500).json({ error: 'Falha ao atualizar foto' });
  }
});

/**
 * POST /api/photos/:id/tags
 * Adiciona tags a uma foto
 */
router.post('/:id/tags', requireAuth, async (req, res) => {
  try {
    const { tag, tag_type = 'custom' } = req.body;

    if (!tag) {
      return res.status(400).json({ error: 'Tag é obrigatória' });
    }

    // Verificar se foto pertence ao usuário
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .single();

    if (photoError || !photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Adicionar tag
    const { data, error } = await supabase
      .from('photo_tags')
      .insert({
        photo_id: req.params.id,
        tag,
        tag_type
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao adicionar tag:', error);
    res.status(500).json({ error: 'Falha ao adicionar tag' });
  }
});

/**
 * GET /api/photos/stats/summary
 * Retorna estatísticas gerais das fotos
 */
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_photo_stats', { p_user_id: req.session.userId });

    if (error) throw error;

    res.json(stats || {
      total: 0,
      withFaces: 0,
      analyzed: 0,
      withLocation: 0
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Falha ao obter estatísticas' });
  }
});

export default router;
