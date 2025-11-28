# 🔧 Corrigir OAuth no Vercel - Erro redirect_uri_mismatch

## ❌ Erro Atual
```
Erro 400: redirect_uri_mismatch
Acesso bloqueado: a solicitação desse app é inválida
```

## 🔍 Causa
A URL de redirecionamento usada pelo app não está registrada no Google Cloud Console.

## ✅ Solução Passo a Passo

### 1. Descobrir a URL do seu projeto no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Clique no seu projeto
3. Vá em **Settings → Domains**
4. Anote a URL do projeto (ex: `https://appfotos.vercel.app` ou `https://appfotos-xxxxx.vercel.app`)

**OU** verifique na aba **Deployments** - a URL aparece no topo.

### 2. Adicionar URLs no Google Cloud Console

⚠️ **IMPORTANTE:** O Vercel gera URLs diferentes para cada deploy (preview e produção). Você precisa adicionar TODAS as URLs possíveis.

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services → Credentials**
3. Clique no seu **OAuth 2.0 Client ID**
4. Em **"Authorized redirect URIs"**, adicione:

   **a) URL de Produção (principal):**
   ```
   https://appfotosjadyel.vercel.app/api/auth/callback
   ```
   (Substitua `appfotosjadyel` pelo nome real do seu projeto)
   
   **b) URL de Preview (atual):**
   ```
   https://appfotosjadyel-315y1mgqy-robson-medeiros-santos-projects.vercel.app/api/auth/callback
   ```
   (Esta URL muda a cada deploy de preview - você pode adicionar várias)

   **c) Se tiver domínio customizado:**
   ```
   https://seu-dominio.com/api/auth/callback
   ```

5. Clique em **"SAVE"** (Salvar)

💡 **Dica:** Se você fizer muitos deploys de preview, considere usar apenas a URL de produção no Google Cloud e fazer merge para produção quando estiver pronto.

### 3. Verificar Variáveis de Ambiente no Vercel

1. No Vercel, vá em **Settings → Environment Variables**
2. Verifique se estas variáveis estão configuradas:
   ```
   GOOGLE_CLIENT_ID=seu-client-id
   GOOGLE_CLIENT_SECRET=seu-client-secret
   ```
3. **NÃO precisa** configurar `GOOGLE_REDIRECT_URI` - o código detecta automaticamente!

### 4. Fazer Redeploy

1. No Vercel, vá em **Deployments**
2. Clique nos **3 pontos (...)** no último deployment
3. Clique em **"Redeploy"**
4. Aguarde o deploy terminar

### 5. Testar Novamente

1. Acesse a URL do seu projeto no Vercel
2. Tente fazer login com Google
3. Deve funcionar agora! ✅

---

## 🔍 Verificar URL Usada

Se ainda não funcionar, verifique qual URL está sendo usada:

1. Abra o **Console do navegador** (F12)
2. Vá na aba **Network** (Rede)
3. Clique em "Entrar com Google"
4. Veja a requisição para `/api/auth/url`
5. Na resposta, veja o campo `redirectUri`
6. **Essa URL deve estar registrada no Google Cloud Console!**

---

## 📝 Exemplo Completo

Se seu projeto no Vercel é: `https://appfotos-abc123.vercel.app`

**No Google Cloud Console, adicione:**
```
https://appfotos-abc123.vercel.app/api/auth/callback
```

**E também pode adicionar (se tiver domínio customizado):**
```
https://appfotos.com/api/auth/callback
```

---

## ⚠️ Importante

- ✅ Use **HTTPS** (não HTTP)
- ✅ Não adicione barra no final (`/api/auth/callback` e não `/api/auth/callback/`)
- ✅ Use a URL exata do Vercel (pode ser `.vercel.app` ou domínio customizado)
- ✅ Aguarde alguns minutos após salvar no Google Cloud Console antes de testar

---

## 🆘 Ainda não funciona?

1. Verifique os logs do Vercel:
   - Vá em **Deployments → [último deploy] → Functions**
   - Clique em `/api/auth/url` ou `/api/auth/callback`
   - Veja os logs para identificar o problema

2. Verifique se as variáveis de ambiente estão corretas:
   - `GOOGLE_CLIENT_ID` deve ser o ID completo
   - `GOOGLE_CLIENT_SECRET` deve ser o secret completo

3. Limpe o cache do navegador e tente novamente

