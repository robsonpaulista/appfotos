import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../../lib/api-server/auth';
import { getLibrarySourceId } from '../../../../lib/api-server/google.config';
import { supabase } from '../../../../lib/api-server/supabase.config';

/**
 * GET/PUT /api/photos/:id
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
    let auth = await requireAuth(req);

    if (!auth && token && typeof token === 'string') {
      try {
        const userId = Buffer.from(token, 'base64').toString('utf-8');
        const { data: user, error } = await supabase
          .from('app_users')
          .select('id, email, name, role')
          .eq('id', userId)
          .single();

        if (!error && user) {
          auth = {
            userId: user.id,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            },
            accessToken: ''
          };
        }
      } catch {
        // ignore
      }
    }

    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const libraryId = getLibrarySourceId();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .eq('user_id', libraryId)
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
      const {
        person,
        location,
        event_type,
        event_city,
        event_year,
        event_month,
        person_tag,
        location_name
      } = req.body;

      const updates: Record<string, unknown> = {};

      if (person !== undefined) updates.person_tag = person;
      if (person_tag !== undefined) updates.person_tag = person_tag;
      if (location !== undefined) updates.location_name = location;
      if (location_name !== undefined) updates.location_name = location_name;
      if (event_type !== undefined) updates.event_type = event_type;
      if (event_city !== undefined) updates.event_city = event_city;
      if (event_year !== undefined) updates.event_year = event_year;
      if (event_month !== undefined) updates.event_month = event_month;

      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', libraryId)
        .select()
        .single();

      if (error) throw error;

      return res.json(data);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: unknown) {
    console.error('Erro ao processar foto:', error);
    const err = error as { status?: number; statusCode?: number; message?: string };
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({ error: err.message || 'Falha ao processar foto' });
  }
}
