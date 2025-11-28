import driveService from '../services/drive.service.js';
import databaseService from '../services/database.service.js';

/**
 * Controller para operações com fotos
 */

/**
 * Lista fotos com filtros
 */
export async function listPhotos(req, res) {
  try {
    const filters = {
      person: req.query.person,
      joy: req.query.joy,
      minFaces: req.query.minFaces ? parseInt(req.query.minFaces) : null,
      year: req.query.year,
      city: req.query.city,
      lat: req.query.lat ? parseFloat(req.query.lat) : null,
      lng: req.query.lng ? parseFloat(req.query.lng) : null,
      radius: req.query.radius ? parseFloat(req.query.radius) : null,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const result = await databaseService.searchPhotos(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar fotos:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtém detalhes de uma foto
 */
export async function getPhoto(req, res) {
  try {
    const { id } = req.params;
    const photo = await databaseService.getPhotoById(id);

    if (!photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Faz streaming de uma imagem do Drive
 * Mantém os arquivos privados - proxy seguro
 */
export async function streamPhoto(req, res) {
  try {
    const { id } = req.params;
    
    // Busca a foto no banco
    const photo = await databaseService.getPhotoById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Faz streaming do Drive
    const stream = await driveService.streamFile(photo.drive_id);
    
    // Define headers apropriados
    res.setHeader('Content-Type', photo.mime_type);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 1 dia

    // Faz pipe do stream para a resposta
    stream.pipe(res);
  } catch (error) {
    console.error('Erro ao fazer streaming da foto:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtém thumbnail de uma foto
 */
export async function getThumbnail(req, res) {
  try {
    const { id } = req.params;
    
    // Busca a foto no banco
    const photo = await databaseService.getPhotoById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Se já tem thumbnail URL, redireciona
    if (photo.thumbnail_url) {
      return res.redirect(photo.thumbnail_url);
    }

    // Caso contrário, retorna a imagem completa (reduzida)
    return streamPhoto(req, res);
  } catch (error) {
    console.error('Erro ao obter thumbnail:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Atualiza tags de uma foto
 */
export async function updatePhotoTags(req, res) {
  try {
    const { id } = req.params;
    const { person, location, event_type, event_city, event_year, event_month } = req.body;

    const updatedPhoto = await databaseService.updatePhotoTags(id, {
      person,
      location,
      event_type,
      event_city,
      event_year,
      event_month
    });

    res.json(updatedPhoto);
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Lista todas as pessoas marcadas
 */
export async function listPeople(req, res) {
  try {
    const people = await databaseService.listPeople();
    res.json(people);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Lista todos os locais marcados
 */
export async function listLocations(req, res) {
  try {
    const locations = await databaseService.listLocations();
    res.json(locations);
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtém estatísticas gerais
 */
export async function getStats(req, res) {
  try {
    const stats = await databaseService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
}

