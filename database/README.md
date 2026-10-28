# PhotoFinder - Database

## Setup no Supabase

### Reformulação no mesmo projeto (sem criar projeto novo)

1. Ative **Authentication → Email**
2. SQL Editor → execute **`swap-to-clean-tables.sql`**
   - Move tabelas atuais (com dados) para o schema `legacy`
   - Recria as mesmas tabelas em `public`, **vazias**
   - O app continua usando os mesmos nomes (`photos`, `app_users`, …)
3. Crie o usuário admin em Auth → Users e o `INSERT` em `app_users` (final do SQL)
4. Quando não precisar do backup: `DROP SCHEMA legacy CASCADE;`

### Projeto Supabase novo (opcional)

1. Crie um **novo projeto** no Supabase
2. Ative **Authentication → Email**
3. SQL Editor → execute **`schema-clean.sql`**
4. Crie o usuário admin + `INSERT` em `app_users`
5. Atualize `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY` no `.env`

### Setup legado (projeto antigo)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **SQL Editor**
4. Execute o arquivo `schema.sql` completo (+ migrations em `migrations/` se precisar)
5. (Opcional) Execute `seed.sql` para dados de teste

## Estrutura

### Tabela `photos`

Armazena todos os metadados das fotos:

- **Identificação**: `id`, `drive_id`, `name`
- **Metadados**: `width`, `height`, `camera_make`, `camera_model`
- **Datas**: `created_at`, `modified_at`
- **Localização**: `gps_lat`, `gps_lng`, `location_name`
- **Pessoas**: `person_tag`
- **Emoções**: `joy_likelihood`, `expression`, etc.
- **Rostos**: `faces_detected`, `detection_confidence`

### Views

- `photos_smiling`: Fotos com pessoas sorrindo
- `photos_group`: Fotos com 3+ pessoas
- `photos_with_location`: Fotos com GPS

### Funções

- `photos_within_radius(lat, lng, radius_km)`: Busca fotos em um raio específico

## Índices

Otimizados para:
- Busca por pessoa
- Busca por local
- Busca por expressão/emoção
- Busca geográfica (raio)
- Busca por data
- Busca de texto completo

## Obter credenciais

No Supabase:
1. Vá em **Settings** → **API**
2. Copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_KEY` (use apenas no backend!)

## Queries úteis

```sql
-- Fotos sorrindo em 2024
SELECT * FROM photos
WHERE joy_likelihood IN ('LIKELY', 'VERY_LIKELY')
  AND EXTRACT(YEAR FROM created_at) = 2024;

-- Fotos de uma pessoa em um local
SELECT * FROM photos
WHERE person_tag ILIKE '%Maria%'
  AND location_name ILIKE '%Teresina%';

-- Fotos em um raio de 5km de um ponto
SELECT * FROM photos_within_radius(-5.0892, -42.8019, 5);

-- Estatísticas gerais
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN faces_detected > 0 THEN 1 END) as com_rostos,
    AVG(faces_detected) as media_rostos,
    COUNT(DISTINCT person_tag) as pessoas_unicas
FROM photos;
```

