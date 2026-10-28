# 📋 Resumo da Migração para Vercel

## ✅ O que foi feito

### 1. Estrutura de API Routes Criada
- ✅ `frontend/pages/api/auth/` - Autenticação
- ✅ `frontend/pages/api/sync/` - Sincronização
- ✅ `frontend/pages/api/photos/` - Fotos
- ✅ `frontend/pages/api/keep-alive.ts` - Keep-alive do Supabase

### 2. Bibliotecas Adaptadas
- ✅ `frontend/lib/api-server/google.config.ts` - Configuração Google OAuth
- ✅ `frontend/lib/api-server/supabase.config.ts` - Configuração Supabase
- ✅ `frontend/lib/api-server/auth.ts` - Autenticação via cookies
- ✅ `frontend/lib/api-server/utils.ts` - Utilitários

### 3. Frontend Atualizado
- ✅ `frontend/utils/api.ts` - Usa rotas relativas no Vercel
- ✅ `frontend/package.json` - Adicionado `googleapis`

### 4. Configuração Vercel
- ✅ `vercel.json` - Configurado para Next.js com timeout de 10s

## 🔄 Mudanças Principais

### Sincronização
**Antes:** Processava todas as fotos de uma vez (pode demorar minutos)

**Agora:** Processa em chunks de 10 fotos por vez
```typescript
// 1. Iniciar
const { syncId } = await api.startSync();

// 2. Processar chunks
let done = false;
let pageToken = null;
while (!done) {
  const result = await api.processChunk(syncId, pageToken);
  done = result.done;
  pageToken = result.nextPageToken;
}
```

### Autenticação
**Antes:** Express sessions com `express-session`

**Agora:** Cookies HTTP-only com dados da sessão

### Rotas da API
**Antes:** Backend separado em `backend/`

**Agora:** API Routes do Next.js em `frontend/pages/api/`

## 📝 Próximos Passos

1. **Instalar dependências:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variáveis de ambiente no Vercel:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

3. **Atualizar Google Cloud Console:**
   - Adicionar redirect URI: `https://seu-projeto.vercel.app/api/auth/callback`

4. **Fazer deploy:**
   ```bash
   git add .
   git commit -m "Migração para Vercel Serverless Functions"
   git push
   ```

5. **Testar:**
   - Autenticação Google
   - Sincronização (processa em chunks)
   - Listagem de fotos

## ⚠️ Limitações

- **Timeout:** 10 segundos por função (plano gratuito)
- **Sincronização:** Processa 10 fotos por vez (pode ser lento para muitas fotos)
- **Cold Start:** Primeira requisição pode ser mais lenta

## 🎯 Rotas Criadas

### Autenticação
- `GET /api/auth/url` - Obter URL de autenticação
- `GET /api/auth/callback` - Callback do Google
- `GET /api/auth/status` - Status de autenticação

### Sincronização
- `POST /api/sync/start` - Iniciar sincronização
- `POST /api/sync/process-chunk` - Processar chunk de fotos
- `GET /api/sync/status` - Status da sincronização

### Fotos
- `GET /api/photos` - Listar fotos com filtros

### Keep-Alive
- `GET /api/keep-alive` - Manter Supabase ativo

## 📚 Documentação

Veja `DEPLOY-VERCEL-COMPLETO.md` para guia completo de deploy.

