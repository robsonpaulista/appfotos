-- ⚠️ CUIDADO: Este script APAGA TODOS OS DADOS!
-- Use apenas em desenvolvimento/testes

-- Limpar todas as fotos e tags
TRUNCATE TABLE photo_tags CASCADE;
TRUNCATE TABLE photos CASCADE;
TRUNCATE TABLE sync_events CASCADE;

-- Resetar sequências (se houver)
-- Deixar tabela de usuários intacta (mantém login)

-- Verificar resultado
SELECT 
  (SELECT COUNT(*) FROM photos) as total_fotos,
  (SELECT COUNT(*) FROM photo_tags) as total_tags,
  (SELECT COUNT(*) FROM sync_events) as total_syncs,
  (SELECT COUNT(*) FROM users) as total_usuarios;

-- Deve retornar: 0, 0, 0, 1 (ou mais se tiver mais usuários)

