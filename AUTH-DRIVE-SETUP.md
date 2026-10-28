# Setup: Login do app + Drive com Service Account

O PhotoFinder separa **quem usa o app** (e-mail/senha) de **onde estão as fotos** (Google Drive via service account).

## Visão geral

| Papel | Como autentica | O que acessa |
|-------|----------------|--------------|
| Viewer | E-mail/senha do app | Galeria (biblioteca compartilhada) |
| Admin | E-mail/senha do app | Galeria + sync/config |
| Drive | Service account (servidor) | Pasta compartilhada no Gmail |

Ninguém precisa da senha da conta Google do Drive.

## 1. Service account (Google Cloud)

1. No [Google Cloud Console](https://console.cloud.google.com/), crie ou escolha um projeto.
2. Ative a **Google Drive API** (e Vision API, se for usar análise).
3. **IAM e administrador → Contas de serviço → Criar**.
4. Crie uma chave JSON e guarde o arquivo com segurança.
5. Anote o e-mail da SA (`algo@projeto.iam.gserviceaccount.com`).

## 2. Compartilhar a pasta no Gmail

1. No Google Drive da conta das fotos, abra a pasta raiz do acervo.
2. Compartilhar → adicione o e-mail da service account como **Leitor** (ou Editor, se precisar).
3. Copie o ID da pasta na URL:  
   `https://drive.google.com/drive/folders/ESTE_E_O_ID`

## 3. Variáveis de ambiente

Backend (`.env`) e frontend Vercel / `.env.local`:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...   # necessário para criar usuários e ler JWT

DRIVE_FOLDER_ID=id_da_pasta_compartilhada

# Uma das duas:
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# ou
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

Templates: [backend/env.template](backend/env.template), [frontend/env.template](frontend/env.template).

## 4. Supabase Auth + schema limpo

**No mesmo projeto (sem criar outro):** use o swap — dados antigos vão para `legacy`, tabelas novas vazias em `public`.

1. **Authentication → Providers → Email** (habilitar e-mail/senha).
2. SQL Editor → execute [`database/swap-to-clean-tables.sql`](database/swap-to-clean-tables.sql).
3. Crie o **primeiro admin** (Auth + perfil):

```sql
-- Depois de criar o usuário em Authentication → Users (Add user),
-- copie o UUID e rode:
INSERT INTO app_users (id, email, name, role)
VALUES ('UUID-DO-AUTH-USER', 'admin@empresa.com', 'Admin', 'admin');
```

4. Quando não precisar mais do backup: `DROP SCHEMA legacy CASCADE;`

(Alternativa: projeto novo + [`schema-clean.sql`](database/schema-clean.sql).)

Ou, após já existir um admin logado:

```http
POST /api/auth/users
{ "email": "viewer@empresa.com", "password": "...", "name": "Nome", "role": "viewer" }
```

## 5. Fluxo operacional

1. Admin faz login no app (e-mail/senha).
2. Admin dispara **Sincronizar** (só aparece para `role = admin`).
3. O servidor lê a pasta `DRIVE_FOLDER_ID` com a service account e grava metadados no Supabase (`photos.user_id` = `DRIVE_FOLDER_ID`).
4. Viewers fazem login e veem a mesma galeria — sem Google OAuth.

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `Service account não configurada` | Falta JSON/path nas envs |
| `DRIVE_FOLDER_ID não configurado` | Env ausente |
| 403 / file not found no Drive | Pasta não compartilhada com o e-mail da SA |
| Login 403 “sem perfil” | Usuário existe no Auth mas não em `app_users` |
| Sync 403 | Usuário não é `admin` |
