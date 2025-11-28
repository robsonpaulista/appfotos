-- Adiciona coluna para cargo/role nas fotos
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS role_tag TEXT;

-- Comentário explicativo
COMMENT ON COLUMN photos.role_tag IS 'Título/cargo associado à foto';

