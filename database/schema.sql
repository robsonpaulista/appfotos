-- PhotoFinder Database Schema
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de fotos
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    modified_at TIMESTAMP WITH TIME ZONE,
    gps_lat FLOAT,
    gps_lng FLOAT,
    location_name TEXT,
    person_tag TEXT,
    joy_likelihood TEXT,
    sorrow_likelihood TEXT,
    anger_likelihood TEXT,
    surprise_likelihood TEXT,
    faces_detected INTEGER DEFAULT 0,
    storage_url TEXT,
    thumbnail_url TEXT,
    analyzed BOOLEAN DEFAULT FALSE,
    user_id TEXT NOT NULL,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_photos_drive_id ON photos(drive_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_person_tag ON photos(person_tag);
CREATE INDEX IF NOT EXISTS idx_photos_joy_likelihood ON photos(joy_likelihood);
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(gps_lat, gps_lng);
CREATE INDEX IF NOT EXISTS idx_photos_analyzed ON photos(analyzed);

-- Criar tabela de tags personalizadas
CREATE TABLE IF NOT EXISTS photo_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    tag_type TEXT, -- 'person', 'event', 'location', 'custom'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag);

-- Criar tabela de usuários (para gerenciar tokens)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Criar tabela de eventos de sincronização
CREATE TABLE IF NOT EXISTS sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'started', 'in_progress', 'completed', 'failed'
    photos_processed INTEGER DEFAULT 0,
    photos_added INTEGER DEFAULT 0,
    photos_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_events_user_id ON sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON sync_events(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na tabela photos
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at na tabela users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View para busca simplificada
CREATE OR REPLACE VIEW photos_with_tags AS
SELECT 
    p.*,
    ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL) as tags
FROM photos p
LEFT JOIN photo_tags pt ON p.id = pt.photo_id
GROUP BY p.id;

-- Comentários nas tabelas
COMMENT ON TABLE photos IS 'Armazena metadados e análises das fotos do Google Drive';
COMMENT ON TABLE photo_tags IS 'Tags personalizadas associadas às fotos';
COMMENT ON TABLE users IS 'Usuários autenticados com tokens OAuth do Google';
COMMENT ON TABLE sync_events IS 'Histórico de sincronizações com o Google Drive';
