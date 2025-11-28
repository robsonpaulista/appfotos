import express from 'express';
import folderService from '../services/folder.service.js';
import { supabase } from '../config/supabase.config.js';
import { setCredentials } from '../config/google.config.js';

const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('access_token, refresh_token, token_expiry')
      .eq('id', req.session.userId)
      .single();

    if (error) throw error;

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

