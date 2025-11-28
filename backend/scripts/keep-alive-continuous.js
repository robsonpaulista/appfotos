/**
 * Script Keep-Alive Contínuo para Supabase
 * 
 * Este script mantém o projeto Supabase ativo executando keep-alive
 * automaticamente a cada 6 dias.
 * 
 * ⚠️ ATENÇÃO: Este script roda indefinidamente. Use apenas se tiver
 * um servidor sempre ligado ou um serviço de nuvem.
 * 
 * Para parar: Ctrl+C ou feche o terminal
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Intervalo: 6 dias em milissegundos
const INTERVAL_DAYS = 6;
const INTERVAL_MS = INTERVAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Executa uma query simples para manter o banco ativo
 */
async function keepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 Keep-Alive executado: ${timestamp}`);
  
  try {
    const { data, error, count } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      // Fallback para tabela users
      const { error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (usersError) {
        throw usersError;
      }
    }
    
    console.log(`✅ Keep-alive executado com sucesso!`);
    console.log(`📊 Total de fotos: ${count || 0}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro no keep-alive:', error.message);
    return false;
  }
}

// Executar imediatamente
console.log('🚀 Iniciando Keep-Alive Contínuo para Supabase');
console.log(`⏰ Intervalo: ${INTERVAL_DAYS} dias (${INTERVAL_DAYS * 24} horas)`);
console.log('💡 Pressione Ctrl+C para parar\n');

await keepAlive();

// Configurar intervalo
const intervalId = setInterval(async () => {
  await keepAlive();
}, INTERVAL_MS);

// Tratamento de sinais para encerrar graciosamente
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando keep-alive...');
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Encerrando keep-alive...');
  clearInterval(intervalId);
  process.exit(0);
});

console.log(`✅ Keep-alive configurado. Próxima execução em ${INTERVAL_DAYS} dias.`);

