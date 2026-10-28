/**
 * Copia um lote de fotos (+ face_descriptors) de legacy → public
 * para testar busca facial com lideranças.
 *
 * Uso: node scripts/restore-legacy-sample.js [limite=40]
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const libraryId = process.env.DRIVE_FOLDER_ID || 'library';
const limit = Math.min(parseInt(process.argv[2] || '40', 10), 200);

if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_KEY faltando no .env');
  process.exit(1);
}

const publicDb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const legacyDb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'legacy' },
});

async function count(client, table) {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return { error: error.message, count: null };
  return { count };
}

async function main() {
  console.log('Library user_id (DRIVE_FOLDER_ID):', libraryId);
  console.log('Limite de fotos:', limit);

  console.log('\n--- Contagens public ---');
  for (const t of ['photos', 'face_descriptors', 'leaders']) {
    console.log(t, await count(publicDb, t));
  }

  console.log('\n--- Contagens legacy ---');
  for (const t of ['photos', 'face_descriptors']) {
    console.log(t, await count(legacyDb, t));
  }

  // Preferir fotos que já têm descritor facial
  const { data: legacyFaces, error: facesErr } = await legacyDb
    .from('face_descriptors')
    .select('id, photo_id, face_vector, bounding_box, confidence, person_id, created_at, updated_at')
    .not('face_vector', 'is', null)
    .limit(limit * 5);

  if (facesErr) {
    console.error('\nNão consegui ler legacy.face_descriptors:', facesErr.message);
    console.error(
      'Se o schema legacy não está exposto na API, rode no SQL Editor o arquivo:\n  database/migrations/restore-legacy-sample.sql'
    );
    process.exit(1);
  }

  const photoIds = [...new Set((legacyFaces || []).map((f) => f.photo_id))].slice(0, limit);
  console.log(`\nFotos candidatas com rosto indexado: ${photoIds.length}`);

  if (photoIds.length === 0) {
    // Fallback: qualquer foto do legacy
    const { data: anyPhotos, error } = await legacyDb
      .from('photos')
      .select('*')
      .limit(limit);
    if (error) {
      console.error('Erro ao ler legacy.photos:', error.message);
      process.exit(1);
    }
    console.log(`Sem descritores; copiando ${anyPhotos?.length || 0} fotos sem faces (será preciso indexar).`);
    await upsertPhotos(anyPhotos || []);
    return;
  }

  const { data: photos, error: photosErr } = await legacyDb
    .from('photos')
    .select('*')
    .in('id', photoIds);

  if (photosErr) {
    console.error('Erro ao ler legacy.photos:', photosErr.message);
    process.exit(1);
  }

  await upsertPhotos(photos || []);

  const facesForPhotos = (legacyFaces || []).filter((f) => photoIds.includes(f.photo_id));
  // person_id pode apontar para legacy.persons — zerar para evitar FK quebrada
  const faceRows = facesForPhotos.map((f) => ({
    id: f.id,
    photo_id: f.photo_id,
    face_vector: f.face_vector,
    bounding_box: f.bounding_box,
    confidence: f.confidence,
    person_id: null,
    created_at: f.created_at,
    updated_at: f.updated_at,
  }));

  if (faceRows.length > 0) {
    const { error: upsertFacesErr } = await publicDb
      .from('face_descriptors')
      .upsert(faceRows, { onConflict: 'id' });
    if (upsertFacesErr) {
      console.error('Erro ao inserir face_descriptors:', upsertFacesErr.message);
      process.exit(1);
    }
    console.log(`✅ ${faceRows.length} face_descriptors restaurados`);
  }

  console.log('\n--- Contagens public (após) ---');
  for (const t of ['photos', 'face_descriptors', 'leaders']) {
    console.log(t, await count(publicDb, t));
  }

  const { data: leaders } = await publicDb
    .from('leaders')
    .select('id, name, city, role_title')
    .limit(10);
  console.log('\nLideranças:', leaders);
}

async function upsertPhotos(photos) {
  if (!photos.length) {
    console.log('Nenhuma foto para copiar.');
    return;
  }
  const rows = photos.map((p) => ({
    ...p,
    user_id: libraryId,
  }));
  const { error } = await publicDb.from('photos').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Erro ao inserir photos:', error.message);
    process.exit(1);
  }
  console.log(`✅ ${rows.length} photos restauradas (user_id=${libraryId})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
