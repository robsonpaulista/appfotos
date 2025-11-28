import { google } from 'googleapis';

// Configuração do OAuth2 do Google
export function createOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );
}

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/cloud-vision'
];

export function getAuthUrl(redirectUri?: string, frontendUrl?: string): string {
  const client = createOAuth2Client(redirectUri);
  
  const authUrlParams: any = {
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  };
  
  // Adicionar frontendUrl no state se fornecido
  if (frontendUrl) {
    authUrlParams.state = Buffer.from(JSON.stringify({ frontendUrl })).toString('base64');
  }
  
  return client.generateAuthUrl(authUrlParams);
}

export async function getTokensFromCode(code: string, redirectUri?: string) {
  const client = createOAuth2Client(redirectUri);
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Armazenar credenciais em um cliente OAuth2 (para uso em outras rotas)
let globalOAuth2Client: ReturnType<typeof createOAuth2Client> | null = null;

export function setCredentials(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}) {
  if (!globalOAuth2Client) {
    globalOAuth2Client = createOAuth2Client();
  }
  globalOAuth2Client.setCredentials(tokens);
}

export function getOAuth2Client(redirectUri?: string) {
  if (globalOAuth2Client) {
    return globalOAuth2Client;
  }
  return createOAuth2Client(redirectUri);
}

