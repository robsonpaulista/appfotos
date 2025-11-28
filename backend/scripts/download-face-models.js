import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '..', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('📥 Baixando modelos do Face-API.js...\n');
  
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  for (const model of MODELS) {
    const url = `${BASE_URL}/${model}`;
    const dest = path.join(MODELS_DIR, model);
    
    if (fs.existsSync(dest)) {
      console.log(`⏭️  Já existe: ${model}`);
      continue;
    }
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`❌ Erro ao baixar ${model}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ Todos os modelos foram baixados com sucesso!');
  console.log(`📁 Localização: ${MODELS_DIR}`);
}

downloadModels().catch(console.error);

