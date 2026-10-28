import { google, Auth } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import fs from 'fs';
import path from 'path';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/cloud-vision'
];

let googleAuth: Auth.GoogleAuth | null = null;

/**
 * ID da pasta raiz compartilhada no Drive
 */
export function getDriveFolderId(): string {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('DRIVE_FOLDER_ID não configurado. Defina o ID da pasta compartilhada com a service account.');
  }
  return folderId;
}

/**
 * ID usado em photos.user_id para a biblioteca compartilhada
 */
export function getLibrarySourceId(): string {
  return process.env.DRIVE_FOLDER_ID || 'library';
}

function normalizeServiceAccount(
  credentials: Record<string, unknown>
): Record<string, unknown> {
  const privateKey = credentials.private_key;
  // Alguns painéis de env colam a chave com \\n literal em vez de quebras reais
  if (typeof privateKey === 'string' && privateKey.includes('\\n') && !privateKey.includes('\n')) {
    return { ...credentials, private_key: privateKey.replace(/\\n/g, '\n') };
  }
  return credentials;
}

function loadServiceAccountCredentials(): Record<string, unknown> {
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      const trimmed = jsonEnv.trim();
      return normalizeServiceAccount(JSON.parse(trimmed));
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON inválido (JSON malformado)');
    }
  }

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    const resolved = path.isAbsolute(keyFile)
      ? keyFile
      : path.resolve(process.cwd(), keyFile);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Arquivo de service account não encontrado: ${resolved}`);
    }
    return normalizeServiceAccount(JSON.parse(fs.readFileSync(resolved, 'utf8')));
  }

  throw new Error(
    'Service account não configurada. Defina GOOGLE_SERVICE_ACCOUNT_JSON no Vercel (arquivo JSON local não funciona em produção).'
  );
}

/** Diagnóstico sem vazar segredos — útil no deploy */
export function getDriveEnvStatus() {
  return {
    hasServiceAccountJson: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()),
    hasCredentialsFile: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()),
    hasDriveFolderId: Boolean(process.env.DRIVE_FOLDER_ID?.trim()),
    driveFolderIdPrefix: process.env.DRIVE_FOLDER_ID?.trim().slice(0, 6) || null,
  };
}

export function getGoogleAuth() {
  if (googleAuth) return googleAuth;

  const credentials = loadServiceAccountCredentials();
  googleAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: DRIVE_SCOPES
  });

  return googleAuth;
}

export async function getDriveClient(): Promise<drive_v3.Drive> {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  return google.drive({ version: 'v3', auth: client as Auth.JWT });
}

export async function getServiceAccessToken(): Promise<string> {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
  if (!token) {
    throw new Error('Não foi possível obter access token da service account');
  }
  return token;
}

/** @deprecated Use getDriveClient */
export function getOAuth2Client() {
  return getGoogleAuth();
}

/** @deprecated Ignorado — Drive usa service account */
export function setCredentials(_tokens?: unknown) {
  console.warn('setCredentials ignorado: Drive usa service account');
}

export const SCOPES = DRIVE_SCOPES;
