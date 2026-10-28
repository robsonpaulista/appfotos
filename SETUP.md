# 🚀 Guia de Configuração Rápida - PhotoFinder

Este guia fornece instruções passo a passo para configurar o PhotoFinder do zero.

## ⏱️ Tempo estimado: 30-45 minutos

---

## 📝 Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Conta Google Cloud criada
- [ ] Conta Supabase criada
- [ ] Editor de código instalado

---

## 1️⃣ Configuração do Google Cloud Platform (15 min)

### Passo 1.1: Criar Projeto

1. Acesse https://console.cloud.google.com/
2. Clique em **Selecionar um projeto** → **Novo projeto**
3. Nome: `photofinder`
4. Clique em **Criar**

### Passo 1.2: Ativar APIs

1. No menu lateral, vá em **APIs e serviços** → **Biblioteca**
2. Busque e ative as seguintes APIs:
   - ✅ **Google Drive API**
   - ✅ **Google People API**
   - ✅ **Google Cloud Vision API** (opcional)

### Passo 1.3: Configurar Tela de Consentimento OAuth

1. Vá em **APIs e serviços** → **Tela de consentimento OAuth**
2. Escolha **Externo** (para testes) ou **Interno** (se tiver Google Workspace)
3. Preencha:
   - Nome do app: `PhotoFinder`
   - E-mail de suporte: seu e-mail
   - Domínio da página inicial: `http://localhost:3000`
   - E-mail de contato do desenvolvedor: seu e-mail
4. Clique em **Salvar e continuar**
5. Em **Escopos**, clique em **Adicionar ou remover escopos** e adicione:
   - `/auth/drive.readonly`
   - `/auth/userinfo.profile`
   - `/auth/userinfo.email`
6. Salve e continue
7. Em **Usuários de teste**, adicione seu e-mail do Google
8. Clique em **Salvar e continuar**

### Passo 1.4: Criar Credenciais OAuth 2.0

1. Vá em **APIs e serviços** → **Credenciais**
2. Clique em **Criar credenciais** → **ID do cliente OAuth**
3. Tipo de aplicativo: **Aplicativo da Web**
4. Nome: `PhotoFinder Client`
5. **URIs de redirecionamento autorizados**, adicione:
   ```
   http://localhost:4000/api/auth/callback
   ```
6. Clique em **Criar**
7. **IMPORTANTE:** Copie e salve:
   - ✅ Client ID
   - ✅ Client Secret

---

## 2️⃣ Configuração do Supabase (10 min)

### Passo 2.1: Criar Projeto

1. Acesse https://supabase.com/
2. Clique em **Start your project**
3. Crie uma conta ou faça login
4. Clique em **New Project**
5. Preencha:
   - Nome: `photofinder`
   - Database Password: crie uma senha forte (salve!)
   - Região: escolha a mais próxima
6. Clique em **Create new project** (aguarde 2-3 minutos)

### Passo 2.2: Executar Schema SQL

1. No menu lateral, vá em **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `database/schema.sql` do projeto
4. Cole no editor e clique em **Run** (▶️)
5. Aguarde a mensagem de sucesso

### Passo 2.3: Copiar Credenciais

1. No menu lateral, vá em **Settings** → **API**
2. Copie e salve:
   - ✅ Project URL
   - ✅ Project API keys → `anon` `public`
   - ✅ Project API keys → `service_role` (clique em "Reveal")

---

## 3️⃣ Configuração do Projeto Local (10 min)

### Passo 3.1: Clonar e Instalar

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd photofinder

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install

# Voltar para a raiz
cd ..
```

### Passo 3.2: Configurar Variáveis de Ambiente

#### Backend: Criar arquivo `.env` na raiz do projeto

```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env  # ou use seu editor preferido
```

Cole e preencha:

```env
# Google Cloud Configuration
GOOGLE_CLIENT_ID=cole_seu_client_id_aqui
GOOGLE_CLIENT_SECRET=cole_seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/callback

