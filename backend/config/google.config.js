import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/cloud-vision'  // Necessário para Vision API
];

export const getAuthUrl = (redirectUri = null, frontendUrl = null) => {
  // Se um redirect_uri customizado foi fornecido, criar um novo cliente OAuth2
  const client = redirectUri 
    ? new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      )
    : oauth2Client;
  
  const authUrlParams = {
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Força obter refresh token
  };
  
  // Se um frontendUrl foi fornecido, adicionar como state para usar no callback
  if (frontendUrl) {
    authUrlParams.state = Buffer.from(JSON.stringify({ frontendUrl })).toString('base64');
  }
  
  return client.generateAuthUrl(authUrlParams);
};

export const getTokensFromCode = async (code, redirectUri = null) => {
  const client = redirectUri 
    ? new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      )
    : oauth2Client;
  
  const { tokens } = await client.getToken(code);
  return tokens;
};

export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

