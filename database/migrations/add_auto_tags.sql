-- Adicionar campos de auto-tags nas fotos
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas para tags automáticas
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS event_year INTEGER,
ADD COLUMN IF NOT EXISTS event_month INTEGER,
ADD COLUMN IF NOT EXISTS event_city TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS folder_path TEXT;

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_photos_event_year ON photos(event_year);
CREATE INDEX IF NOT EXISTS idx_photos_event_month ON photos(event_month);
CREATE INDEX IF NOT EXISTS idx_photos_event_city ON photos(event_city);
CREATE INDEX IF NOT EXISTS idx_photos_event_type ON photos(event_type);

-- Função para obter estatísticas
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
        SELECT event_year, COUNT(*) as count
        FROM photos
        WHERE user_id = p_user_id AND event_year IS NOT NULL
        GROUP BY event_year
        ORDER BY event_year DESC
      ) years
    ),
    'by_city', (
      SELECT json_object_agg(event_city, count)
      FROM (
        SELECT event_city, COUNT(*) as count
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
        SELECT event_type, COUNT(*) as count
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

-- Comentários
COMMENT ON COLUMN photos.event_year IS 'Ano extraído do nome da pasta';
COMMENT ON COLUMN photos.event_month IS 'Mês extraído do nome da pasta';
COMMENT ON COLUMN photos.event_city IS 'Cidade extraída do nome da pasta';
COMMENT ON COLUMN photos.event_type IS 'Tipo de evento extraído do nome da pasta';
COMMENT ON COLUMN photos.folder_path IS 'Caminho completo da pasta no Drive';

