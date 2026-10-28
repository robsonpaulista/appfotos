/**
 * Indexa imagens de ./fotosteste no Supabase (metadados + face_descriptors)
 * e testa match contra a liderança Jadyel.
 *
 * Uso: node scripts/index-fotosteste.js
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import faceRecognitionService from '../services/faceRecognition.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(root, '.env') });

const FIXTURES = path.join(root, 'fotosteste');
const libraryId = process.env.DRIVE_FOLDER_ID || 'library';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function mimeFor(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
  };
  return map[ext] || 'image/jpeg';
}

async function makeThumbDataUrl(buffer) {
  const thumb = await sharp(buffer)
    .rotate()
    .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();
  return `data:image/jpeg;base64,${thumb.toString('base64')}`;
}

async function main() {
  if (!fs.existsSync(FIXTURES)) {
    console.error('Pasta não encontrada:', FIXTURES);
    process.exit(1);
  }

  const files = fs
    .readdirSync(FIXTURES)
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .sort();

  console.log(`Indexando ${files.length} imagem(ns) de fotosteste…`);
  console.log('user_id (library):', libraryId);

  await faceRecognitionService.loadModels();

  const results = [];

  for (const fileName of files) {
    const full = path.join(FIXTURES, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const mime = mimeFor(ext);
    const driveId = `local:fotosteste/${fileName}`;
    const buffer = fs.readFileSync(full);
    const stat = fs.statSync(full);

    let thumb;
    try {
      thumb = await makeThumbDataUrl(buffer);
    } catch (e) {
      console.warn(`  ⚠️ thumb falhou (${fileName}):`, e.message);
      thumb = null;
    }

    const { data: photo, error: upErr } = await sb
      .from('photos')
      .upsert(
        {
          drive_id: driveId,
          name: fileName,
          mime_type: mime,
          size_bytes: stat.size,
          thumbnail_url: thumb,
          storage_url: driveId,
          user_id: libraryId,
          analyzed: false,
          faces_detected: 0,
          person_tag: 'fotosteste',
        },
        { onConflict: 'drive_id' }
      )
      .select('id, name, drive_id')
      .single();

    if (upErr) {
      console.error(`  ❌ upsert ${fileName}:`, upErr.message);
      continue;
    }

    // limpar descritores antigos desta foto
    await sb.from('face_descriptors').delete().eq('photo_id', photo.id);

    let detections = [];
    try {
      detections = await faceRecognitionService.detectFaces(buffer, mime);
    } catch (e) {
      console.error(`  ❌ detect ${fileName}:`, e.message);
      results.push({ fileName, photoId: photo.id, faces: 0, error: e.message });
      continue;
    }

    if (detections.length > 0) {
      await faceRecognitionService.saveFaceDescriptors(photo.id, detections);
      await sb
        .from('photos')
        .update({ faces_detected: detections.length, analyzed: true })
        .eq('id', photo.id);
    }

    console.log(`  ✅ ${fileName} → ${detections.length} rosto(s)  id=${photo.id}`);
    results.push({ fileName, photoId: photo.id, faces: detections.length });
  }

  const { data: leader } = await sb
    .from('leaders')
    .select('id, name, face_vector')
    .ilike('name', '%jadyel%')
    .maybeSingle();

  if (!leader?.face_vector) {
    console.error('\nLiderança Jadyel sem vetor — cadastre de novo.');
    process.exit(1);
  }

  console.log(`\nBuscando matches para: ${leader.name}`);
  for (const threshold of [0.4, 0.5, 0.55, 0.6]) {
    const result = await faceRecognitionService.searchArchiveByDescriptor(
      leader.face_vector,
      threshold,
      libraryId
    );
    const localMatches = result.matches.filter((m) =>
      String(m.photo?.drive_id || '').startsWith('local:fotosteste/')
    );
    console.log(`\nthreshold=${threshold} → ${localMatches.length} match(es) em fotosteste:`);
    for (const m of localMatches) {
      console.log(
        `  ${(m.similarity * 100).toFixed(1)}%  dist=${m.distance.toFixed(3)}  ${m.photo?.name}`
      );
    }
  }

  console.log('\nResumo indexação:');
  console.table(results);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
