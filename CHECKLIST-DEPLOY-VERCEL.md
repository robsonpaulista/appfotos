# ✅ Checklist: Deploy no Vercel

Use este checklist para garantir que tudo está pronto antes do deploy.

---

## 📋 Pré-Deploy

### Código
- [x] `vercel.json` configurado
- [x] `frontend/next.config.js` atualizado para produção
- [x] `backend/index.js` com CORS para Vercel
- [x] Scripts keep-alive criados
- [x] Schema do banco executado no Supabase
- [ ] Código commitado e no GitHub

### Backend
- [ ] Backend deployado (Railway/Render/etc)
- [ ] URL do backend anotada (ex: `https://photofinder-backend.railway.app`)
- [ ] Variáveis de ambiente do backend configuradas
- [ ] Endpoint `/api/keep-alive` funcionando
- [ ] Google OAuth configurado no backend

### Supabase
- [ ] Projeto despausado
- [ ] Tabelas criadas (photos, users, photo_tags, sync_events)
- [ ] Credenciais anotadas:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_KEY

### Google Cloud
- [ ] OAuth Client ID criado
- [ ] URI de redirecionamento configurada:
  - [ ] `http://localhost:4000/api/auth/callback` (desenvolvimento)
  - [ ] `https://seu-backend.railway.app/api/auth/callback` (produção)

---

## 🚀 Deploy no Vercel

### Passo 1: Conectar Repositório
- [ ] Acessou https://vercel.com
- [ ] Fez login
- [ ] Clicou em "Add New Project"
- [ ] Autorizou acesso ao GitHub (se necessário)
- [ ] Selecionou o repositório

### Passo 2: Configurar Projeto
- [ ] **Root Directory:** `frontend` ⚠️ IMPORTANTE!
- [ ] **Framework:** Next.js (detectado automaticamente)
- [ ] **Build Command:** `npm run build` (padrão)
- [ ] **Output Directory:** `.next` (padrão)
- [ ] Clicou em "Deploy"

### Passo 3: Configurar Variáveis de Ambiente
- [ ] No Vercel, foi em **Settings → Environment Variables**
- [ ] Adicionou: `NEXT_PUBLIC_BACKEND_URL`
  - Valor: `https://seu-backend.railway.app` (URL real do backend)
- [ ] Clicou em "Save"
- [ ] Fez **Redeploy** do projeto

### Passo 4: Atualizar Google OAuth
- [ ] No Google Cloud Console
- [ ] Adicionou URI de redirecionamento:
  - `https://seu-backend.railway.app/api/auth/callback`
- [ ] Salvou as alterações

### Passo 5: Atualizar Backend
- [ ] No backend (Railway/etc), atualizou:
  - `FRONTEND_URL=https://seu-app.vercel.app`
  - `GOOGLE_REDIRECT_URI=https://seu-backend.railway.app/api/auth/callback`
- [ ] Reiniciou o backend

---

## 🧪 Testes Pós-Deploy

### Frontend
- [ ] Acessou a URL do Vercel
- [ ] Página carregou sem erros
- [ ] Não há erros no console do navegador

### Autenticação
- [ ] Clicou em "Entrar com Google"
- [ ] Redirecionou para Google
- [ ] Autorizou o acesso
- [ ] Voltou para a aplicação
- [ ] Login funcionou ✅

### Funcionalidades
- [ ] Fotos carregam
- [ ] Filtros funcionam
- [ ] Navegação funciona
- [ ] Imagens aparecem corretamente

---

## 🔧 Configurações Adicionais (Opcional)

### Keep-Alive Automático
- [ ] Configurou Task Scheduler (Windows) ou
- [ ] Configurou cron-job.org para chamar:
  - `https://seu-backend.railway.app/api/keep-alive`
  - Intervalo: A cada 6 dias

### Domínio Customizado
- [ ] Adicionou domínio no Vercel
- [ ] Configurou DNS
- [ ] Aguardou propagação

---

## 📝 URLs Importantes

Anote aqui suas URLs:

- **Frontend Vercel:** `https://________________.vercel.app`
- **Backend:** `https://________________.railway.app`
- **Supabase:** `https://________________.supabase.co`

---

## 🐛 Problemas Comuns

### Build falha
- [ ] Verificou logs do build no Vercel
- [ ] Testou build local: `cd frontend && npm run build`
- [ ] Corrigiu erros e fez push novamente

### Erro de conexão com backend
- [ ] Verificou `NEXT_PUBLIC_BACKEND_URL` no Vercel
- [ ] Verificou se backend está acessível
- [ ] Verificou CORS no backend

### OAuth não funciona
- [ ] Verificou URI no Google Cloud Console
- [ ] Verificou `GOOGLE_REDIRECT_URI` no backend
- [ ] Verificou `FRONTEND_URL` no backend

---

## ✅ Tudo Pronto?

Se todos os itens acima estão marcados, seu deploy está completo! 🎉

**Próximos passos:**
- Compartilhar com usuários
- Monitorar performance
- Configurar analytics (opcional)

