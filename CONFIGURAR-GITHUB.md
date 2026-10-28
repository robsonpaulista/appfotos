# 🐙 Como Configurar GitHub - PhotoFinder

## 📊 Status Atual

- ✅ Git inicializado
- ✅ .gitignore configurado
- ❌ Nenhum commit ainda
- ❌ Repositório remoto não configurado

---

## 🚀 Passo a Passo Completo

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `JArchive` ou `PhotoFinder`
   - **Description:** "Organizador inteligente de fotos com IA - Google Drive + Vision API"
   - **Visibility:** Private (recomendado - tem credenciais)
   - ❌ **NÃO** marque "Initialize with README" (já temos)
3. Clique em **"Create repository"**

### 2. Fazer Primeiro Commit

Execute na pasta do projeto:

```powershell
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "feat: PhotoFinder v1.0 - Sistema completo de organização de fotos

- Autenticação OAuth Google
- Sincronização Google Drive
- Filtros avançados (8 tipos)
- Edição em lote (pessoa, local, evento)
- Download individual e em lote
- Conversão HEIC→JPEG automática
- Tags na importação
- Geocodificação GPS
- Interface moderna e responsiva
- Análise de IA (aguardando faturamento)

Status: 95% completo e funcional"
```

### 3. Conectar com GitHub

```powershell
# Adicionar remote (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/JArchive.git

# Ou se preferir SSH:
# git remote add origin git@github.com:SEU_USUARIO/JArchive.git

# Renomear branch para main (GitHub usa main, não master)
git branch -M main

# Fazer push inicial
git push -u origin main
```

### 4. Verificar

```powershell
# Ver status
git status

# Ver remotes configurados
git remote -v
```

Deve mostrar:
```
origin  https://github.com/SEU_USUARIO/JArchive.git (fetch)
origin  https://github.com/SEU_USUARIO/JArchive.git (push)
```

---

## 📋 Comandos Úteis Futuros

### Fazer novos commits:

```powershell
# Ver o que mudou
git status

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "feat: adicionar nova funcionalidade X"

# Enviar para GitHub
git push
```

### Ver histórico:

```powershell
git log --oneline
```

### Criar nova branch:

```powershell
git checkout -b feature/nova-funcionalidade
```

---

## 🔒 Segurança - IMPORTANTE!

### Arquivos Sensíveis (já no .gitignore):

✅ `.env` - **NUNCA** vai para o GitHub  
✅ `service-account-key.json` - **NUNCA** vai para o GitHub  
✅ `node_modules/` - **NUNCA** vai para o GitHub  
✅ `.cache/` - **NUNCA** vai para o GitHub  

### Verificar antes do push:

```powershell
# Ver o que será enviado
git status

# Se ver .env ou credenciais listados, NÃO FAÇA PUSH!
# Adicione ao .gitignore primeiro
```

---

## 📚 Estrutura de Commits Recomendada

### Tipos de commit:

```
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Apenas documentação
style:    Formatação, sem mudança de lógica
refactor: Refatoração de código
perf:     Melhoria de performance
test:     Adicionar testes
chore:    Manutenção, configuração
```

### Exemplos:

```powershell
git commit -m "feat: adicionar download em lote"
git commit -m "fix: corrigir filtro de cidade"
git commit -m "docs: atualizar README com instruções"
git commit -m "perf: adicionar cache de conversão HEIC"
```

---

## 🌳 Estratégia de Branches (Sugerida)

### Branch Principal:
- **`main`** - Código estável, em produção

### Branches de Desenvolvimento:
- **`develop`** - Desenvolvimento ativo
- **`feature/nome`** - Novas funcionalidades
- **`fix/nome`** - Correções de bugs

### Exemplo de Workflow:

```powershell
# Criar branch para nova feature
git checkout -b feature/albuns-personalizados

# Fazer mudanças e commits
git add .
git commit -m "feat: adicionar álbuns personalizados"

# Enviar para GitHub
git push -u origin feature/albuns-personalizados

# No GitHub: criar Pull Request
# Após aprovação: merge para main
```

---

## 🔄 Configuração Recomendada do Repositório

### No GitHub (Settings):

1. **Branches**
   - Proteger branch `main`
   - Exigir pull requests
   - Exigir revisão

2. **Secrets** (para deploy automático)
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY

3. **Actions** (CI/CD - opcional)
   - Testes automáticos
   - Deploy automático

---

## 📝 README.md já está pronto!

O arquivo `README.md` já existe e está completo com:
- ✅ Descrição do projeto
- ✅ Instruções de instalação
- ✅ Como usar
- ✅ Tecnologias utilizadas
- ✅ Screenshots (pode adicionar)

---

## 🎯 Checklist de Configuração

- [ ] Criar repositório no GitHub
- [ ] Fazer primeiro commit (`git commit`)
- [ ] Adicionar remote (`git remote add origin`)
- [ ] Renomear para main (`git branch -M main`)
- [ ] Fazer push (`git push -u origin main`)
- [ ] Verificar no GitHub se apareceu
- [ ] Configurar branch protection (opcional)
- [ ] Adicionar secrets (para deploy futuro)

---

## 💡 Dicas

### 1. Commits Frequentes
Faça commits pequenos e frequentes ao invés de um grande:
```powershell
# Bom
git commit -m "feat: adicionar botão download"
git commit -m "feat: adicionar download em lote"

# Ruim
git commit -m "feat: adicionar várias coisas"
```

### 2. Mensagens Claras
```powershell
# Bom
git commit -m "fix: corrigir erro 413 em imagens grandes"

# Ruim  
git commit -m "fix bug"
```

### 3. Ver Diferenças Antes
```powershell
# Ver o que mudou
git diff

# Ver status
git status
```

---

## 🚀 Exemplo Completo

```powershell
# 1. Navegar para o projeto
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive

# 2. Adicionar tudo
git add .

# 3. Primeiro commit
git commit -m "feat: PhotoFinder v1.0 - Sistema completo"

# 4. Criar repo no GitHub (via web)
# https://github.com/new

# 5. Conectar (SUBSTITUA seu_usuario)
git remote add origin https://github.com/seu_usuario/JArchive.git

# 6. Renomear branch
git branch -M main

# 7. Push inicial
git push -u origin main

# 8. Verificar no GitHub
# https://github.com/seu_usuario/JArchive
```

---

## 🎉 Depois de Configurado

### Workflow normal:

```powershell
# Fazer mudanças no código
# ...

# Ver o que mudou
git status

# Adicionar
git add .

# Commit
git commit -m "feat: adicionar funcionalidade X"

# Push
git push

# ✅ Pronto! No GitHub agora
```

---

## 📞 Links Úteis

- **Criar Repo:** https://github.com/new
- **GitHub Desktop:** https://desktop.github.com (interface gráfica)
- **Git Docs:** https://git-scm.com/doc

---

## ⚠️ IMPORTANTE - Antes do Primeiro Push

**Verifique se .env NÃO está sendo rastreado:**

```powershell
git status
```

Se aparecer `.env` na lista, **PARE!**

```powershell
# Adicionar ao .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: adicionar .env ao gitignore"
```

---

_Siga os passos acima para ter seu código seguro no GitHub!_ 🐙✨

