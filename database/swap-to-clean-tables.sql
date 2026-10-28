-- =============================================================================
-- PhotoFinder — trocar tabelas atuais por cópias VAZIAS (mesma estrutura)
-- =============================================================================
-- O que faz:
--   1. Move tabelas atuais (com dados) para o schema "legacy"  → backup
--   2. Recria as mesmas tabelas em public, VAZIAS
--
-- O app NÃO muda: continua usando photos, app_users, etc.
-- Dados antigos ficam em: legacy.photos, legacy.users, ...
--
-- Execute no SQL Editor do Supabase (uma vez).
-- Pré-requisito: Authentication → Email habilitado.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS legacy;

-- -----------------------------------------------------------------------------
-- 1) Remover objetos dependentes em public (view / triggers recriados depois)
--    DROP TRIGGER exige que a tabela exista — por isso o IF EXISTS na tabela
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.photos_with_tags CASCADE;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('face_descriptors', 'update_person_photo_count_trigger'),
      ('face_descriptors', 'update_face_descriptors_updated_at'),
      ('persons', 'update_persons_updated_at'),
      ('photos', 'update_photos_updated_at'),
      ('users', 'update_users_updated_at'),
      ('app_users', 'update_app_users_updated_at')
    ) AS t(tbl, trg)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = r.tbl
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', r.trg, r.tbl);
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Mover tabelas existentes para legacy (só se existirem em public)
--    Se já existir legacy.photos etc., renomeia com sufixo de timestamp
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  dest text;
  ts text := to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'face_descriptors',
    'persons',
    'photo_tags',
    'photos',
    'sync_events',
    'app_users',
    'users'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      dest := t;
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'legacy' AND table_name = t
      ) THEN
        dest := t || '_bak_' || ts;
      END IF;

      EXECUTE format('ALTER TABLE public.%I SET SCHEMA legacy', t);
      IF dest <> t THEN
        EXECUTE format('ALTER TABLE legacy.%I RENAME TO %I', t, dest);
      END IF;

      RAISE NOTICE 'Movido public.% → legacy.%', t, dest;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Função utilitária
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4) Recriar tabelas VAZIAS (estrutura atual / reformulação)
-- -----------------------------------------------------------------------------

CREATE TABLE public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_role ON public.app_users(role);

CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.photos (
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

CREATE INDEX idx_photos_drive_id ON public.photos(drive_id);
CREATE INDEX idx_photos_user_id ON public.photos(user_id);
CREATE INDEX idx_photos_drive_folder_id ON public.photos(drive_folder_id);
CREATE INDEX idx_photos_created_at ON public.photos(created_at);
CREATE INDEX idx_photos_person_tag ON public.photos(person_tag);
CREATE INDEX idx_photos_role_tag ON public.photos(role_tag);
CREATE INDEX idx_photos_joy_likelihood ON public.photos(joy_likelihood);
CREATE INDEX idx_photos_location ON public.photos(gps_lat, gps_lng);
CREATE INDEX idx_photos_analyzed ON public.photos(analyzed);
CREATE INDEX idx_photos_event_year ON public.photos(event_year);
CREATE INDEX idx_photos_event_month ON public.photos(event_month);
CREATE INDEX idx_photos_event_city ON public.photos(event_city);
CREATE INDEX idx_photos_event_type ON public.photos(event_type);

CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tag_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photo_tags_photo_id ON public.photo_tags(photo_id);
CREATE INDEX idx_photo_tags_tag ON public.photo_tags(tag);

CREATE TABLE public.sync_events (
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

CREATE INDEX idx_sync_events_user_id ON public.sync_events(user_id);
CREATE INDEX idx_sync_events_status ON public.sync_events(status);

CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_persons_name ON public.persons(name);

CREATE TRIGGER update_persons_updated_at
BEFORE UPDATE ON public.persons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.face_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  face_vector FLOAT[],
  bounding_box JSONB,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  confidence FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_face_descriptors_photo_id ON public.face_descriptors(photo_id);
CREATE INDEX idx_face_descriptors_person_id ON public.face_descriptors(person_id);

CREATE TRIGGER update_face_descriptors_updated_at
BEFORE UPDATE ON public.face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_person_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.person_id IS NOT NULL THEN
      UPDATE public.persons
      SET photo_count = (
        SELECT COUNT(DISTINCT photo_id)
        FROM public.face_descriptors
        WHERE person_id = NEW.person_id
      )
      WHERE id = NEW.person_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.person_id IS NOT NULL THEN
      UPDATE public.persons
      SET photo_count = (
        SELECT COUNT(DISTINCT photo_id)
        FROM public.face_descriptors
        WHERE person_id = OLD.person_id
      )
      WHERE id = OLD.person_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_person_photo_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_person_photo_count();

CREATE OR REPLACE VIEW public.photos_with_tags AS
SELECT
  p.*,
  ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL) AS tags
FROM public.photos p
LEFT JOIN public.photo_tags pt ON p.id = pt.photo_id
GROUP BY p.id;

CREATE OR REPLACE FUNCTION public.get_photo_stats(p_user_id TEXT)
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
        FROM public.photos
        WHERE user_id = p_user_id AND event_year IS NOT NULL
        GROUP BY event_year
        ORDER BY event_year DESC
      ) years
    ),
    'by_city', (
      SELECT json_object_agg(event_city, count)
      FROM (
        SELECT event_city, COUNT(*) AS count
        FROM public.photos
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
        FROM public.photos
        WHERE user_id = p_user_id AND event_type IS NOT NULL
        GROUP BY event_type
        ORDER BY count DESC
      ) types
    )
  ) INTO result
  FROM public.photos
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.app_users IS 'Perfis do app (Supabase Auth). Sem tokens Google.';
COMMENT ON TABLE public.photos IS 'Metadados das fotos — user_id = DRIVE_FOLDER_ID';
COMMENT ON SCHEMA legacy IS 'Backup das tabelas antigas com dados (pré-reformulação)';

-- =============================================================================
-- Depois deste script:
-- 1. Authentication → Users → Add user (admin)
-- 2. INSERT INTO app_users (id, email, name, role)
--    VALUES ('UUID-DO-AUTH', 'seu@email.com', 'Admin', 'admin');
--
-- Consultar lixo antigo (se precisar):
--   SELECT COUNT(*) FROM legacy.photos;
--
-- Apagar backup quando não precisar mais:
--   DROP SCHEMA legacy CASCADE;
-- =============================================================================
