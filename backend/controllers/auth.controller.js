import driveService from '../services/drive.service.js';

/**
 * Controller para autenticação OAuth com Google
 */

/**
 * Gera URL de autenticação OAuth
 */
export function getAuthUrl(req, res) {
  try {
    const authUrl = driveService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Callback OAuth - troca código por tokens
 */
export async function handleCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Código de autorização não fornecido' });
    }

    // Troca o código por tokens
    const tokens = await driveService.getTokenFromCode(code);

    // Em produção, você salvaria o refresh_token de forma segura
    // Por enquanto, apenas retorna para o usuário adicionar ao .env
    res.json({
      message: 'Autenticação realizada com sucesso!',
      instructions: 'Adicione o refresh_token ao arquivo .env',
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token
    });
  } catch (error) {
    console.error('Erro ao processar callback OAuth:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export async function checkAuth(req, res) {
  try {
    // Tenta listar uma foto para verificar se as credenciais estão válidas
    await driveService.listPhotos(null, 1);
    
    res.json({ 
      authenticated: true,
      message: 'Credenciais válidas'
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    res.status(401).json({ 
      authenticated: false,
      error: 'Credenciais inválidas ou expiradas'
    });
  }
}

