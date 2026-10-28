/**
 * Script Keep-Alive para Supabase
 * 
 * Este script mantém o projeto Supabase ativo acessando o banco periodicamente,
 * evitando que seja pausado automaticamente após 1 semana de inatividade.
 * 
 * Execute este script periodicamente (a cada 6 dias) para manter o projeto ativo.
 * 
 * Opções de execução:
 * 1. Manualmente: node backend/scripts/keep-alive.js
 * 2. Windows Task Scheduler: Configure para executar a cada 6 dias
 * 3. Cron job (Linux/Mac): Configure para executar a cada 6 dias
 * 4. Serviço de nuvem: Use um serviço como cron-job.org para executar via HTTP
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Executa uma query simples para manter o banco ativo
 */
async function keepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 Keep-Alive executado: ${timestamp}`);
  
  try {
    // Fazer uma query simples e leve
    const { data, error, count } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro ao acessar tabela photos:', error.message);
      
      // Tentar acessar outra tabela como fallback
      console.log('🔄 Tentando acessar tabela users...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (usersError) {
        throw usersError;
      }
      
      console.log('✅ Keep-alive executado via tabela users');
      return true;
    }
    
    console.log(`✅ Keep-alive executado com sucesso!`);
    console.log(`📊 Total de fotos no banco: ${count || 0}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro no keep-alive:');
    console.error('Mensagem:', error.message);
    console.error('Detalhes:', error.details || 'N/A');
    
    // Não fazer exit(1) para não quebrar se executado via cron
    return false;
  }
}

// Executar keep-alive
const success = await keepAlive();

if (success) {
  console.log('\n✅ Projeto Supabase mantido ativo!');
  console.log('💡 Execute este script a cada 6 dias para evitar pausas automáticas.');
  process.exit(0);
} else {
  console.log('\n⚠️  Keep-alive falhou, mas não é crítico.');
  console.log('💡 Verifique a conexão com o Supabase.');
  process.exit(0); // Exit 0 para não quebrar cron jobs
}

