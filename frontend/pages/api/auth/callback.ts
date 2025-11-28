import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokensFromCode } from '../../../lib/api-server/google.config';
import { supabase } from '../../../lib/api-server/supabase.config';
import { google } from 'googleapis';
import { getFrontendUrl } from '../../../lib/api-server/utils';

/**
 * GET /api/auth/callback
 * Callback após autenticação no Google
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { code, error: authError, state } = req.query;

  // Decodificar state para obter frontendUrl original
  let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  if (state && typeof state === 'string') {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.frontendUrl) {
        frontendUrl = stateData.frontendUrl;
      }
    } catch (e) {
      // Ignorar erro
    }
  }

  if (authError) {
    return res.redirect(`${frontendUrl}?auth=error&reason=${authError}`);
  }

  if (!code || typeof code !== 'string') {
    return res.redirect(`${frontendUrl}?auth=error&reason=no_code`);
  }

  try {
    // Verificar variáveis de ambiente essenciais
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('❌ Variáveis do Supabase não configuradas!');
      console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
      console.error('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌');
      return res.redirect(`${frontendUrl}?auth=error&reason=supabase_not_configured`);
    }

    // Obter URL base para redirect_uri usando o host da requisição atual
    let baseUrl: string;
    
    if (req.headers.host) {
      // Usar o host da requisição atual (funciona em preview e produção)
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      baseUrl = `${protocol}://${req.headers.host}`;
    } else if (process.env.VERCEL_URL) {
      // Fallback para VERCEL_URL se host não estiver disponível
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Fallback para desenvolvimento local
      baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    }
    
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    console.log('🔄 Iniciando callback de autenticação...');
    console.log('📍 Redirect URI:', redirectUri);
    
    // Obter tokens
    const tokens = await getTokensFromCode(code, redirectUri);
    console.log('✅ Tokens obtidos com sucesso');
    
    // Criar cliente OAuth2 para obter informações do usuário
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    console.log('✅ Informações do usuário obtidas:', userInfo.email);

    // Testar conexão com Supabase antes de salvar
    console.log('🔄 Testando conexão com Supabase...');
    try {
      const { error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Erro ao testar conexão com Supabase:', testError);
        throw new Error(`Erro de conexão com Supabase: ${testError.message}`);
      }
      console.log('✅ Conexão com Supabase OK');
    } catch (testErr: any) {
      console.error('❌ Falha no teste de conexão:', testErr);
      if (testErr.message?.includes('fetch failed') || testErr.cause?.code === 'ECONNREFUSED') {
        return res.redirect(`${frontendUrl}?auth=error&reason=supabase_unavailable`);
      }
      throw testErr;
    }

    // Salvar usuário no banco
    console.log('🔄 Salvando usuário no banco...');
    
    // Verificar se usuário já existe
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', userInfo.id)
      .single();
    
    let user;
    if (existingUser) {
      // Atualizar usuário existente
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email: userInfo.email,
          name: userInfo.name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError);
        throw updateError;
      }
      user = updatedUser;
    } else {
      // Criar novo usuário
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          google_id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir usuário:', insertError);
        throw insertError;
      }
      user = newUser;
    }
    
    // Se chegou aqui, não há erro

    console.log('✅ Usuário salvo no banco:', user.id);

    // Criar sessão usando cookie httpOnly
    // Em produção, use JWT ou sessão segura
    const sessionData = {
      userId: user.id,
      googleId: userInfo.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    // Definir cookie de sessão (codificar JSON para URL-safe)
    const sessionCookie = encodeURIComponent(JSON.stringify(sessionData));
    const isProduction = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `session=${sessionCookie}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`);

    console.log('✅ Autenticação concluída com sucesso');
    // Redirecionar para o frontend
    res.redirect(`${frontendUrl}?auth=success`);
  } catch (error: any) {
    console.error('=== ERRO NO CALLBACK ===');
    console.error('Tipo:', error?.constructor?.name || typeof error);
    console.error('Mensagem:', error?.message || String(error));
    console.error('Stack:', error?.stack);
    
    // Verificar se é erro de fetch/Supabase
    if (error?.message?.includes('fetch failed') || error?.cause?.code === 'ECONNREFUSED') {
      console.error('❌ Erro de conexão detectado - Supabase pode estar pausado ou inacessível');
      return res.redirect(`${frontendUrl}?auth=error&reason=supabase_connection_failed`);
    }
    
    // Verificar se é erro de configuração
    if (error?.message?.includes('Variáveis do Supabase')) {
      return res.redirect(`${frontendUrl}?auth=error&reason=supabase_not_configured`);
    }
    
    res.redirect(`${frontendUrl}?auth=error&reason=callback_failed`);
  }
}

