import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/auth/url — desativado (OAuth Google removido)
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'OAuth Google desativado. Use POST /api/auth/login com e-mail e senha.'
  });
}
