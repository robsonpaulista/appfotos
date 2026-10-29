import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, requireAdmin } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';

/**
 * GET /api/leaders — lista (auth)
 * POST /api/leaders — cria (admin). Body JSON: { name, city?, role_title?, photo_data }
 *   face_vector opcional (se o cliente/backend já calculou). Sem vetor, listagem funciona;
 *   busca facial dessa liderança só após vetor.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
      const { q, city } = req.query;
      let query = supabase
        .from('leaders')
        .select('id, name, city, role_title, photo_data, created_at, updated_at')
        .order('name', { ascending: true });

      if (typeof city === 'string' && city.trim()) {
        query = query.ilike('city', `%${city.trim()}%`);
      }
      if (typeof q === 'string' && q.trim()) {
        const term = q.trim();
        query = query.or(
          `name.ilike.%${term}%,city.ilike.%${term}%,role_title.ilike.%${term}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ leaders: data || [] });
    } catch (error) {
      console.error('Erro ao listar lideranças:', error);
      return res.status(500).json({ error: 'Falha ao listar lideranças' });
    }
  }

  if (req.method === 'POST') {
    const auth = await requireAdmin(req);
    if (!auth) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }

    try {
      const { name, city, role_title, photo_data, face_vector } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      if (!photo_data || typeof photo_data !== 'string' || !photo_data.startsWith('data:')) {
        return res.status(400).json({ error: 'Foto de referência é obrigatória (data URL)' });
      }

      const insert: Record<string, unknown> = {
        name: String(name).trim(),
        city: city ? String(city).trim() : null,
        role_title: role_title ? String(role_title).trim() : null,
        photo_data,
      };

      if (Array.isArray(face_vector) && face_vector.length > 0) {
        insert.face_vector = face_vector.map(Number);
      }

      const { data, error } = await supabase
        .from('leaders')
        .insert(insert)
        .select('id, name, city, role_title, photo_data, created_at')
        .single();

      if (error) throw error;

      return res.status(201).json({
        leader: data,
        warning: insert.face_vector
          ? undefined
          : 'Liderança salva sem vetor facial. A busca por esta liderança no acervo exige o backend Express (Face-API) ou reindexação.',
      });
    } catch (error) {
      console.error('Erro ao criar liderança:', error);
      const message = error instanceof Error ? error.message : 'Falha ao criar liderança';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
