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
      // Garantir que os headers sejam um objeto Headers ou objeto simples
      const existingHeaders = options.headers || {};
      const headers = new Headers(existingHeaders instanceof Headers ? existingHeaders : existingHeaders);
      
      // Garantir headers obrigatórios do Supabase
      if (!headers.has('apikey')) {
        headers.set('apikey', supabaseKey);
      }
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${supabaseKey}`);
      }
      
      // Garantir Content-Type para requisições com body
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      // Garantir Prefer header para upsert
      if (options.method === 'POST' || options.method === 'PATCH' || options.method === 'PUT') {
        if (!headers.has('Prefer')) {
          headers.set('Prefer', 'return=representation');
        }
      }
      
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

