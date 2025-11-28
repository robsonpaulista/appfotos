import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis do Supabase não configuradas!');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Não configurado');
  console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? '✅ Configurado' : '❌ Não configurado');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado');
  throw new Error('Variáveis do Supabase não configuradas. Verifique o arquivo .env ou variáveis de ambiente do Vercel');
}

// Validar formato da URL
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('❌ ERRO: SUPABASE_URL não é uma URL válida:', supabaseUrl);
  throw new Error('SUPABASE_URL não é uma URL válida');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options = {}) => {
      const headers = {
        ...options.headers,
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      };
      
      return fetch(url, { ...options, headers }).catch((error) => {
        console.error('❌ Erro no fetch para:', url);
        console.error('Tipo:', error.constructor.name);
        console.error('Mensagem:', error.message);
        if (error.cause) {
          console.error('Causa:', error.cause);
        }
        throw error;
      });
    },
  },
});

