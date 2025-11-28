import express from 'express';
import { getAuthUrl, getTokensFromCode, setCredentials } from '../config/google.config.js';
import { supabase } from '../config/supabase.config.js';
import { google } from 'googleapis';

const router = express.Router();

/**
 * GET /api/auth/url
 * Retorna URL de autenticação do Google
 * Aceita parâmetro opcional 'redirect_uri' para suportar acesso pela rede interna
 */
router.get('/url', (req, res) => {
  try {
    // IMPORTANTE: Google OAuth não aceita IPs privados (192.168.x.x)
    // Sempre usar localhost para o redirect_uri
    const backendPort = process.env.BACKEND_PORT || 4000;
    const redirectUri = `http://localhost:${backendPort}/api/auth/callback`;
    
    // Detectar URL do frontend original para redirecionar corretamente após auth
    const frontendOrigin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:3000';
    let frontendUrl = frontendOrigin;
    let isNetworkAccess = false;
    
    try {
      const originUrl = new URL(frontendOrigin);
      frontendUrl = `${originUrl.protocol}//${originUrl.host}`;
      
      // Verificar se está acessando pela rede (não localhost)
      isNetworkAccess = !originUrl.hostname.includes('localhost') && 
                        !originUrl.hostname.includes('127.0.0.1') &&
                        originUrl.hostname !== '::1';
      
      if (isNetworkAccess) {
        console.warn('⚠️  ATENÇÃO: Acesso pela rede detectado!');
        console.warn('⚠️  O Google vai redirecionar para localhost, que só funciona no servidor.');
        console.warn('💡 SOLUÇÃO: Após autenticar no Google, copie a URL completa do callback');
        console.warn('💡 e acesse diretamente no servidor (ou use ngrok para túnel público)');
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível parsear origin:', e.message);
    }
    
    // Adicionar o frontend_url como parâmetro na URL de auth para usar no callback
    const authUrl = getAuthUrl(redirectUri, frontendUrl);
    
    console.log('✅ Usando redirect_uri (sempre localhost):', redirectUri);
    console.log('📍 Frontend original:', frontendUrl);
    
    res.json({ 
      authUrl, 
      redirectUri,
      warning: isNetworkAccess ? 'Acesso pela rede detectado. Após autenticar, copie a URL do callback e acesse no servidor.' : null
    });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({ error: 'Falha ao gerar URL de autenticação' });
  }
});

/**
 * GET /api/auth/callback
 * Callback após autenticação no Google
 */
router.get('/callback', async (req, res) => {
  const { code, error: authError, state } = req.query;

  console.log('=== CALLBACK DE AUTENTICAÇÃO ===');
  console.log('Code recebido:', code ? 'SIM' : 'NÃO');
  console.log('Erro do Google:', authError || 'NENHUM');
  console.log('State recebido:', state || 'NENHUM');

  // Decodificar state para obter frontendUrl original
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.frontendUrl) {
        frontendUrl = stateData.frontendUrl;
        console.log('📍 Frontend URL do state:', frontendUrl);
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível decodificar state:', e.message);
    }
  }

  if (authError) {
    console.error('Erro retornado pelo Google:', authError);
    return res.redirect(`${frontendUrl}?auth=error&reason=${authError}`);
  }

  if (!code) {
    console.error('Código de autenticação não fornecido');
    return res.redirect(`${frontendUrl}?auth=error&reason=no_code`);
  }

  try {
    // SEMPRE usar localhost para o redirect_uri (Google não aceita IPs privados)
    const backendPort = process.env.BACKEND_PORT || 4000;
    const redirectUri = `http://localhost:${backendPort}/api/auth/callback`;
    
    console.log('✅ Usando redirect_uri (localhost):', redirectUri);
    
    // Criar cliente OAuth2 com redirect_uri localhost
    const oauth2ClientForToken = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    const tokenResponse = await oauth2ClientForToken.getToken(code);
    const tokens = tokenResponse.tokens;
    setCredentials(tokens);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Validar configuração do Supabase antes de usar
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('❌ ERRO: Variáveis do Supabase não configuradas!');
      console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Faltando');
      console.error('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Configurado' : '❌ Faltando');
      throw new Error('Configuração do Supabase incompleta. Verifique as variáveis de ambiente.');
    }

    console.log('💾 Tentando salvar usuário no Supabase...');
    console.log('📧 Email:', userInfo.email);
    console.log('🆔 Google ID:', userInfo.id);
    
    // Verificar se a API key está configurada
    const currentKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!currentKey) {
      throw new Error('SUPABASE_SERVICE_KEY ou SUPABASE_ANON_KEY não encontrado nas variáveis de ambiente');
    }
    console.log('🔑 API Key configurada:', currentKey ? `${currentKey.substring(0, 10)}...${currentKey.substring(currentKey.length - 4)}` : '❌ FALTANDO');

    // Preparar dados do usuário
    const userData = {
      google_id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
    };

    // Verificar se usuário já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, google_id, email, name')
      .eq('google_id', userInfo.id)
      .single();

    let user;
    
    if (checkError && checkError.code !== 'PGRST116') {
      // Erro diferente de "não encontrado"
      console.error('❌ Erro ao verificar usuário existente:');
      console.error('Mensagem:', checkError.message);
      console.error('Code:', checkError.code);
      throw checkError;
    }

    if (existingUser) {
      // Usuário existe, fazer update
      console.log('🔄 Usuário já existe, atualizando...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('google_id', userInfo.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:');
        console.error('Mensagem:', updateError.message);
        console.error('Detalhes:', updateError.details);
        console.error('Code:', updateError.code);
        throw updateError;
      }
      
      user = updatedUser;
      console.log('✅ Usuário atualizado com sucesso:', user.id);
    } else {
      // Usuário não existe, fazer insert
      console.log('➕ Usuário não existe, criando novo...');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar usuário:');
        console.error('Mensagem:', insertError.message);
        console.error('Detalhes:', insertError.details);
        console.error('Code:', insertError.code);
        
        // Se for erro de duplicata, tentar fazer update (race condition)
        if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
          console.log('⚠️ Duplicata detectada, tentando update...');
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(userData)
            .eq('google_id', userInfo.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Erro ao atualizar após duplicata:');
            console.error('Mensagem:', updateError.message);
            throw updateError;
          }
          
          user = updatedUser;
          console.log('✅ Usuário atualizado após duplicata:', user.id);
        } else {
          throw insertError;
        }
      } else {
        user = newUser;
        console.log('✅ Usuário criado com sucesso:', user.id);
      }
    }

    // Salvar na sessão
    req.session.userId = user.id;
    req.session.googleId = userInfo.id;
    req.session.tokens = tokens;

    console.log('Sessão criada com sucesso');

    // Redirecionar para o frontend (já definido acima do try)
    console.log('Redirecionando para:', frontendUrl);
    res.redirect(`${frontendUrl}?auth=success`);
  } catch (error) {
    console.error('=== ERRO NO CALLBACK ===');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    res.redirect(`${frontendUrl}?auth=error&reason=callback_failed`);
  }
});

/**
 * GET /api/auth/status
 * Verifica status de autenticação
 */
router.get('/status', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, google_id')
      .eq('id', req.session.userId)
      .single();

    if (error) throw error;

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Falha ao verificar status de autenticação' });
  }
});

/**
 * POST /api/auth/logout
 * Faz logout do usuário
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.status(500).json({ error: 'Falha ao fazer logout' });
    }
    res.json({ success: true });
  });
});

export default router;
