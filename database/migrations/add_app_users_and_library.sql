-- Migration: app_users (Supabase Auth) + biblioteca compartilhada do Drive
-- Execute no SQL Editor do Supabase após ativar Auth (email/password)

-- Perfis de usuários do app (id = auth.users.id)
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

COMMENT ON TABLE app_users IS 'Perfis do app (e-mail/senha via Supabase Auth). Sem tokens Google.';
COMMENT ON COLUMN app_users.role IS 'admin = sync/config; viewer = galeria';

-- Coluna opcional para rastrear origem da pasta Drive (biblioteca)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

CREATE INDEX IF NOT EXISTS idx_photos_drive_folder_id ON photos(drive_folder_id);

-- Nota: photos.user_id passa a armazenar o ID da biblioteca (DRIVE_FOLDER_ID),
-- não o id do usuário logado. Todos os viewers veem a mesma galeria.
COMMENT ON COLUMN photos.user_id IS 'ID da biblioteca/pasta Drive (DRIVE_FOLDER_ID), compartilhado entre usuários do app';
