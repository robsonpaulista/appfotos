import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/cloud-vision'
];

let googleAuth = null;

/**
 * ID da pasta raiz compartilhada no Drive (biblioteca de fotos)
 */
export function getDriveFolderId() {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('DRIVE_FOLDER_ID não configurado. Defina o ID da pasta compartilhada com a service account.');
  }
  return folderId;
}

/**
 * ID usado em photos.user_id para a biblioteca compartilhada
 */
export function getLibrarySourceId() {
  return process.env.DRIVE_FOLDER_ID || 'library';
}

function loadServiceAccountCredentials() {
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON inválido (JSON malformado)');
    }
  }

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    const resolved = path.isAbsolute(keyFile)
      ? keyFile
      : path.resolve(__dirname, '../..', keyFile);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Arquivo de service account não encontrado: ${resolved}`);
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }

  throw new Error(
    'Service account não configurada. Defina GOOGLE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

/**
 * GoogleAuth com service account (Drive + Vision)
 */
export function getGoogleAuth() {
  if (googleAuth) return googleAuth;

  const credentials = loadServiceAccountCredentials();
  googleAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: DRIVE_SCOPES
  });

  return googleAuth;
}

/**
 * Cliente Drive autenticado com service account
 */
export async function getDriveClient() {
  const auth = getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * Access token da service account (ex.: Vision API REST)
 */
export async function getServiceAccessToken() {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
  if (!token) {
    throw new Error('Não foi possível obter access token da service account');
  }
  return token;
}

/** @deprecated Use getDriveClient / getGoogleAuth — mantido só para imports legados */
export const oauth2Client = {
  async getAccessToken() {
    const token = await getServiceAccessToken();
    return { token };
  },
  setCredentials() {
    console.warn('setCredentials ignorado: Drive usa service account');
  }
};

export const setCredentials = () => {
  console.warn('setCredentials ignorado: Drive usa service account');
};

export const SCOPES = DRIVE_SCOPES;
