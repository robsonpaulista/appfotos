import express from 'express';
import { supabase } from '../config/supabase.config.js';
import {
  createAnonAuthClient,
  requireAdmin,
  loadAppUser,
  SESSION_COOKIE
} from '../middleware/auth.js';

const router = express.Router();
const REFRESH_COOKIE = 'pf_refresh_token';

function cookieFlags(maxAgeSeconds) {
  const isProduction = process.env.NODE_ENV === 'production';
  return [
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    isProduction ? 'SameSite=Lax; Secure' : 'SameSite=Lax'
  ].join('; ');
}

function setAuthCookies(res, accessToken, refreshToken, expiresIn = 3600) {
  const cookies = [
    `${SESSION_COOKIE}=${encodeURIComponent(accessToken)}; ${cookieFlags(expiresIn)}`
  ];
  if (refreshToken) {
    cookies.push(
      `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; ${cookieFlags(60 * 60 * 24 * 30)}`
    );
  }
  res.setHeader('Set-Cookie', cookies);
}

function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=; ${cookieFlags(0)}`,
    `${REFRESH_COOKIE}=; ${cookieFlags(0)}`
  ]);
}

/**
 * POST /api/auth/login
 * Login com e-mail e senha (Supabase Auth)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const client = createAnonAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email).trim().toLowerCase(),
      password: String(password)
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const profile = await loadAppUser(data.user.id);
    if (!profile) {
      return res.status(403).json({
        error: 'Usuário sem perfil no app. Peça a um administrador para liberar o acesso.'
      });
    }

    setAuthCookies(
      res,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_in || 3600
    );

    const imageToken = Buffer.from(profile.id, 'utf-8').toString('base64');

    return res.json({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      },
      imageToken
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Falha ao fazer login' });
  }
});

/**
 * GET /api/auth/status
 */
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let accessToken = null;
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7);
    } else {
      const cookies = (req.headers.cookie || '').split(';').reduce((acc, c) => {
        const [k, ...v] = c.trim().split('=');
        if (k) acc[k] = decodeURIComponent(v.join('='));
        return acc;
      }, {});
      accessToken = cookies[SESSION_COOKIE] || null;
    }

    if (!accessToken) {
      return res.json({ authenticated: false });
    }

    const { data: authData, error } = await supabase.auth.getUser(accessToken);
    if (error || !authData.user) {
      return res.json({ authenticated: false });
    }

    const profile = await loadAppUser(authData.user.id);
    if (!profile) {
      return res.json({ authenticated: false });
    }

    const imageToken = Buffer.from(profile.id, 'utf-8').toString('base64');
    return res.json({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      },
      imageToken
    });
  } catch (err) {
    console.error('Erro ao verificar status:', err);
    return res.status(500).json({ error: 'Falha ao verificar status' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  if (req.session) {
    req.session.destroy(() => {});
  }
  return res.json({ success: true });
});

/**
 * POST /api/auth/users
 * Admin cria usuário (Auth + app_users)
 */
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role = 'viewer' } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }
    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'role deve ser admin ou viewer' });
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      email_confirm: true,
      user_metadata: { name: name || null }
    });

    if (createError || !created.user) {
      return res.status(400).json({ error: createError?.message || 'Falha ao criar usuário' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .insert({
        id: created.user.id,
        email: created.user.email,
        name: name || null,
        role
      })
      .select('id, email, name, role')
      .single();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    return res.status(201).json({ user: profile });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return res.status(500).json({ error: 'Falha ao criar usuário' });
  }
});

/**
 * GET /api/auth/users — lista perfis (admin)
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ users: data || [] });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ error: 'Falha ao listar usuários' });
  }
});

/**
 * PUT /api/auth/users/:id — atualizar nome/role/senha
 */
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body || {};

    if (role !== undefined && !['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'role deve ser admin ou viewer' });
    }
    if (password !== undefined && String(password).length > 0 && String(password).length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const authUpdate = {};
    if (password) authUpdate.password = String(password);
    if (name !== undefined) authUpdate.user_metadata = { name: name || null };

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdate);
      if (authError) {
        return res.status(400).json({ error: authError.message });
      }
    }

    const profileUpdate = { updated_at: new Date().toISOString() };
    if (name !== undefined) profileUpdate.name = name ? String(name).trim() : null;
    if (role !== undefined) profileUpdate.role = role;

    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .update(profileUpdate)
      .eq('id', id)
      .select('id, email, name, role, created_at')
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: profileError?.message || 'Usuário não encontrado' });
    }

    return res.json({ user: profile });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    return res.status(500).json({ error: 'Falha ao atualizar usuário' });
  }
});

/**
 * DELETE /api/auth/users/:id
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Você não pode remover a si mesmo' });
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
    if (deleteAuthError) {
      return res.status(400).json({ error: deleteAuthError.message });
    }

    await supabase.from('app_users').delete().eq('id', id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao remover usuário:', err);
    return res.status(500).json({ error: 'Falha ao remover usuário' });
  }
});

// Compat: rotas antigas do Google OAuth
router.get('/url', (_req, res) => {
  res.status(410).json({
    error: 'OAuth Google desativado. Use POST /api/auth/login com e-mail e senha.'
  });
});

router.get('/callback', (_req, res) => {
  res.status(410).json({
    error: 'OAuth Google desativado. Use login com e-mail e senha.'
  });
});

export default router;
