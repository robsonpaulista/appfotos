/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      // Permitir imagens do backend em produção (HTTPS)
      ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_BACKEND_URL
        ? (() => {
            try {
              const backendUrl = new URL(process.env.NEXT_PUBLIC_BACKEND_URL);
              return [{
                protocol: 'https',
                hostname: backendUrl.hostname,
              }];
            } catch (e) {
              return [];
            }
          })()
        : [])
    ],
    // Em desenvolvimento, desabilitar otimização para facilitar acesso de rede local
    // Em produção, usar otimização do Next.js
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  }
}

module.exports = nextConfig
