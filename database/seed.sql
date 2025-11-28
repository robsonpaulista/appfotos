-- Dados de exemplo para desenvolvimento/testes
-- Execute apenas em ambiente de desenvolvimento

-- Limpar dados existentes (cuidado em produção!)
-- TRUNCATE TABLE photo_tags CASCADE;
-- TRUNCATE TABLE photos CASCADE;
-- TRUNCATE TABLE sync_events CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- Inserir usuário de teste
INSERT INTO users (google_id, email, name) VALUES
('test_google_id_123', 'test@example.com', 'Usuário Teste')
ON CONFLICT (google_id) DO NOTHING;

-- Nota: Dados de fotos serão adicionados automaticamente pelo processo de sincronização
