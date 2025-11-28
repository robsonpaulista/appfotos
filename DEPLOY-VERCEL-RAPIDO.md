# 🚀 Deploy Rápido no Vercel

Guia passo a passo para fazer deploy do PhotoFinder no Vercel.

## ✅ Pré-requisitos

- [ ] Conta no Vercel (gratuita): https://vercel.com
- [ ] Código no GitHub (ou GitLab/Bitbucket)
- [ ] Backend já configurado (Railway, Render, ou outro)
- [ ] Variáveis de ambiente do backend prontas

## 🔗 Repositório em Conta Diferente?

**Não tem problema!** O Vercel permite conectar repositórios de outras contas GitHub. 

Quando você autorizar o Vercel no GitHub, ele terá acesso aos repositórios que você permitir, mesmo que sejam de contas diferentes.

📖 **Veja o guia completo:** `CONECTAR-GIT-VERCEL.md`

---

## 📦 Passo 1: Preparar o Código

### 1.1 Verificar se está tudo commitado

```bash
git status
git add .
git commit -m "Preparar para deploy no Vercel"
git push
```

### 1.2 Testar build localmente (opcional)

```bash
cd frontend
npm install
npm run build
npm start
```

Se funcionar localmente, vai funcionar no Vercel! ✅

---

## 🚀 Passo 2: Deploy no Vercel

### Opção A: Via Interface Web (Recomendado)

1. **Acesse:** https://vercel.com
2. **Faça login** (pode usar GitHub)
3. **Clique em "Add New Project"**
4. **Importe seu repositório:**
   - Selecione o repositório do GitHub
   - ⚠️ **Importante:** Mesmo que o repositório seja de outra conta GitHub, o Vercel pode acessá-lo!
   - Se não aparecer, clique em **"Configure GitHub App"** e autorize o acesso
   - Clique em "Import"

   
   **💡 Dica:** O Vercel pedirá permissão para acessar repositórios. Você pode escolher "Only select repositories" para dar acesso apenas ao repositório necessário.

5. **Configure o projeto:**
   - **Framework Preset:** Next.js (detectado automaticamente)
   - **Root Directory:** `frontend` ⚠️ **IMPORTANTE!**
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)
   - **Install Command:** `npm install` (padrão)

6. **Clique em "Deploy"**

### Opção B: Via CLI

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Fazer login
vercel login

# No diretório raiz do projeto
vercel

# Seguir as instruções:
# - Link to existing project? No
# - Project name: photofinder (ou o nome que quiser)
# - Directory: frontend
# - Override settings? No
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

Após o primeiro deploy, configure as variáveis:

1. **No painel do Vercel**, vá em **Settings → Environment Variables**

2. **Adicione as seguintes variáveis:**

```env
NEXT_PUBLIC_BACKEND_URL=https://seu-backend.railway.app
```

**⚠️ IMPORTANTE:**
- Substitua `https://seu-backend.railway.app` pela URL real do seu backend
- Use `https://` (não `http://`)
- Não precisa de barra no final

3. **Clique em "Save"**

4. **Redeploy o projeto:**
   - Vá em **Deployments**
   - Clique nos 3 pontos (...) no último deployment
   - Clique em "Redeploy"

---

## 🔗 Passo 4: Configurar Google OAuth

### 4.1 Atualizar Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Vá em **APIs e Serviços → Credenciais**
3. Clique no seu **OAuth 2.0 Client ID**
4. Em **"URIs de redirecionamento autorizados"**, adicione:
   ```
   https://seu-backend.railway.app/api/auth/callback
   ```
   ⚠️ Use a URL do **BACKEND**, não do frontend!

5. Clique em **"Salvar"**

### 4.2 Verificar Backend

Certifique-se de que o backend tem:
```env
GOOGLE_REDIRECT_URI=https://seu-backend.railway.app/api/auth/callback
FRONTEND_URL=https://seu-app.vercel.app
```

---

## ✅ Passo 5: Testar

1. **Acesse a URL do Vercel:**
   - Exemplo: `https://photofinder.vercel.app`
   - Você receberá uma URL após o deploy

2. **Teste a autenticação:**
   - Clique em "Entrar com Google"
   - Deve funcionar! ✅

3. **Teste outras funcionalidades:**
   - [ ] Login funciona
   - [ ] Fotos carregam
   - [ ] Filtros funcionam
   - [ ] Navegação funciona

---

## 🔧 Configurações Adicionais

### Domínio Customizado (Opcional)

1. No Vercel, vá em **Settings → Domains**
2. Adicione seu domínio (ex: `photofinder.com`)
3. Configure DNS conforme instruções
4. Aguarde propagação (pode levar até 24h)

### Analytics (Opcional)

```bash
cd frontend
npm install @vercel/analytics
```

```typescript
// frontend/pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

---

## 🐛 Troubleshooting

### Erro: "Build failed"

**Causa:** Dependências faltando ou erro no código

**Solução:**
1. Verifique os logs do build no Vercel
2. Teste build localmente: `cd frontend && npm run build`
3. Corrija os erros e faça push novamente

### Erro: "Cannot connect to backend"

**Causa:** `NEXT_PUBLIC_BACKEND_URL` não configurado ou incorreto

**Solução:**
1. Verifique se a variável está configurada no Vercel
2. Verifique se a URL está correta (com `https://`)
3. Verifique se o backend está acessível publicamente
4. Faça redeploy após alterar variáveis

### Erro: "OAuth redirect_uri_mismatch"

**Causa:** URI de redirecionamento não configurada no Google

**Solução:**
1. Verifique se adicionou a URI do backend no Google Cloud Console
2. Use a URL do **backend**, não do frontend
3. Aguarde alguns minutos para propagação

### Frontend não encontra o backend

**Causa:** CORS não configurado no backend

**Solução:**
No backend, certifique-se de que o CORS permite o domínio do Vercel:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://seu-app.vercel.app',
    /\.vercel\.app$/  // Permite todos os subdomínios do Vercel
  ],
  credentials: true
}));
```

---

## 📊 Monitoramento

### Ver Logs

1. No Vercel, vá em **Deployments**
2. Clique no deployment
3. Veja os logs em tempo real

### Ver Analytics

1. No Vercel, vá em **Analytics**
2. Veja métricas de performance
3. Configure alertas se necessário

---

## 🎉 Pronto!

Seu PhotoFinder está no ar! 🚀

**Próximos passos:**
- [ ] Compartilhar com usuários
- [ ] Monitorar performance
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar analytics (opcional)

---

## 📝 Checklist Final

- [ ] Código no GitHub
- [ ] Deploy no Vercel feito
- [ ] Variável `NEXT_PUBLIC_BACKEND_URL` configurada
- [ ] Google OAuth configurado
- [ ] Backend acessível publicamente
- [ ] Teste de login funcionando
- [ ] Teste de funcionalidades básicas

---

**Dúvidas?** Consulte a documentação completa em `DEPLOY.md`

