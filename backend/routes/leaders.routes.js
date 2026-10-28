import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.config.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import faceRecognitionService from '../services/faceRecognition.service.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

function toDataUrl(buffer, mimeType) {
  const mime = mimeType || 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

/**
 * GET /api/leaders
 * Lista lideranças (equipe logada)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, city } = req.query;
    let query = supabase
      .from('leaders')
      .select('id, name, city, role_title, photo_data, created_at, updated_at')
      .order('name', { ascending: true });

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (q) {
      query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,role_title.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ leaders: data || [] });
  } catch (error) {
    console.error('Erro ao listar lideranças:', error);
    res.status(500).json({ error: 'Falha ao listar lideranças' });
  }
});

/**
 * GET /api/leaders/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaders')
      .select('id, name, city, role_title, photo_data, created_at, updated_at')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Liderança não encontrada' });
    }

    res.json({ leader: data });
  } catch (error) {
    console.error('Erro ao obter liderança:', error);
    res.status(500).json({ error: 'Falha ao obter liderança' });
  }
});

/**
 * POST /api/leaders
 * Admin cria liderança com foto de referência
 */
router.post('/', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, city, role_title } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Foto de referência é obrigatória' });
    }

    const detections = await faceRecognitionService.detectFaces(
      req.file.buffer,
      req.file.mimetype
    );

    if (detections.length === 0) {
      return res.status(400).json({
        error: 'Nenhum rosto detectado na foto. Use uma foto nítida, de frente.'
      });
    }

    const primary = faceRecognitionService.pickPrimaryDetection(detections);
    const photoData = toDataUrl(req.file.buffer, req.file.mimetype);

    const { data, error } = await supabase
      .from('leaders')
      .insert({
        name: String(name).trim(),
        city: city ? String(city).trim() : null,
        role_title: role_title ? String(role_title).trim() : null,
        photo_data: photoData,
        face_vector: primary.descriptor
      })
      .select('id, name, city, role_title, photo_data, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({ leader: data });
  } catch (error) {
    console.error('Erro ao criar liderança:', error);
    res.status(500).json({ error: error.message || 'Falha ao criar liderança' });
  }
});

/**
 * DELETE /api/leaders/:id
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('leaders')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover liderança:', error);
    res.status(500).json({ error: 'Falha ao remover liderança' });
  }
});

export default router;
