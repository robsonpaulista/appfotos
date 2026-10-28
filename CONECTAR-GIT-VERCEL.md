# 🔗 Conectar Repositório Git ao Vercel

Guia para conectar um repositório Git de uma conta diferente ao Vercel.

## ✅ Solução: Vercel aceita repositórios de outras contas!

O Vercel permite conectar repositórios do GitHub/GitLab/Bitbucket mesmo que sejam de contas diferentes. Você tem algumas opções:

---

## 🎯 Opção 1: Conectar Diretamente (Recomendado)

### Passo a Passo:

1. **Acesse o Vercel:**
   - Vá em: https://vercel.com
   - Faça login com a conta que você quer usar

2. **Adicione o Repositório:**
   - Clique em **"Add New Project"**
   - Clique em **"Import Git Repository"**

3. **Autorize o Acesso:**
   - O Vercel vai pedir permissão para acessar repositórios do GitHub
   - Você pode escolher:
     - **"Only select repositories"** - Escolher apenas o repositório específico
     - **"All repositories"** - Dar acesso a todos (menos seguro)

4. **Selecione o Repositório:**
   - Mesmo que o repositório seja de outra conta, ele aparecerá na lista
   - Se não aparecer, clique em **"Configure GitHub App"** e ajuste as permissões

5. **Configure o Projeto:**
   - **Root Directory:** `frontend`
   - **Framework:** Next.js
   - Clique em **"Deploy"**

### ✅ Vantagens:
- ✅ Funciona automaticamente
- ✅ Deploy automático a cada push
- ✅ Não precisa compartilhar o repositório
- ✅ Mantém controle de acesso

---

## 🔄 Opção 2: Compartilhar Repositório com a Conta do Vercel

Se você quiser que a conta do Vercel tenha acesso direto:

### Passo a Passo:

1. **No GitHub (conta onde está o repositório):**
   - Vá no repositório
   - Clique em **Settings → Collaborators**
   - Clique em **"Add people"**
   - Digite o username da conta do Vercel
   - Dê permissão de **"Write"** ou **"Admin"**

2. **No Vercel:**
   - Faça login com a conta que você adicionou como colaborador
   - Agora o repositório aparecerá na lista de repositórios disponíveis

### ⚠️ Considerações:
- A conta do Vercel terá acesso ao repositório
- Pode fazer commits e alterações
- Use apenas se confiar na conta

---

## 🚀 Opção 3: Deploy Manual via CLI (Sem Git)

Se preferir não conectar o Git:

### Passo a Passo:

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Fazer Login:**
   ```bash
   vercel login
   ```
   - Isso abre o navegador para autenticar

3. **No diretório do projeto:**
   ```bash
   cd frontend
   vercel
   ```

4. **Seguir as instruções:**
   - Link to existing project? **No** (primeira vez)
   - Project name: **photofinder** (ou o nome que quiser)
   - Directory: **.** (ponto, já estamos no frontend)
   - Override settings? **No**

5. **Configurar variáveis de ambiente:**
   ```bash
   vercel env add NEXT_PUBLIC_BACKEND_URL
   # Digite: https://seu-backend.railway.app
   ```

6. **Para atualizar:**
   ```bash
   vercel --prod
   ```

### ⚠️ Desvantagens:
- ❌ Não tem deploy automático
- ❌ Precisa fazer deploy manual a cada mudança
- ❌ Mais trabalhoso

---

## 🎯 Recomendação: Opção 1

**Use a Opção 1** (conectar diretamente). É a mais simples e funciona perfeitamente mesmo com contas diferentes.

### Por que funciona?

O Vercel usa OAuth do GitHub. Quando você autoriza, ele recebe permissão para:
- Ler repositórios públicos
- Ler repositórios privados (se você der permissão)
- Acessar webhooks para deploy automático

**Não importa de qual conta GitHub o repositório é!** O Vercel só precisa de permissão para acessá-lo.

---

## 🔒 Segurança

### Permissões Recomendadas:

1. **No GitHub App do Vercel:**
   - Escolha **"Only select repositories"**
   - Selecione apenas o repositório do PhotoFinder
   - Isso limita o acesso apenas ao necessário

2. **Permissões Mínimas:**
   - ✅ Read access to code
   - ✅ Read access to metadata
   - ✅ Read and write access to pull requests (para previews)
   - ❌ Não precisa de: Write access to code (a menos que use Vercel Git)

---

## 🐛 Troubleshooting

### Problema: Repositório não aparece na lista

**Solução:**
1. Verifique se você autorizou o Vercel no GitHub
2. Vá em: https://github.com/settings/applications
3. Encontre "Vercel" e verifique as permissões
4. Se necessário, revogue e autorize novamente

### Problema: "Repository not found"

**Solução:**
1. Verifique se o repositório é privado
2. Se for privado, certifique-se de que deu permissão ao Vercel
3. Tente adicionar como colaborador (Opção 2)

### Problema: Deploy automático não funciona

**Solução:**
1. Verifique se os webhooks estão configurados
2. No Vercel, vá em Settings → Git
3. Verifique se o repositório está conectado
4. Teste fazendo um push e veja se o deploy inicia automaticamente

---

## 📝 Checklist

- [ ] Conta do Vercel criada
- [ ] Repositório GitHub identificado
- [ ] Vercel autorizado no GitHub
- [ ] Repositório selecionado no Vercel
- [ ] Root Directory configurado como `frontend`
- [ ] Variáveis de ambiente configuradas
- [ ] Primeiro deploy feito com sucesso
- [ ] Deploy automático testado (fazer um push)

---

## 🎉 Pronto!

Agora você pode fazer deploy mesmo com contas diferentes! O Vercel é bem flexível nesse aspecto.

**Dica:** Se tiver problemas, a Opção 1 (conectar diretamente) é sempre a mais confiável.

