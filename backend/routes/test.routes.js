import express from 'express';
import { oauth2Client, SCOPES } from '../config/google.config.js';

const router = express.Router();

/**
 * GET /api/test/env
 * Testa se as variáveis de ambiente estão carregadas
 */
router.get('/env', (req, res) => {
  const checks = {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
  };

  const allOk = checks.GOOGLE_CLIENT_ID && 
                checks.GOOGLE_CLIENT_SECRET && 
                checks.GOOGLE_REDIRECT_URI &&
                checks.SUPABASE_URL &&
                checks.SUPABASE_SERVICE_KEY;

  res.json({
    status: allOk ? 'OK' : 'ERRO',
    checks,
    oauth2Config: {
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      scopes: SCOPES
    }
  });
});

/**
 * GET /api/test/auth-url
 * Gera URL de autenticação do Google
 */
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    
    res.json({
      status: 'OK',
      authUrl,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERRO',
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;

