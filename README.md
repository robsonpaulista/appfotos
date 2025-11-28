# 📸 PhotoFinder - Organizador Inteligente de Fotos com IA

Organizador Inteligente de Fotos com IA + Google Drive

## 🚀 Deploy no Vercel

Este projeto está configurado para deploy no Vercel.

### Configuração Vercel

- **Root Directory:** `frontend`
- **Framework:** Next.js
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/.next`

### Estrutura do Projeto

```
/
├── frontend/          # Aplicação Next.js (PhotoFinder)
│   ├── pages/         # Páginas e API Routes
│   ├── components/    # Componentes React
│   └── ...
├── backend/           # Backend Express (não usado no Vercel)
├── database/          # Schemas SQL
└── vercel.json        # Configuração Vercel
```

## 📝 Variáveis de Ambiente (Vercel)

Configure no Vercel → Settings → Environment Variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_REDIRECT_URI` (será `https://seu-projeto.vercel.app/api/auth/callback`)

## 🔗 Links

- Repositório: https://github.com/robsonpaulista/appfotos
- Documentação: Veja os arquivos `.md` na raiz do projeto
