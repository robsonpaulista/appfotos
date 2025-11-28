import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/api-server/supabase.config';

/**
 * GET /api/keep-alive
 * Endpoint para manter o Supabase ativo
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const timestamp = new Date().toISOString();
  
  try {
    // Query simples para manter o banco ativo
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
  } catch (error: any) {
    console.error('❌ Erro no keep-alive:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar keep-alive',
      error: error.message,
      timestamp
    });
  }
}