# Supabase Configuration
SUPABASE_URL=cole_seu_project_url_aqui
SUPABASE_ANON_KEY=cole_sua_anon_key_aqui
SUPABASE_SERVICE_KEY=cole_sua_service_key_aqui

# Backend Configuration
BACKEND_PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Session Secret (gere uma string aleatória)
SESSION_SECRET=minha_chave_super_secreta_123456

# Google Cloud Vision (opcional - deixe false por enquanto)
GOOGLE_CLOUD_VISION_ENABLED=false
```

#### Frontend: Criar arquivo `frontend/.env.local`

```bash
cd frontend
nano .env.local  # ou use seu editor preferido
```

Cole:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=PhotoFinder
```

---

## 4️⃣ Executar o Projeto (5 min)

### Opção A: Executar separadamente (recomendado para debug)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Aguarde ver:
```
🚀 PhotoFinder Backend rodando em http://localhost:4000
📊 Ambiente: development
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Aguarde ver:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Opção B: Executar tudo junto

```bash
# Na raiz do projeto
npm run dev
```

---

## 5️⃣ Testar a Aplicação (5 min)

### Passo 5.1: Acessar a Aplicação

1. Abra o navegador em http://localhost:3000
2. Você deve ver a tela de boas-vindas do PhotoFinder

### Passo 5.2: Fazer Login

1. Clique em **"Entrar com Google"**
2. Você será redirecionado para o Google
3. Escolha sua conta (a que você adicionou como usuário de teste)
4. Aceite as permissões solicitadas
5. Você será redirecionado de volta para o PhotoFinder

### Passo 5.3: Sincronizar Fotos

1. Clique no botão **"🔄 Sincronizar Fotos"**
2. Aguarde o processo de sincronização
3. As fotos do seu Google Drive aparecerão na galeria

### Passo 5.4: Testar Filtros

1. Use os filtros para buscar fotos:
   - Por ano
   - Por local
   - Por quantidade de rostos
2. Clique em uma foto para ver os detalhes

---

## ✅ Configuração Concluída!

Se tudo funcionou, você agora tem:

- ✅ Backend rodando em http://localhost:4000
- ✅ Frontend rodando em http://localhost:3000
- ✅ Autenticação OAuth funcionando
- ✅ Sincronização com Google Drive
- ✅ Banco de dados Supabase configurado

---

## 🐛 Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Solução:** Verifique se o URI de redirecionamento no Google Cloud Console é exatamente:
```
http://localhost:4000/api/auth/callback
```

### Erro: "Invalid Refresh Token"

**Solução:**
1. Vá no Google Cloud Console → Credenciais
2. Delete o OAuth Client ID
3. Crie um novo
4. Atualize o `.env` com as novas credenciais

### Erro de conexão com Supabase

**Solução:**
1. Verifique se as credenciais no `.env` estão corretas
2. Certifique-se de que o schema SQL foi executado
3. Teste a conexão no SQL Editor do Supabase

### Fotos não aparecem

**Solução:**
1. Verifique os logs do backend no terminal
2. Certifique-se de que tem fotos no seu Google Drive
3. Tente fazer logout e login novamente

---

## 📚 Próximos Passos

Agora que está tudo configurado:

1. 📖 Leia o [README.md](README.md) completo
2. 🤖 Ative a análise com IA (opcional)
3. 🎨 Personalize a interface
4. 🚀 Faça deploy na Vercel

---

## 💡 Dicas

- Use o **modo de desenvolvimento** do navegador (F12) para ver logs
- Monitore os logs do backend e frontend nos terminais
- Use o **SQL Editor do Supabase** para verificar os dados
- Teste primeiro com poucas fotos antes de sincronizar tudo

---

## 🆘 Precisa de Ajuda?

- Consulte o [README.md](README.md) para mais detalhes
- Verifique os logs nos terminais
- Abra uma issue no repositório

---

**Boa sorte! 🎉**
