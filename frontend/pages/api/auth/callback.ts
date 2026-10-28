import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/auth/callback — desativado (OAuth Google removido)
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'OAuth Google desativado. Use login com e-mail e senha.'
  });
}
