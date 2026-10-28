# 🔑 Configurar Acesso ao GitHub - agenda-prog/photofinder

## 📊 Situação Atual

- ✅ Repositório existe: https://github.com/agenda-prog/photofinder
- ✅ Repositório vazio (aguardando primeiro push)
- ❌ Remote não configurado ainda
- ⚠️ Problema: Conta do projeto (agenda-prog) vs usuário local (robso)

---

## 🔧 Solução: Configurar Acesso

### Opção 1: Personal Access Token (Mais Simples) ⭐

#### 1. Criar Token de Acesso

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note:** "PhotoFinder - Desktop Robso"
   - **Expiration:** 90 days (ou No expiration)
   - **Scopes:** Marque:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (se for usar GitHub Actions)
4. Clique em **"Generate token"**
5. **⚠️ COPIE O TOKEN AGORA!** (não poderá ver depois)

#### 2. Configurar Repositório

```powershell
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive

# Adicionar remote com o repositório da organização
git remote add origin https://github.com/agenda-prog/photofinder.git

# Verificar
git remote -v
```

#### 3. Fazer Primeiro Commit e Push

```powershell
# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "feat: PhotoFinder v1.0 - Sistema completo

- Autenticação OAuth Google
- Sincronização Google Drive  
- Filtros avançados (8 tipos)
- Edição em lote (pessoa, local, evento)
- Download individual e em lote
- Conversão HEIC→JPEG automática
- Tags na importação
- Geocodificação GPS
- Interface moderna e responsiva
- Análise de IA (código pronto, aguardando faturamento)

Status: 95% completo e funcional"

# Renomear branch
git branch -M main

# Push (vai pedir credenciais)
git push -u origin main
```

#### 4. Quando Pedir Credenciais

**Username:** `agenda-prog` (ou seu email da conta)  
**Password:** **COLE O TOKEN** (não é a senha, é o token!)

---

### Opção 2: SSH (Mais Seguro, Requer Configuração)

#### 1. Gerar Chave SSH (se não tiver)

```powershell
ssh-keygen -t ed25519 -C "agenda@jadyeldajupi.com.br"
```

Pressione Enter para aceitar local padrão.

#### 2. Copiar Chave Pública

```powershell
cat ~/.ssh/id_ed25519.pub
```

Copie todo o conteúdo.

#### 3. Adicionar no GitHub

1. Acesse: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. Title: "Desktop Robso - PhotoFinder"
4. Key: Cole a chave pública
5. Clique em **"Add SSH key"**

#### 4. Configurar Repositório

```powershell
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive

# Adicionar remote com SSH
git remote add origin git@github.com:agenda-prog/photofinder.git

# Fazer commit e push
git add .
git commit -m "feat: PhotoFinder v1.0 - Sistema completo"
git branch -M main
git push -u origin main
```

---

### Opção 3: GitHub Desktop (Interface Gráfica)

#### 1. Instalar GitHub Desktop

Download: https://desktop.github.com

#### 2. Fazer Login

- Login com conta que tem acesso ao `agenda-prog`

#### 3. Adicionar Repositório Local

1. File → Add Local Repository
2. Escolher: `C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive`
3. Publish repository → agenda-prog/photofinder

---

## 🔐 Gerenciamento de Permissões

### Se você NÃO tem acesso ao agenda-prog:

#### Opção A: Solicitar Acesso
1. Owner do `agenda-prog` deve:
2. Ir em: https://github.com/orgs/agenda-prog/people
3. Convidar você como colaborador
4. Você aceita o convite
5. Depois pode fazer push normalmente

#### Opção B: Fazer Fork (Desenvolvimento)
```powershell
# Fazer fork no GitHub (via web)
# Clonar seu fork
git remote add origin https://github.com/SEU_USUARIO/photofinder.git

# Desenvolver no seu fork
# Depois: Pull Request para agenda-prog/photofinder
```

---

## 🎯 Comandos Rápidos (Depois de Configurado)

### Verificar Remote Atual:
```powershell
git remote -v
```

### Se Remote Errado, Corrigir:
```powershell
# Remover remote errado
git remote remove origin

# Adicionar correto
git remote add origin https://github.com/agenda-prog/photofinder.git
```

### Configurar Credenciais (uma vez):
```powershell
# Windows Credential Manager salvará automaticamente
# Depois do primeiro push com token, não pede mais
```

---

## 📝 Checklist de Configuração

- [ ] Criar Personal Access Token no GitHub
- [ ] Adicionar remote: `git remote add origin https://github.com/agenda-prog/photofinder.git`
- [ ] Fazer primeiro commit: `git add . && git commit -m "..."`
- [ ] Renomear branch: `git branch -M main`
- [ ] Fazer push: `git push -u origin main`
- [ ] Usar token como senha quando pedir
- [ ] Verificar no GitHub se subiu

---

## 🐛 Possíveis Erros

### Erro: "Permission denied"
**Solução:** Use Personal Access Token como senha, não sua senha do GitHub

### Erro: "Authentication failed"
**Solução:** 
1. Verifique se o token tem permissão `repo`
2. Use token como senha, não a senha da conta

### Erro: "Repository not found"
**Solução:**
1. Verifique se você tem acesso ao `agenda-prog/photofinder`
2. Peça ao owner para te adicionar como colaborador

---

## 🚀 Comandos Exatos para Executar

```powershell
# 1. Navegar para o projeto
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive

# 2. Adicionar remote
git remote add origin https://github.com/agenda-prog/photofinder.git

# 3. Verificar remote
git remote -v

# 4. Adicionar arquivos
git add .

# 5. Fazer commit
git commit -m "feat: PhotoFinder v1.0 - Sistema completo de organização de fotos"

# 6. Renomear branch para main
git branch -M main

# 7. Push inicial (VAI PEDIR CREDENCIAIS)
git push -u origin main

# Quando pedir:
# Username: agenda-prog (ou email da conta)
# Password: [COLE SEU TOKEN AQUI]
```

---

## 💡 Recomendação

**Use Personal Access Token (Opção 1)** porque:
- ✅ Mais simples
- ✅ Funciona imediatamente
- ✅ Windows salva credenciais automaticamente
- ✅ Não precisa configurar SSH

---

## 📞 Próximos Passos

1. **Criar Token:** https://github.com/settings/tokens
2. **Executar comandos** acima
3. **Usar token** como senha
4. **Verificar:** https://github.com/agenda-prog/photofinder

---

**Quer que eu execute os comandos ou você prefere fazer manualmente?** 🤔

Posso executar tudo exceto o push (que requer suas credenciais).

