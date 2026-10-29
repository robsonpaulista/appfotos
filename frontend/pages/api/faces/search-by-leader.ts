import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/api-server/auth';
import { supabase } from '../../../lib/api-server/supabase.config';
import { searchArchiveByDescriptor } from '../../../lib/api-server/face-match';

/**
 * POST /api/faces/search-by-leader
 * Busca no acervo pelo face_vector da liderança (sem Face-API / Express)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { leaderId, threshold = 0.5 } = req.body || {};
    if (!leaderId) {
      return res.status(400).json({ error: 'leaderId é obrigatório' });
    }

    const { data: leader, error } = await supabase
      .from('leaders')
      .select('id, name, city, role_title, photo_data, face_vector')
      .eq('id', leaderId)
      .single();

    if (error || !leader) {
      return res.status(404).json({ error: 'Liderança não encontrada' });
    }

    if (!leader.face_vector || leader.face_vector.length === 0) {
      return res.status(400).json({
        error: 'no_face_vector',
        message:
          'Esta liderança não tem vetor facial. Cadastre de novo com o backend Face-API ou reindexe a foto de referência.',
        matches: [],
      });
    }

    const result = await searchArchiveByDescriptor(
      leader.face_vector as number[],
      Number(threshold) || 0.5
    );

    return res.json({
      matches: result.matches,
      indexedFaces: result.indexedFaces,
      leader: {
        id: leader.id,
        name: leader.name,
        city: leader.city,
        role_title: leader.role_title,
        photo_data: leader.photo_data,
      },
    });
  } catch (error) {
    console.error('Erro em search-by-leader:', error);
    return res.status(500).json({ error: 'Falha na busca por liderança' });
  }
}
