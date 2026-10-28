-- =============================================================================
-- Se o login em produção diz "sem perfil": Auth existe, app_users não.
-- 1) Authentication → Users → copie o UUID do usuário
-- 2) Rode (ajuste e-mail/nome/UUID):
-- =============================================================================

INSERT INTO public.app_users (id, email, name, role)
VALUES (
  'COLE-O-UUID-DO-AUTH-AQUI',
  'robsonpaulista@hotmail.com',
  'Admin',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Conferência
SELECT id, email, name, role FROM public.app_users;
