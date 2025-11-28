import express from 'express';
import { supabase } from '../config/supabase.config.js';

const router = express.Router();

/**
 * GET /api/keep-alive
 * Endpoint para manter o Supabase ativo
 * Pode ser chamado por serviços de cron job (cron-job.org, etc.)
 */
router.get('/keep-alive', async (req, res) => {
  const timestamp = new Date().toISOString();
  
  try {
    // Fazer uma query simples e leve para manter o banco ativo
    const { data, error, count } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      // Fallback: tentar acessar tabela users
      const { data: usersData, error: usersError, count: usersCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (usersError) {
        throw usersError;
      }
      
      return res.json({
        success: true,
        message: 'Keep-alive executado via tabela users',
        timestamp,
        usersCount: usersCount || 0,
        method: 'users_fallback'
      });
    }
    
    res.json({
      success: true,
      message: 'Keep-alive executado com sucesso',
      timestamp,
      photosCount: count || 0,
      method: 'photos'
    });
    
  } catch (error) {
    console.error('❌ Erro no keep-alive:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar keep-alive',
      error: error.message,
      timestamp
    });
  }
});

export default router;

