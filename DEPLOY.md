# 🚀 Guia de Deploy - PhotoFinder

Este guia fornece instruções para fazer deploy do PhotoFinder em produção.

## 📋 Opções de Deploy

### Opção 1: Vercel (Frontend) + Railway (Backend) [Recomendado]

#### Custos Estimados:
- Vercel: Gratuito (Hobby plan)
- Railway: ~$5-10/mês
- Supabase: Gratuito até 500MB
- **Total: ~$5-10/mês**

---

## 🎯 Deploy do Frontend (Vercel)

### Passo 1: Preparar o Projeto

```bash
cd frontend

# Testar build localmente
npm run build
npm start
```

### Passo 2: Deploy no Vercel

**Opção A: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel
```

**Opção B: Via GitHub**

1. Faça push do código para o GitHub
2. Acesse https://vercel.com/
3. Clique em "Import Project"
4. Selecione seu repositório
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Passo 3: Configurar Variáveis de Ambiente

No painel da Vercel, vá em Settings → Environment Variables e adicione:

```
NEXT_PUBLIC_BACKEND_URL=https://seu-backend.railway.app
NEXT_PUBLIC_APP_NAME=PhotoFinder
```

### Passo 4: Testar

Acesse a URL fornecida pela Vercel e teste se o frontend está funcionando.

---

## 🚂 Deploy do Backend (Railway)

### Passo 1: Criar Conta

1. Acesse https://railway.app/
2. Crie uma conta (pode usar GitHub)
3. Clique em "New Project"

### Passo 2: Deploy via GitHub

1. Selecione "Deploy from GitHub repo"
2. Escolha seu repositório
3. Configure:
   - **Root Directory:** `/backend`
   - **Start Command:** `node index.js`

### Passo 3: Configurar Variáveis de Ambiente

No Railway, vá em Variables e adicione todas as variáveis do `.env`:

```env
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=https://seu-backend.railway.app/api/auth/callback

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_KEY=sua_service_key

BACKEND_PORT=4000
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app

SESSION_SECRET=sua_chave_secreta_super_forte_aqui

GOOGLE_CLOUD_VISION_ENABLED=false
```

### Passo 4: Configurar Domínio Público

1. No Railway, clique em "Settings"
2. Em "Networking", clique em "Generate Domain"
3. Copie a URL gerada (ex: `https://photofinder-backend.railway.app`)

### Passo 5: Atualizar Google Cloud Console

1. Vá no Google Cloud Console → Credenciais
2. Edite seu OAuth Client ID
3. Adicione aos URIs de redirecionamento:
   ```
   https://seu-backend.railway.app/api/auth/callback
   ```

### Passo 6: Atualizar Frontend

1. No Vercel, atualize a variável `NEXT_PUBLIC_BACKEND_URL`
2. Redeploy o frontend

---

## 🎯 Deploy Alternativo: Tudo na Vercel (Serverless)

Se preferir manter tudo na Vercel:

### Estrutura do Projeto

```
photofinder/
├── api/                  # Backend como Serverless Functions
│   ├── auth/
│   │   ├── url.js
│   │   ├── callback.js
│   │   └── status.js
│   ├── photos/
│   │   ├── index.js
│   │   └── [id].js
│   └── sync/
│       ├── start.js
│       └── status.js
├── frontend/            # Next.js app
└── vercel.json
```

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

**Limitações:**
- Serverless functions têm timeout (10s no plan gratuito)
- Sincronização de muitas fotos pode falhar
- Não recomendado para grandes volumes

---

## 🐘 Deploy do Banco de Dados (Supabase)

O Supabase já está na nuvem! Apenas:

1. ✅ Certifique-se de que o schema SQL foi executado
2. ✅ Configure as variáveis de ambiente em produção
3. ✅ Monitore o uso no dashboard do Supabase

**Limites do Plano Gratuito:**
- 500 MB de armazenamento
- 2 GB de transferência/mês
- Pausa após 1 semana de inatividade

Para produção, considere o plano Pro (~$25/mês).

---

## 🔧 Configuração Adicional

### SSL/HTTPS

✅ Vercel e Railway fornecem SSL automaticamente!

### Domínio Customizado

#### Frontend (Vercel)

1. No Vercel, vá em Settings → Domains
2. Adicione seu domínio (ex: `photofinder.com`)
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

#### Backend (Railway)

1. No Railway, vá em Settings → Networking
2. Adicione Custom Domain
3. Configure DNS conforme instruções

### Monitoramento

**Vercel Analytics:**
```bash
npm i @vercel/analytics
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

**Railway Logs:**
- Acesse o dashboard do Railway
- Clique em "View Logs"
- Configure alertas para erros

### Backup do Banco de Dados

1. No Supabase, vá em Database → Backups
2. Configure backups automáticos (disponível no plano Pro)
3. Ou use pg_dump manualmente:

```bash
pg_dump -h db.seu-projeto.supabase.co \
  -U postgres \
  -d postgres \
  > backup.sql
```

---

## 📊 Monitoramento de Custos

### Vercel
- **Hobby:** Gratuito
  - 100 GB bandwidth
  - Builds ilimitados
  
### Railway
- **Starter:** $5/mês
  - $5 de crédito incluído
  - ~$0.000231/min de uso
  
### Supabase
- **Free:** Gratuito
  - 500 MB de storage
  - 2 GB bandwidth/mês
  
- **Pro:** $25/mês
  - 8 GB de storage
  - 50 GB bandwidth/mês

**Total Estimado:** $5-35/mês dependendo do uso

---

## 🔒 Segurança em Produção

### Checklist

- [ ] `NODE_ENV=production`
- [ ] HTTPS habilitado
- [ ] Secrets fortes e únicos
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Logs de erros monitorados
- [ ] Backups configurados

### Rate Limiting (Recomendado)

```javascript
// backend/index.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições
});

app.use('/api/', limiter);
```

---

## 🧪 Testes Pós-Deploy

### Checklist de Testes

- [ ] Login com Google funciona
- [ ] Sincronização de fotos funciona
- [ ] Filtros retornam resultados corretos
- [ ] Detalhes da foto carregam corretamente
- [ ] Edição de metadados funciona
- [ ] Logout funciona
- [ ] Performance é aceitável (< 3s de load)
- [ ] Funciona em mobile
- [ ] Funciona em diferentes navegadores

### Testes de Carga

```bash
# Instalar Apache Bench
sudo apt install apache2-utils

# Testar endpoint
ab -n 1000 -c 10 https://seu-backend.railway.app/api/photos
```

---

## 🐛 Troubleshooting em Produção

### Erro 500 no Backend

1. Verifique logs no Railway
2. Confira variáveis de ambiente
3. Teste conectividade com Supabase

### Frontend não conecta ao Backend

1. Verifique `NEXT_PUBLIC_BACKEND_URL`
2. Confira configuração de CORS
3. Teste URL do backend manualmente

### Timeout em Sincronização

1. Reduza tamanho do batch
2. Implemente queue system (Bull + Redis)
3. Use workers dedicados

---

## 📈 Próximos Passos

Após deploy bem-sucedido:

1. 📊 Configure analytics
2. 🔔 Configure alertas de erro
3. 💾 Configure backups automáticos
4. 📱 Teste em dispositivos reais
5. 🚀 Compartilhe com usuários beta
6. 📝 Colete feedback
7. 🔄 Itere e melhore

---

## 🆘 Suporte

Se encontrar problemas durante o deploy:

1. Verifique logs do Railway/Vercel
2. Consulte a documentação oficial
3. Abra uma issue no repositório

---

**Bom deploy! 🚀**

