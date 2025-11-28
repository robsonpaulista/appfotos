import express from 'express';
import {
  startIngest,
  getIngestStatus,
  reprocessPhoto
} from '../controllers/ingest.controller.js';

const router = express.Router();

/**
 * @route POST /api/ingest/start
 * @desc Inicia o processo de ingestão de fotos
 * @body { folderId?: string, enableVision?: boolean }
 */
router.post('/start', startIngest);

/**
 * @route GET /api/ingest/status
 * @desc Obtém o status da ingestão
 */
router.get('/status', getIngestStatus);

/**
 * @route POST /api/ingest/reprocess/:id
 * @desc Reprocessa uma foto específica com Vision API
 */
router.post('/reprocess/:id', reprocessPhoto);

export default router;

