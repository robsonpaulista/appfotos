# PhotoFinder - Database

## Setup no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **SQL Editor**
4. Execute o arquivo `schema.sql` completo
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

