import type { NextApiRequest } from 'next';
import { supabase } from './supabase.config';
import { setCredentials } from './google.config';

interface SessionData {
  userId: string;
  googleId: string;
  expires: string;
}

/**
 * Parse session cookie da requisição
 */
export function parseSessionCookie(req: NextApiRequest): SessionData | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) return acc;
    const key = trimmed.substring(0, equalIndex);
    const value = trimmed.substring(equalIndex + 1);
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  const sessionCookie = cookies.session;
  if (!sessionCookie) return null;

  try {
    // O cookie já foi decodificado no split acima
    const session = JSON.parse(sessionCookie);
    
    // Verificar se expirou
    if (new Date(session.expires) < new Date()) {
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Middleware para verificar autenticação
 */
export async function requireAuth(req: NextApiRequest): Promise<{ userId: string; user: any } | null> {
  const session = parseSessionCookie(req);
  
  if (!session || !session.userId) {
    return null;
  }

  try {
    // Buscar tokens do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('id, access_token, refresh_token, token_expiry')
      .eq('id', session.userId)
      .single();

    if (error || !user) {
      return null;
    }

    // Configurar credenciais do Google
    if (user.access_token) {
      setCredentials({
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        expiry_date: user.token_expiry ? new Date(user.token_expiry).getTime() : undefined
      });
    }

    return {
      userId: user.id,
      user
    };
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
}

