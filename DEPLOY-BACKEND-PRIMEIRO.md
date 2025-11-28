# 🚂 Deploy do Backend Primeiro

**IMPORTANTE:** Antes de fazer deploy do frontend no Vercel, você precisa fazer deploy do backend primeiro para obter a URL pública.

---

## 🎯 Por que fazer o backend primeiro?

O frontend precisa saber onde está o backend. Por isso você precisa:

1. ✅ **Deploy do Backend** → Obter URL pública (ex: `https://photofinder-backend.railway.app`)
2. ✅ **Configurar Frontend** → Usar essa URL na variável `NEXT_PUBLIC_BACKEND_URL`

---

## 🚀 Opção 1: Deploy no Railway (Recomendado)

### Passo 1: Criar Conta

1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"**

### Passo 2: Conectar Repositório

1. Selecione **"Deploy from GitHub repo"**
2. Escolha seu repositório
3. Railway detectará automaticamente que é Node.js

### Passo 3: Configurar Projeto

1. **Root Directory:** `/backend` ⚠️ IMPORTANTE!
2. **Start Command:** `node index.js`
3. Railway detectará automaticamente o `package.json`

### Passo 4: Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione todas as variáveis do seu `.env`:

```env
# Google Cloud
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=https://seu-backend.railway.app/api/auth/callback
GOOGLE_CLOUD_VISION_ENABLED=true

# Supabase
SUPABASE_URL=https://vgrelrhpkpcrtoibeykv.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_completa
SUPABASE_SERVICE_KEY=sua_service_key_completa

# Backend
BACKEND_PORT=4000
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app

# Session
SESSION_SECRET=uma_chave_secreta_aleatoria_aqui
```

**⚠️ IMPORTANTE:**
- `GOOGLE_REDIRECT_URI` - Você vai atualizar DEPOIS com a URL real do Railway
- `FRONTEND_URL` - Você vai atualizar DEPOIS com a URL do Vercel

### Passo 5: Obter URL Pública

1. No Railway, clique em **Settings**
2. Em **Networking**, clique em **"Generate Domain"**
3. Copie a URL gerada (ex: `https://photofinder-backend.railway.app`)
4. **Esta é a URL que você usará no Vercel!** ✅

### Passo 6: Atualizar Variáveis

Agora que você tem a URL do backend:

1. **No Railway**, atualize:
   ```env
   GOOGLE_REDIRECT_URI=https://photofinder-backend.railway.app/api/auth/callback
   ```

2. **No Google Cloud Console:**
   - Adicione: `https://photofinder-backend.railway.app/api/auth/callback`
   - Em "URIs de redirecionamento autorizados"

3. **Reinicie o backend** no Railway

---

## 🌐 Opção 2: Deploy no Render

### Passo 1: Criar Conta

1. Acesse: https://render.com
2. Faça login com GitHub
3. Clique em **"New +"** → **"Web Service"**

### Passo 2: Conectar Repositório

1. Conecte seu repositório GitHub
2. Configure:
   - **Name:** `photofinder-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`

### Passo 3: Configurar Variáveis

Adicione todas as variáveis de ambiente (mesmas do Railway)

### Passo 4: Obter URL

Render gera automaticamente uma URL como:
`https://photofinder-backend.onrender.com`

---

## 📝 Resumo: O que você precisa fazer

### 1. Deploy do Backend (Railway ou Render)
   - ✅ Obter URL pública (ex: `https://photofinder-backend.railway.app`)

### 2. Atualizar Configurações
   - ✅ Atualizar `GOOGLE_REDIRECT_URI` no backend com a URL real
   - ✅ Adicionar URL no Google Cloud Console
   - ✅ Reiniciar backend

### 3. Deploy do Frontend (Vercel)
   - ✅ Configurar `NEXT_PUBLIC_BACKEND_URL` com a URL do backend
   - ✅ Fazer deploy

### 4. Atualizar Backend Novamente
   - ✅ Atualizar `FRONTEND_URL` com a URL do Vercel
   - ✅ Reiniciar backend

---

## 🔄 Fluxo Completo

```
1. Deploy Backend (Railway)
   ↓
2. Obter URL: https://backend.railway.app
   ↓
3. Atualizar GOOGLE_REDIRECT_URI no backend
   ↓
4. Adicionar URL no Google Cloud Console
   ↓
5. Deploy Frontend (Vercel)
   ↓
6. Configurar NEXT_PUBLIC_BACKEND_URL = https://backend.railway.app
   ↓
7. Obter URL do Vercel: https://frontend.vercel.app
   ↓
8. Atualizar FRONTEND_URL no backend
   ↓
9. Pronto! ✅
```

---

## 💡 Dica

**Anote suas URLs:**
- Backend: `https://________________.railway.app`
- Frontend: `https://________________.vercel.app` (depois do deploy)

Isso facilita na hora de configurar tudo!

---

## 🐛 Troubleshooting

### Backend não inicia

**Verifique:**
- Variáveis de ambiente estão todas configuradas?
- `NODE_ENV=production` está definido?
- Logs do Railway/Render mostram algum erro?

### Erro de conexão

**Verifique:**
- URL do backend está acessível? (abra no navegador)
- CORS está configurado corretamente?
- Firewall não está bloqueando?

---

**Pronto!** Agora você sabe que precisa fazer deploy do backend primeiro! 🚀

