-- Script para resetar sincronizações travadas
-- Execute apenas se o botão de sincronizar ficar "rodando" eternamente

-- Marcar todas as sincronizações em andamento como canceladas
UPDATE sync_events 
SET 
  status = 'failed',
  error_message = 'Resetado manualmente',
  completed_at = NOW()
WHERE status IN ('started', 'in_progress');

-- Verificar resultado
SELECT id, user_id, status, photos_processed, started_at, completed_at 
FROM sync_events 
ORDER BY started_at DESC 
LIMIT 5;

