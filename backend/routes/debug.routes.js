import express from 'express';
import { supabase } from '../config/supabase.config.js';

const router = express.Router();

/**
 * GET /api/debug/photo/:driveId
 * Debug de uma foto específica
 */
router.get('/photo/:driveId', async (req, res) => {
  try {
    const { driveId } = req.params;

    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('drive_id', driveId)
      .single();

    if (error) throw error;

    res.json({
      photo,
      urls: {
        thumbnail: photo.thumbnail_url,
        stream: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/photos/stream/${driveId}`
      },
      checks: {
        hasThumbnail: !!photo.thumbnail_url,
        hasDriveId: !!photo.drive_id,
        mimeType: photo.mime_type
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/photos-sample
 * Retorna amostra de fotos para debug
 */
router.get('/photos-sample', async (req, res) => {
  try {
    const { data: photos, error } = await supabase
      .from('photos')
      .select('drive_id, name, thumbnail_url, mime_type, created_at')
      .limit(5);

    if (error) throw error;

    const analysis = photos.map(p => ({
      name: p.name,
      driveId: p.drive_id,
      hasThumbnail: !!p.thumbnail_url,
      thumbnailUrl: p.thumbnail_url?.substring(0, 60) + '...',
      mimeType: p.mime_type,
      createdAt: p.created_at,
      createdAtBR: p.created_at ? new Date(p.created_at).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }) : null
    }));

    res.json({
      total: photos.length,
      photos: analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

