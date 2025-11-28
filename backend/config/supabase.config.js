import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis do Supabase não configuradas!');
  console.error('SUPABASE_URL:', supabaseUrl || '❌ FALTANDO');
  console.error('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Configurado' : '❌ FALTANDO');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ FALTANDO');
  throw new Error('Variáveis do Supabase não configuradas. Verifique o arquivo .env');
}

// Log de configuração (apenas em desenvolvimento, sem expor a chave completa)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase configurado:');
  console.log('   URL:', supabaseUrl);
  console.log('   Key:', supabaseKey ? `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 4)}` : '❌ FALTANDO');
  console.log('   Tipo:', process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON_KEY');
}

// Validar formato da URL
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('❌ ERRO: SUPABASE_URL inválido:', supabaseUrl);
  throw new Error('SUPABASE_URL deve ser uma URL válida (ex: https://xxxxx.supabase.co)');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Não persistir sessão no backend
    autoRefreshToken: false,
  },
  // Configurações adicionais para resolver problemas de conexão
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    fetch: (url, options = {}) => {
      // Garantir que a API key está sendo enviada nos headers
      // O Supabase client já adiciona automaticamente, mas vamos garantir
      const existingHeaders = options.headers || {};
      const headers = new Headers(existingHeaders);
      
      // Garantir que apikey e Authorization estão presentes
      if (!headers.has('apikey')) {
        headers.set('apikey', supabaseKey);
      }
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${supabaseKey}`);
      }
      
      // Content-Type padrão se não especificado
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Supabase Request:', {
          url: url.toString().substring(0, 100),
          hasApikey: headers.has('apikey'),
          hasAuth: headers.has('Authorization'),
          method: options.method || 'GET',
        });
      }
      
      return fetch(url, {
        ...options,
        headers,
      }).catch((error) => {
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

// Função helper para verificar conexão
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('photos').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Conexão com Supabase estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message);
    return false;
  }
};

