-- Adiciona suporte para reconhecimento facial
-- Execute este script no SQL Editor do Supabase

-- Tabela para pessoas identificadas (CRIAR PRIMEIRO)
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_count INTEGER DEFAULT 0, -- contador de fotos com essa pessoa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar descritores faciais (vetores)
CREATE TABLE IF NOT EXISTS face_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  face_vector FLOAT[], -- vetor de 128 dimensões do Face-API.js
  bounding_box JSONB, -- {x, y, width, height}
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  confidence FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_face_descriptors_photo_id ON face_descriptors(photo_id);
CREATE INDEX IF NOT EXISTS idx_face_descriptors_person_id ON face_descriptors(person_id);
CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(name);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_face_descriptors_updated_at
BEFORE UPDATE ON face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at
BEFORE UPDATE ON persons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar contador de fotos de uma pessoa
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
CREATE TRIGGER update_person_photo_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_person_photo_count();

-- Comentários
COMMENT ON TABLE face_descriptors IS 'Armazena vetores faciais extraídos das fotos para reconhecimento';
COMMENT ON TABLE persons IS 'Pessoas identificadas no sistema';
COMMENT ON COLUMN face_descriptors.face_vector IS 'Vetor de 128 dimensões do Face-API.js para comparação';
COMMENT ON COLUMN face_descriptors.bounding_box IS 'Coordenadas do rosto na imagem (x, y, width, height)';
COMMENT ON COLUMN persons.photo_count IS 'Número de fotos distintas onde a pessoa aparece';

