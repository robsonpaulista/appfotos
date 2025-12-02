import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../../lib/api-server/auth';
import { setCredentials } from '../../../../lib/api-server/google.config';
import { supabase } from '../../../../lib/api-server/supabase.config';

/**
 * GET /api/photos/:id
 * Obtém uma foto específica
 * PUT /api/photos/:id
 * Atualiza metadados de uma foto (tags, pessoa, local, etc)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, token } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID da foto é obrigatório' });
  }

  try {
    // Tentar autenticação via cookie primeiro
    let auth = await requireAuth(req);
    
    // Se falhar e houver token na query string, tentar autenticação via token
    if (!auth && token && typeof token === 'string') {
      try {
        const userId = Buffer.from(token, 'base64').toString('utf-8');
        const { data: user, error } = await supabase
          .from('users')
          .select('id, access_token, refresh_token, token_expiry')
          .eq('id', userId)
          .single();

        if (!error && user) {
          auth = {
            userId: user.id,
            user
          };
          
          // Configurar credenciais do Google
          if (user.access_token) {
            setCredentials({
              access_token: user.access_token,
              refresh_token: user.refresh_token,
              expiry_date: user.token_expiry ? new Date(user.token_expiry).getTime() : undefined
            });
          }
        }
      } catch (tokenError) {
        // Token inválido, continuar sem autenticação
      }
    }

    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .eq('user_id', auth.userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Foto não encontrada' });
        }
        throw error;
      }

      return res.json(data);
    }

    if (req.method === 'PUT') {
      const { person, location, event_type, event_city, event_year, event_month, person_tag, location_name } = req.body;

      const updates: any = {};
      
      // Aceitar tanto o formato antigo (person_tag) quanto novo (person)
      if (person !== undefined) updates.person_tag = person;
      if (person_tag !== undefined) updates.person_tag = person_tag;
      if (location !== undefined) updates.location_name = location;
      if (location_name !== undefined) updates.location_name = location_name;
      
      // Novos campos de eventos
      if (event_type !== undefined) updates.event_type = event_type;
      if (event_city !== undefined) updates.event_city = event_city;
      if (event_year !== undefined) updates.event_year = event_year;
      if (event_month !== undefined) updates.event_month = event_month;

      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', auth.userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json(data);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro ao processar foto:', error);
    const statusCode = error.status || error.statusCode || 500;
    const errorMessage = error.message || 'Falha ao processar foto';
    res.status(statusCode).json({ error: errorMessage });
  }
}

