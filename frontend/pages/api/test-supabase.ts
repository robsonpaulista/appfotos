import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/api-server/supabase.config';

/**
 * GET /api/test-supabase
 * Endpoint de teste para verificar conexão com Supabase
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
    success: false,
  };

  // Verificar variáveis de ambiente
  results.checks.env = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    results.errors.push('Variáveis de ambiente do Supabase não configuradas');
    return res.status(500).json(results);
  }

  // Testar conexão básica
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      results.errors.push(`Erro ao consultar banco: ${error.message}`);
      results.checks.connection = false;
    } else {
      results.checks.connection = true;
      results.checks.tableAccess = true;
    }
  } catch (error: any) {
    results.errors.push(`Erro de conexão: ${error.message}`);
    results.checks.connection = false;
    
    if (error.message?.includes('fetch failed')) {
      results.errors.push('Possível causa: Supabase pode estar pausado. Verifique o dashboard do Supabase.');
    }
  }

  // Testar se a tabela existe
  try {
    const { error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0);

    if (tableError && tableError.code === 'PGRST116') {
      results.errors.push('Tabela "users" não encontrada. Execute o schema.sql no Supabase.');
    } else if (tableError) {
      results.errors.push(`Erro ao acessar tabela: ${tableError.message}`);
    } else {
      results.checks.tableExists = true;
    }
  } catch (error: any) {
    results.errors.push(`Erro ao verificar tabela: ${error.message}`);
  }

  results.success = results.errors.length === 0;

  if (results.success) {
    return res.status(200).json(results);
  } else {
    return res.status(500).json(results);
  }
}

