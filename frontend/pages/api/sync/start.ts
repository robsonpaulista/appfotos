import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * POST /api/sync/start
 * Inicia sincronização das fotos do Google Drive
 * Adaptado para Vercel: processa em chunks pequenos para evitar timeout
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { analyzeWithVision = false, folderId = null, tags = null } = req.body;
    const userId = auth.userId;

    // Criar evento de sincronização
    const { data: syncEvent, error: syncError } = await supabase
      .from('sync_events')
      .insert({
        user_id: userId,
        status: 'started',
        started_at: new Date().toISOString(),
        photos_processed: 0,
        photos_added: 0,
        photos_updated: 0
      })
      .select()
      .single();

    if (syncError) {
      throw syncError;
    }

    // Responder imediatamente (importante para Vercel)
    res.json({
      message: 'Sincronização iniciada',
      syncId: syncEvent.id,
      userId,
      folderId: folderId || 'all',
      tags
    });

    // IMPORTANTE: No Vercel, não podemos processar em background
    // A sincronização será feita em chunks via chamadas sequenciais do frontend
    // Ou usar Vercel Cron Jobs para processar em background
    
  } catch (error: any) {
    console.error('Erro ao iniciar sincronização:', error);
    res.status(500).json({ error: 'Falha ao iniciar sincronização' });
  }
}

