import express from 'express';
import folderService from '../services/folder.service.js';
import { supabase } from '../config/supabase.config.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/folders
 * Lista todas as pastas do Google Drive
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('Listando pastas do Google Drive...');
    const folders = await folderService.listFolders();
    
    // Construir árvore de pastas
    const tree = folderService.buildFolderTree(folders);
    
    console.log(`${folders.length} pastas encontradas`);
    
    res.json({
      folders: folders,
      tree: tree,
      total: folders.length
    });
  } catch (error) {
    console.error('Erro ao listar pastas:', error);
    res.status(500).json({ error: 'Falha ao listar pastas' });
  }
});

/**
 * GET /api/folders/:id
 * Obtém informações de uma pasta específica
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const folder = await folderService.getFolderInfo(req.params.id);
    res.json(folder);
  } catch (error) {
    console.error('Erro ao obter pasta:', error);
    res.status(500).json({ error: 'Falha ao obter pasta' });
  }
});

/**
 * GET /api/folders/:id/photos
 * Lista fotos de uma pasta específica
 */
router.get('/:id/photos', requireAuth, async (req, res) => {
  try {
    const { pageToken, pageSize = 50 } = req.query;
    
    const result = await folderService.listPhotosInFolder(
      req.params.id,
      parseInt(pageSize),
      pageToken
    );
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar fotos da pasta:', error);
    res.status(500).json({ error: 'Falha ao listar fotos da pasta' });
  }
});

export default router;

