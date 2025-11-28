import express from 'express';
import { supabase } from '../config/supabase.config.js';

const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
};

/**
 * DELETE /api/dev/clear-all
 * ⚠️ APAGA TODOS OS METADADOS (apenas para desenvolvimento)
 */
router.delete('/clear-all', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Verificar se realmente quer limpar
    const { confirm } = req.body;
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({ 
        error: 'Confirmação necessária. Envie: { "confirm": "DELETE_ALL_DATA" }' 
      });
    }

    console.log(`⚠️  Limpando TODOS os dados para usuário ${userId}...`);

    // Limpar em ordem (por causa das foreign keys)
    const { error: tagsError } = await supabase
      .from('photo_tags')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

    const { error: photosError } = await supabase
      .from('photos')
      .delete()
      .eq('user_id', userId);

    const { error: syncError } = await supabase
      .from('sync_events')
      .delete()
      .eq('user_id', userId);

    if (tagsError || photosError || syncError) {
      throw tagsError || photosError || syncError;
    }

    // Contar o que sobrou
    const { count: photosCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: tagsCount } = await supabase
      .from('photo_tags')
      .select('*', { count: 'exact', head: true });

    const { count: syncCount } = await supabase
      .from('sync_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log(`✅ Dados limpos!`);
    console.log(`   - Fotos restantes: ${photosCount}`);
    console.log(`   - Tags restantes: ${tagsCount}`);
    console.log(`   - Syncs restantes: ${syncCount}`);

    res.json({
      success: true,
      message: 'Todos os dados foram apagados',
      remaining: {
        photos: photosCount,
        tags: tagsCount,
        syncs: syncCount
      }
    });
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    res.status(500).json({ error: 'Falha ao limpar dados' });
  }
});

/**
 * GET /api/dev/stats
 * Retorna contagem de registros no banco
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { count: photosCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: tagsCount } = await supabase
      .from('photo_tags')
      .select('*', { count: 'exact', head: true });

    const { count: syncCount } = await supabase
      .from('sync_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    res.json({
      photos: photosCount,
      tags: tagsCount,
      syncs: syncCount,
      users: usersCount
    });
  } catch (error) {
    console.error('Erro ao obter stats:', error);
    res.status(500).json({ error: 'Falha ao obter stats' });
  }
});

export default router;

