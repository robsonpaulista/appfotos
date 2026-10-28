# PhotoFinder Backend

Backend Node.js/Express para o PhotoFinder.

## 🚀 Instalação

```bash
npm install
```

## ⚙️ Configuração

1. Copie `env.template` para `.env`
2. Preencha as variáveis de ambiente:

```env
# Google Cloud
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=... # Obtenha via /api/auth/url
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Google Cloud Vision (opcional)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🏃 Executar

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

## 📡 Endpoints

### Auth
- `GET /api/auth/url` - Gera URL de autenticação OAuth
- `GET /api/auth/callback` - Callback OAuth
- `GET /api/auth/check` - Verifica autenticação

### Photos
- `GET /api/photos` - Lista fotos (com filtros)
- `GET /api/photos/:id` - Detalhes de uma foto
- `GET /api/photos/:id/image` - Streaming da imagem
- `GET /api/photos/:id/thumbnail` - Thumbnail
- `PATCH /api/photos/:id/tags` - Atualiza tags
- `GET /api/photos/people` - Lista pessoas
- `GET /api/photos/locations` - Lista locais
- `GET /api/photos/stats` - Estatísticas

### Ingest
- `POST /api/ingest/start` - Inicia sincronização
- `GET /api/ingest/status` - Status
- `POST /api/ingest/reprocess/:id` - Reprocessa foto

## 🔑 Obter Refresh Token

1. Inicie o servidor: `npm run dev`
2. Acesse: http://localhost:4000/api/auth/url
3. Copie a URL retornada e cole no navegador
4. Autentique com sua conta Google
5. Copie o `refresh_token` retornado
6. Adicione ao arquivo `.env`

## 📁 Estrutura

```
backend/
├── controllers/       # Lógica de negócio
│   ├── auth.controller.js
│   ├── photo.controller.js
│   └── ingest.controller.js
├── routes/           # Definição de rotas
│   ├── auth.routes.js
│   ├── photo.routes.js
│   └── ingest.routes.js
├── services/         # Serviços externos
│   ├── drive.service.js
│   ├── vision.service.js
│   └── database.service.js
└── index.js          # Entry point
```

## 🧪 Scripts

```bash
npm start       # Produção
npm run dev     # Desenvolvimento com nodemon
npm run ingest  # Script de ingestão manual
```

## 🔒 Segurança

- Helmet.js para headers seguros
- CORS configurado
- Tokens OAuth protegidos
- Nenhum link público criado
- Streaming autenticado

## 📝 Logs

O servidor registra:
- Requisições HTTP
- Erros de autenticação
- Progresso de ingestão
- Erros da Vision API

## ⚠️ Troubleshooting

### Erro de autenticação
```
Error: invalid_grant
```
**Solução**: Regenere o refresh token

### Erro de quota da Vision API
```
Error: Quota exceeded
```
**Solução**: Aguarde reset da cota ou desabilite Vision

### Erro de conexão com Supabase
```
Error: Failed to connect to database
```
**Solução**: Verifique as credenciais no `.env`

