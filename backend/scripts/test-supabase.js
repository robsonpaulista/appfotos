import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, testConnection } from '../config/supabase.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('🔍 Testando conexão com Supabase...\n');

console.log('📋 Configuração:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || '❌ NÃO CONFIGURADO');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Configurado (' + process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...)' : '❌ NÃO CONFIGURADO');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurado (' + process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...)' : '❌ NÃO CONFIGURADO');
console.log('');

// Testar conexão
try {
  const connected = await testConnection();
  
  if (connected) {
    console.log('\n✅ Teste de conexão bem-sucedido!');
    
    // Testar tabela users
    console.log('\n🔍 Testando tabela "users"...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError.message);
      console.error('💡 Verifique se a tabela existe e se as permissões estão corretas');
    } else {
      console.log('✅ Tabela "users" acessível');
      console.log('📊 Total de usuários:', users?.length || 0);
    }
    
    process.exit(0);
  } else {
    console.error('\n❌ Falha na conexão com Supabase');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Erro ao testar conexão:');
  console.error('Mensagem:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

