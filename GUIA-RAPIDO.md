# ⚡ Guia Rápido - PhotoFinder

## 🔄 Para Resetar Tudo e Aplicar Novas Funcionalidades:

### **Passo 1: Matar Processos** 🔫

No PowerShell (na raiz do projeto):

```powershell
.\kill-all.ps1
```

✅ Isso mata backend E frontend

---

### **Passo 2: Executar SQLs no Supabase** 📊

**A) Resetar Sincronização Travada:**

No SQL Editor do Supabase:
```sql
UPDATE sync_events 
SET status = 'failed', error_message = 'Resetado', completed_at = NOW()
WHERE status IN ('started', 'in_progress');
```

**B) Adicionar Colunas de Auto-Tags:**

Copie TODO o conteúdo de:
```
database/migrations/add_auto_tags.sql
```

Cole e execute no SQL Editor.

---

### **Passo 3: Reiniciar Tudo** 🚀

**Opção A - Script Automático:**
```powershell
.\restart-all.ps1
```

**Opção B - Manual:**

**Terminal 1 (Backend):**
```powershell
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive\backend
node index.js
```

**Terminal 2 (Frontend):**
```powershell
cd C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive\frontend
npm run dev
```

---

### **Passo 4: Testar** 🧪

1. Abra: http://localhost:3000
2. Veja o novo Dashboard
3. Clique em "Sincronizar Fotos"
4. Escolha uma pasta
5. Veja o progresso (e agora tem botão CANCELAR!)

---

## 📋 **Resumo em 4 Comandos:**

```powershell
# 1. Matar tudo
.\kill-all.ps1

# 2. Executar SQLs no Supabase (via navegador)

# 3. Reiniciar tudo
.\restart-all.ps1

# 4. Abrir navegador
# http://localhost:3000
```

---

## 🎯 **Novidades que Você Vai Ver:**

### ✅ **Botão Cancelar**
```
[🔄 Sincronizando... 250 fotos]  [❌ Cancelar]
                                      ↑
                                  NOVO BOTÃO!
```

### ✅ **Dashboard de Estatísticas**
```
┌─────────────────────────────────────┐
│ 📊 1.100 fotos  │ 0 Analisadas      │
│ 📍 50 com GPS   │ 0 com Rostos      │
├─────────────────────────────────────┤
│ Por Ano:    │ Por Cidade:          │
│ 2024: ███   │ Teresina: ████       │
│ 2023: ██    │ Picos: ██            │
├─────────────────────────────────────┤
│ Por Tipo:                           │
│ Eventos: ████                       │
│ Agenda: ███                         │
└─────────────────────────────────────┘
```

### ✅ **Filtros Melhorados**
```
Cidade: [Dropdown com todas as cidades] ✨ NOVO
Tipo:   [Dropdown com todos os tipos]   ✨ NOVO
Ano:    [2024]
```

### ✅ **Cards de Fotos Modernos**
```
┌────────────────┐
│ [Foto]         │
│  📍 Teresina   │ ✨ AUTO-TAG
│  🏷️ Eventos    │ ✨ AUTO-TAG
│  📅 04/11/2024 │
└────────────────┘
```

---

## ⚠️ **Importante:**

Para ver as **auto-tags** nas fotos já sincronizadas:
- Você precisa **RE-SINCRONIZAR** a pasta
- O sistema vai atualizar todas as fotos com as tags
- Depois disso, os filtros de cidade/tipo funcionam!

---

**Pronto para começar? Execute `.\kill-all.ps1` primeiro!** 🚀

