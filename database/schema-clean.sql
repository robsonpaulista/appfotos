-- =============================================================================
-- PhotoFinder — schema limpo (estrutura apenas, sem dados)
-- =============================================================================
-- Use este arquivo para:
--   A) Novo projeto Supabase (SQL Editor → colar e Run)
--   B) Base existente: preferível criar projeto novo; este script NÃO apaga dados
--
-- Pré-requisito: Authentication → Email habilitado (login e-mail/senha)
-- Depois: criar usuário em Auth → Users e inserir em app_users (ver final)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Função utilitária
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Perfis do app (id = auth.users.id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE app_users IS 'Perfis do app (Supabase Auth e-mail/senha). Sem tokens Google.';
COMMENT ON COLUMN app_users.role IS 'admin = sync/config; viewer = galeria';

-- -----------------------------------------------------------------------------
-- Fotos (metadados). user_id = DRIVE_FOLDER_ID (biblioteca compartilhada)
-- -----------------------------------------------------------------------------
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
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  location_name TEXT,
  person_tag TEXT,
  role_tag TEXT,
  joy_likelihood TEXT,
  sorrow_likelihood TEXT,
  anger_likelihood TEXT,
  surprise_likelihood TEXT,
  faces_detected INTEGER DEFAULT 0,
  storage_url TEXT,
  thumbnail_url TEXT,
  analyzed BOOLEAN DEFAULT FALSE,
  user_id TEXT NOT NULL,
  drive_folder_id TEXT,
  event_year INTEGER,
  event_month INTEGER,
  event_city TEXT,
  event_type TEXT,
  folder_path TEXT,
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_drive_id ON photos(drive_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_drive_folder_id ON photos(drive_folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_person_tag ON photos(person_tag);
CREATE INDEX IF NOT EXISTS idx_photos_role_tag ON photos(role_tag);
CREATE INDEX IF NOT EXISTS idx_photos_joy_likelihood ON photos(joy_likelihood);
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(gps_lat, gps_lng);
CREATE INDEX IF NOT EXISTS idx_photos_analyzed ON photos(analyzed);
CREATE INDEX IF NOT EXISTS idx_photos_event_year ON photos(event_year);
CREATE INDEX IF NOT EXISTS idx_photos_event_month ON photos(event_month);
CREATE INDEX IF NOT EXISTS idx_photos_event_city ON photos(event_city);
CREATE INDEX IF NOT EXISTS idx_photos_event_type ON photos(event_type);

DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE photos IS 'Metadados e análises das fotos do Drive (via service account)';
COMMENT ON COLUMN photos.user_id IS 'ID da biblioteca = DRIVE_FOLDER_ID (compartilhado entre usuários do app)';
COMMENT ON COLUMN photos.drive_folder_id IS 'Pasta raiz configurada no sync';
COMMENT ON COLUMN photos.role_tag IS 'Título/cargo associado à foto';
COMMENT ON COLUMN photos.event_year IS 'Ano extraído do nome da pasta';
COMMENT ON COLUMN photos.event_month IS 'Mês extraído do nome da pasta';
COMMENT ON COLUMN photos.event_city IS 'Cidade extraída do nome da pasta';
COMMENT ON COLUMN photos.event_type IS 'Tipo de evento extraído do nome da pasta';
COMMENT ON COLUMN photos.folder_path IS 'Caminho da pasta no Drive';

-- -----------------------------------------------------------------------------
-- Tags personalizadas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tag_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag);

COMMENT ON TABLE photo_tags IS 'Tags personalizadas (person, event, location, custom)';

-- -----------------------------------------------------------------------------
-- Histórico de sync (user_id = admin que disparou)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  photos_processed INTEGER DEFAULT 0,
  photos_added INTEGER DEFAULT 0,
  photos_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_events_user_id ON sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON sync_events(status);

COMMENT ON TABLE sync_events IS 'Histórico de sincronizações com o Google Drive';

-- -----------------------------------------------------------------------------
-- Reconhecimento facial
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(name);

DROP TRIGGER IF EXISTS update_persons_updated_at ON persons;
CREATE TRIGGER update_persons_updated_at
BEFORE UPDATE ON persons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS face_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  face_vector FLOAT[],
  bounding_box JSONB,
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  confidence FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_face_descriptors_photo_id ON face_descriptors(photo_id);
CREATE INDEX IF NOT EXISTS idx_face_descriptors_person_id ON face_descriptors(person_id);

DROP TRIGGER IF EXISTS update_face_descriptors_updated_at ON face_descriptors;
CREATE TRIGGER update_face_descriptors_updated_at
BEFORE UPDATE ON face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_person_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.person_id IS NOT NULL THEN
      UPDATE persons
      SET photo_count = (
        SELECT COUNT(DISTINCT photo_id)
        FROM face_descriptors
        WHERE person_id = NEW.person_id
      )
      WHERE id = NEW.person_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.person_id IS NOT NULL THEN
      UPDATE persons
      SET photo_count = (
        SELECT COUNT(DISTINCT photo_id)
        FROM face_descriptors
        WHERE person_id = OLD.person_id
      )
      WHERE id = OLD.person_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_person_photo_count_trigger ON face_descriptors;
CREATE TRIGGER update_person_photo_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_person_photo_count();

COMMENT ON TABLE face_descriptors IS 'Vetores faciais para reconhecimento';
COMMENT ON TABLE persons IS 'Pessoas identificadas no sistema';

-- -----------------------------------------------------------------------------
-- Lideranças (foto de referência para busca no acervo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  role_title TEXT,
  photo_data TEXT,
  face_vector FLOAT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaders_name ON leaders(name);
CREATE INDEX IF NOT EXISTS idx_leaders_city ON leaders(city);

DROP TRIGGER IF EXISTS update_leaders_updated_at ON leaders;
CREATE TRIGGER update_leaders_updated_at
BEFORE UPDATE ON leaders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE leaders IS 'Lideranças de referência para busca facial no acervo';

-- -----------------------------------------------------------------------------
-- View e stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW photos_with_tags AS
SELECT
  p.*,
  ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL) AS tags
FROM photos p
LEFT JOIN photo_tags pt ON p.id = pt.photo_id
GROUP BY p.id;

CREATE OR REPLACE FUNCTION get_photo_stats(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'with_faces', COUNT(*) FILTER (WHERE faces_detected > 0),
    'analyzed', COUNT(*) FILTER (WHERE analyzed = true),
    'with_location', COUNT(*) FILTER (WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL),
    'by_year', (
      SELECT json_object_agg(event_year, count)
      FROM (
        SELECT event_year, COUNT(*) AS count
        FROM photos
        WHERE user_id = p_user_id AND event_year IS NOT NULL
        GROUP BY event_year
        ORDER BY event_year DESC
      ) years
    ),
    'by_city', (
      SELECT json_object_agg(event_city, count)
      FROM (
        SELECT event_city, COUNT(*) AS count
        FROM photos
        WHERE user_id = p_user_id AND event_city IS NOT NULL
        GROUP BY event_city
        ORDER BY count DESC
        LIMIT 10
      ) cities
    ),
    'by_type', (
      SELECT json_object_agg(event_type, count)
      FROM (
        SELECT event_type, COUNT(*) AS count
        FROM photos
        WHERE user_id = p_user_id AND event_type IS NOT NULL
        GROUP BY event_type
        ORDER BY count DESC
      ) types
    )
  ) INTO result
  FROM photos
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Após rodar este script:
-- 1. Authentication → Users → Add user (e-mail/senha, confirme e-mail se pedir)
-- 2. Copie o UUID do usuário e rode:
--
-- INSERT INTO app_users (id, email, name, role)
-- VALUES ('UUID-AQUI', 'admin@empresa.com', 'Admin', 'admin');
--
-- 3. Atualize SUPABASE_URL / keys no .env para o projeto novo (se criou outro)
-- =============================================================================
