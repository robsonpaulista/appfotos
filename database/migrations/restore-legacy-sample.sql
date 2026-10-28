-- =============================================================================
-- Restaura amostra (até 80 fotos COM rosto) de legacy → public
-- para testar busca facial com a liderança cadastrada.
--
-- user_id = 'library' (fallback do backend quando DRIVE_FOLDER_ID não está no .env)
--
-- Rode no SQL Editor do Supabase.
-- =============================================================================

DO $$
DECLARE
  library_id text := 'library';
  n_photos int;
  n_faces int;
  legacy_photos int;
  legacy_faces int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'legacy'
  ) THEN
    RAISE EXCEPTION 'Schema legacy não existe. O swap pode não ter sido executado.';
  END IF;

  SELECT COUNT(*) INTO legacy_photos FROM legacy.photos;
  SELECT COUNT(*) INTO legacy_faces
  FROM legacy.face_descriptors
  WHERE face_vector IS NOT NULL;

  RAISE NOTICE 'legacy.photos=%  legacy.faces_com_vetor=%', legacy_photos, legacy_faces;

  IF legacy_photos = 0 THEN
    RAISE EXCEPTION 'legacy.photos está vazio — não há o que restaurar.';
  END IF;

  CREATE TEMP TABLE tmp_sample_ids ON COMMIT DROP AS
  SELECT DISTINCT photo_id AS id
  FROM legacy.face_descriptors
  WHERE face_vector IS NOT NULL
    AND photo_id IS NOT NULL
  LIMIT 80;

  IF (SELECT COUNT(*) FROM tmp_sample_ids) = 0 THEN
    INSERT INTO tmp_sample_ids
    SELECT id FROM legacy.photos LIMIT 80;
    RAISE NOTICE 'Sem faces no legacy — copiando fotos sem descritor.';
  END IF;

  -- Copia coluna a coluna via JSON para tolerar diferenças de schema
  INSERT INTO public.photos (
    id, drive_id, name, mime_type, width, height, size_bytes,
    created_at, modified_at, gps_lat, gps_lng, location_name,
    person_tag, role_tag, joy_likelihood, sorrow_likelihood, anger_likelihood,
    surprise_likelihood, faces_detected, storage_url, thumbnail_url,
    analyzed, user_id, drive_folder_id,
    event_year, event_month, event_city, event_type, folder_path,
    indexed_at, updated_at
  )
  SELECT
    (to_jsonb(p)->>'id')::uuid,
    p.drive_id,
    p.name,
    p.mime_type,
    p.width,
    p.height,
    p.size_bytes,
    p.created_at,
    p.modified_at,
    p.gps_lat,
    p.gps_lng,
    p.location_name,
    p.person_tag,
    to_jsonb(p)->>'role_tag',
    p.joy_likelihood,
    p.sorrow_likelihood,
    p.anger_likelihood,
    p.surprise_likelihood,
    COALESCE(p.faces_detected, 0),
    p.storage_url,
    p.thumbnail_url,
    COALESCE(p.analyzed, false),
    library_id,
    to_jsonb(p)->>'drive_folder_id',
    NULLIF(to_jsonb(p)->>'event_year', '')::int,
    NULLIF(to_jsonb(p)->>'event_month', '')::int,
    to_jsonb(p)->>'event_city',
    to_jsonb(p)->>'event_type',
    to_jsonb(p)->>'folder_path',
    COALESCE(p.indexed_at, NOW()),
    COALESCE(p.updated_at, NOW())
  FROM legacy.photos p
  WHERE p.id IN (SELECT id FROM tmp_sample_ids)
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    thumbnail_url = COALESCE(EXCLUDED.thumbnail_url, public.photos.thumbnail_url),
    updated_at = NOW();

  INSERT INTO public.face_descriptors (
    id, photo_id, face_vector, bounding_box, confidence, person_id, created_at, updated_at
  )
  SELECT
    f.id,
    f.photo_id,
    f.face_vector,
    f.bounding_box,
    COALESCE(f.confidence, 0),
    NULL,
    COALESCE(f.created_at, NOW()),
    COALESCE(f.updated_at, NOW())
  FROM legacy.face_descriptors f
  WHERE f.photo_id IN (SELECT id FROM tmp_sample_ids)
    AND f.face_vector IS NOT NULL
  ON CONFLICT (id) DO UPDATE SET
    face_vector = EXCLUDED.face_vector,
    bounding_box = EXCLUDED.bounding_box,
    confidence = EXCLUDED.confidence,
    person_id = NULL;

  SELECT COUNT(*) INTO n_photos FROM public.photos;
  SELECT COUNT(*) INTO n_faces FROM public.face_descriptors;
  RAISE NOTICE 'OK — public.photos=%  public.face_descriptors=%', n_photos, n_faces;
END $$;

SELECT id, name, role_title, city, (face_vector IS NOT NULL) AS tem_vetor
FROM public.leaders;

SELECT COUNT(*) AS fotos_public FROM public.photos;
SELECT COUNT(*) AS faces_public FROM public.face_descriptors;
