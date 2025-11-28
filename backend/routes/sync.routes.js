import express from 'express';
import ingestService from '../services/ingest.service.js';
import { supabase } from '../config/supabase.config.js';
import { setCredentials } from '../config/google.config.js';

const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('access_token, refresh_token, token_expiry')
      .eq('id', req.session.userId)
      .single();

    if (error) throw error;

    setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      expiry_date: new Date(user.token_expiry).getTime()
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Sessão inválida' });
  }
};

/**
 * POST /api/sync/start
 * Inicia sincronização das fotos do Google Drive
 */
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { analyzeWithVision = false, folderId = null, tags = null } = req.body;

    // Iniciar sincronização em background
    // Em produção, use uma fila (Bull, AWS SQS, etc)
    const userId = req.session.userId;

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=== NOVA SINCRONIZAÇÃO ===');
      console.log(`Usuário: ${userId}`);
      console.log(`Pasta: ${folderId || 'Todas as fotos'}`);
      if (tags) {
        console.log(`Tags automáticas:`);
        if (tags.person) console.log(`  - Pessoa: ${tags.person}`);
        if (tags.location) console.log(`  - Local: ${tags.location}`);
        if (tags.event) console.log(`  - Evento: ${tags.event}`);
      }
      console.log('========================\n');
    }

    // Responder imediatamente
    res.json({ 
      message: 'Sincronização iniciada',
      userId,
      folderId: folderId || 'all',
      tags
    });

    // Processar em background
    ingestService.syncPhotos(userId, analyzeWithVision, folderId, tags)
      .then(stats => {
        console.log(`✅ Sincronização concluída para usuário ${userId}:`, stats);
      })
      .catch(error => {
        console.error(`❌ Erro na sincronização para usuário ${userId}:`, error);
      });

  } catch (error) {
    console.error('Erro ao iniciar sincronização:', error);
    res.status(500).json({ error: 'Falha ao iniciar sincronização' });
  }
});

/**
 * GET /api/sync/status
 * Retorna status da sincronização atual
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { data: syncEvent, error } = await supabase
      .from('sync_events')
      .select('*')
      .eq('user_id', req.session.userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    if (!syncEvent) {
      return res.json({ status: 'never_synced' });
    }

    res.json(syncEvent);
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Falha ao obter status de sincronização' });
  }
});

/**
 * GET /api/sync/history
 * Retorna histórico de sincronizações
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('sync_events')
      .select('*')
      .eq('user_id', req.session.userId)
      .order('started_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Falha ao obter histórico de sincronizações' });
  }
});

/**
 * POST /api/sync/analyze
 * Analisa fotos ainda não processadas com Vision API
 */
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    // Responder imediatamente
    res.json({ 
      message: 'Análise iniciada',
      limit
    });

    // Processar em background
    const userId = req.session.userId;
    ingestService.analyzeUnprocessedPhotos(userId, limit)
      .then(stats => {
        console.log(`✅ Análise concluída para usuário ${userId}:`, stats);
      })
      .catch(error => {
        console.error(`❌ Erro na análise para usuário ${userId}:`, error);
      });

  } catch (error) {
    console.error('Erro ao iniciar análise:', error);
    res.status(500).json({ error: 'Falha ao iniciar análise' });
  }
});

/**
 * POST /api/sync/cancel
 * Cancela/reseta a sincronização em andamento
 */
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    console.log(`Cancelando sincronização para usuário ${userId}`);

    // Buscar sincronização em andamento
    const { data: syncEvent } = await supabase
      .from('sync_events')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['started', 'in_progress'])
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (syncEvent) {
      // Marcar como cancelada
      await supabase
        .from('sync_events')
        .update({
          status: 'failed',
          error_message: 'Cancelado pelo usuário',
          completed_at: new Date().toISOString()
        })
        .eq('id', syncEvent.id);

      console.log(`✅ Sincronização ${syncEvent.id} cancelada`);
    }

    res.json({ 
      message: 'Sincronização cancelada',
      success: true
    });
  } catch (error) {
    console.error('Erro ao cancelar sincronização:', error);
    res.status(500).json({ error: 'Falha ao cancelar sincronização' });
  }
});

export default router;

