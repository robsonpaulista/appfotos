/**
 * URL do Express (Face-API) para proxy server-side no Vercel.
 * Prefira BACKEND_URL (só servidor). Ignora localhost em produção.
 */
export function getFaceBackendUrl(): string | null {
  const candidates = [
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
  ];

  for (const raw of candidates) {
    const url = (raw || '').trim().replace(/\/$/, '');
    if (!url) continue;
    if (/localhost|127\.0\.0\.1/i.test(url) && process.env.VERCEL) {
      continue;
    }
    return url;
  }
  return null;
}

export function faceBackendMissingResponse() {
  return {
    error:
      'Indexação e busca por selfie precisam do backend Face-API. No Vercel, defina BACKEND_URL (URL pública do Express, ex. Railway) e faça Redeploy. Localmente, rode o backend na porta 4000.',
  };
}
