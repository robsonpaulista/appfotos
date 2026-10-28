/**
 * Testa busca por liderança (Jadyel) contra face_descriptors em public.
 * Uso: node scripts/test-leader-search.js [threshold=0.55]
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import faceRecognitionService from '../services/faceRecognition.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const threshold = parseFloat(process.argv[2] || '0.55');
const libraryId = process.env.DRIVE_FOLDER_ID || 'library';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: leader, error } = await sb
  .from('leaders')
  .select('*')
  .ilike('name', '%jadyel%')
  .maybeSingle();

if (error || !leader) {
  console.error('Liderança não encontrada:', error?.message);
  process.exit(1);
}

console.log('Líder:', leader.name, leader.role_title);
console.log('Vetor:', leader.face_vector?.length, 'dims');
console.log('Library filter user_id:', libraryId);
console.log('Threshold:', threshold);

const { count: faces } = await sb
  .from('face_descriptors')
  .select('*', { count: 'exact', head: true });
const { count: photos } = await sb
  .from('photos')
  .select('*', { count: 'exact', head: true });

console.log('Acervo: fotos=%d faces=%d', photos || 0, faces || 0);

if (!faces) {
  console.error('\n❌ Sem face_descriptors. Rode database/migrations/restore-legacy-sample.sql no Supabase.');
  process.exit(1);
}

const result = await faceRecognitionService.searchArchiveByDescriptor(
  leader.face_vector,
  threshold,
  libraryId
);

console.log('\nMatches:', result.matches.length, '| indexedFaces:', result.indexedFaces);
for (const m of result.matches.slice(0, 15)) {
  console.log(
    `  ${(m.similarity * 100).toFixed(1)}%  dist=${m.distance.toFixed(3)}  ${m.photo?.name || m.photo_id}`
  );
}

if (result.matches.length === 0) {
  console.log('\nNenhum match com threshold', threshold);
  console.log('Tentando threshold mais frouxo 0.7…');
  const loose = await faceRecognitionService.searchArchiveByDescriptor(
    leader.face_vector,
    0.7,
    libraryId
  );
  console.log('Matches @0.7:', loose.matches.length);
  for (const m of loose.matches.slice(0, 10)) {
    console.log(
      `  ${(m.similarity * 100).toFixed(1)}%  dist=${m.distance.toFixed(3)}  ${m.photo?.name || m.photo_id}`
    );
  }
}
