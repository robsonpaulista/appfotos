# ⚡ QuickStart - PhotoFinder

Guia rápido para desenvolvedores experientes que querem começar imediatamente.

## 📦 Instalação Rápida

```bash
# Clone o repositório
git clone <seu-repo>
cd photofinder

# Instale todas as dependências (raiz + backend + frontend)
npm run install:all
```

## ⚙️ Configuração Express

### 1. Google Cloud (5 min)
```
1. Crie projeto em console.cloud.google.com
2. Ative Google Drive API
3. Crie OAuth 2.0 credentials
4. Copie Client ID e Secret
```

### 2. Supabase (3 min)
```
1. Crie projeto em supabase.com
2. Execute database/schema.sql no SQL Editor
3. Copie URL e Keys (Settings → API)
```

### 3. Configure Backend
```bash
cd backend
cp env.template .env
# Edite .env com suas credenciais
```

### 4. Configure Frontend
```bash
cd frontend
cp env.template .env.local
# Edite .env.local
```

### 5. Obtenha Refresh Token
```bash
# Inicie o backend
cd backend
npm run dev

# Em outro terminal, obtenha a URL de auth
curl http://localhost:4000/api/auth/url

# Cole a authUrl no navegador, autentique
# Copie o refresh_token e adicione ao .env
```

## 🚀 Executar

### Opção 1: Ambos juntos (recomendado)
```bash
# Na raiz do projeto
npm run dev
```

### Opção 2: Separadamente
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse: http://localhost:3000

## 🔄 Primeira Sincronização

```bash
# Opção 1: Via interface
# Acesse http://localhost:3000/ingest

# Opção 2: Via CLI
cd backend
node scripts/ingest.js                    # Todas as fotos
node scripts/ingest.js <folder-id>        # Pasta específica
node scripts/ingest.js <folder-id> true   # Com Vision API
```

## 📁 Estrutura

```
photofinder/
├── backend/          # Node.js + Express
│   ├── controllers/  # Lógica de negócio
│   ├── routes/       # Rotas REST
│   ├── services/     # Drive, Vision, DB
│   └── scripts/      # CLI tools
├── frontend/         # Next.js 14 + TypeScript
│   ├── app/          # Páginas (App Router)
│   ├── components/   # Componentes React
│   ├── types/        # TypeScript definitions
│   └── utils/        # Helpers
└── database/         # SQL schemas
```

## 🛠️ Comandos Úteis

### Backend
```bash
npm run dev          # Desenvolvimento (nodemon)
npm start            # Produção
npm run ingest       # Script de sincronização
```

### Frontend
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm start            # Servidor de produção
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## 🐛 Debug Rápido

### Backend não conecta ao Drive
```bash
# Verifique credenciais
curl http://localhost:4000/api/auth/check

# Regenere refresh token se necessário
curl http://localhost:4000/api/auth/url
```

### Frontend não carrega fotos
```bash
# Verifique se backend está rodando
curl http://localhost:4000/health

# Verifique CORS
# FRONTEND_URL no backend deve bater com URL do frontend
```

### Banco de dados vazio
```bash
# Execute sincronização
cd backend
node scripts/ingest.js

# Ou via UI: http://localhost:3000/ingest
```

## 📊 Endpoints Principais

```bash
# Health check
GET http://localhost:4000/health

# Listar fotos
GET http://localhost:4000/api/photos

# Filtrar fotos
GET http://localhost:4000/api/photos?person=Maria&joy=LIKELY&year=2024

# Estatísticas
GET http://localhost:4000/api/photos/stats

# Iniciar sync
POST http://localhost:4000/api/ingest/start
```

## 🎨 Customização Rápida

### Mudar cores do tema
```typescript
// frontend/tailwind.config.ts
colors: {
  primary: {
    500: '#0ea5e9',  // Mude aqui
  },
}
```

### Adicionar novo filtro
1. Adicione campo no `FilterBar.tsx`
2. Adicione parâmetro em `photo.controller.js`
3. Adicione query em `database.service.js`

## 🚢 Deploy Rápido

```bash
# Vercel (frontend + serverless backend)
npm i -g vercel
cd frontend
vercel

# Configure env vars no dashboard da Vercel
```

## 💡 Dicas

- Use o script CLI (`ingest.js`) para sincronizações grandes
- Vision API tem limite de 1000 imagens/mês grátis
- PostGIS no Supabase permite buscas geográficas
- Thumbnails são cacheados automaticamente pelo Drive

## 📚 Documentação Completa

- [README.md](README.md) - Visão geral completa
- [SETUP.md](SETUP.md) - Guia passo a passo detalhado
- [CONTRIBUTING.md](CONTRIBUTING.md) - Como contribuir

## 🆘 Problemas?

1. Leia o [SETUP.md](SETUP.md) para troubleshooting detalhado
2. Verifique os logs no terminal do backend
3. Abra uma issue no GitHub

---

**⚡ Pronto! Você deve estar rodando em ~15 minutos.**

