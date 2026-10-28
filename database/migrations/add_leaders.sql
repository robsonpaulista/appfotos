-- Banco de lideranças (foto de referência + vetor facial para busca no acervo)
-- Execute no SQL Editor do Supabase

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

COMMENT ON TABLE leaders IS 'Lideranças de referência (nome, cidade, foto) para busca facial no acervo';
COMMENT ON COLUMN leaders.photo_data IS 'Data URL base64 da foto de referência';
COMMENT ON COLUMN leaders.face_vector IS 'Descritor facial 128-d (Face-API) gerado no upload';
