# 🏷️ Tags Automáticas na Importação

## 🎯 Nova Funcionalidade Implementada!

Agora você pode **adicionar tags (Pessoa, Local, Evento) diretamente no momento de importar uma pasta**, sem precisar buscar as fotos depois!

---

## ✨ Como Funciona

### Antes (forma tradicional - ainda disponível):
```
1. Sincronizar pasta
2. Aguardar importação
3. Procurar fotos nas páginas
4. Selecionar fotos
5. Adicionar tags em lote
```

### Agora (novo - mais rápido):
```
1. Clicar "Sincronizar Nova Pasta"
2. Selecionar a pasta
3. ✨ Preencher tags (pessoa, local, evento)
4. Sincronizar
5. ✅ Todas as fotos JÁ vêm organizadas!
```

---

## 📋 Passo a Passo

### 1. Clique em "Sincronizar Nova Pasta"
- Botão verde na área das fotos

### 2. Selecione uma Pasta
- Modal abre mostrando árvore de pastas
- Clique na pasta desejada (ex: "Aniversário Maria 2024")

### 3. Preencha as Tags (NOVO!)
Após selecionar a pasta, aparece uma seção azul:

```
┌─────────────────────────────────────────────┐
│ ℹ️ Organizar automaticamente (opcional)     │
│ Preencha os campos abaixo para adicionar   │
│ tags em todas as fotos desta pasta.        │
├─────────────────────────────────────────────┤
│ 👤 Pessoa (opcional)                        │
│ [João Silva, Família, Amigos...]           │
│                                             │
│ 📍 Local (opcional)                         │
│ [São Paulo, Paris, Praia...]               │
│                                             │
│ 📅 Evento (opcional)                        │
│ [Aniversário, Viagem, Casamento...]        │
└─────────────────────────────────────────────┘
```

**Preencha os campos que desejar** (todos são opcionais):
- **Pessoa:** Nome de quem aparece nas fotos
- **Local:** Onde as fotos foram tiradas  
- **Evento:** Qual evento/ocasião

### 4. Clique em "Sincronizar Pasta"

### 5. Aguarde a importação

### 6. Resultado: Fotos já organizadas! ✅

Todas as fotos importadas dessa pasta **já virão com as tags aplicadas**!

---

## 💡 Exemplos de Uso

### Exemplo 1: Viagem a Paris
```
Pasta: "Paris 2024"
👤 Pessoa: Família Silva
📍 Local: Paris
📅 Evento: Viagem Europa

Resultado: 50 fotos importadas
  ✅ Todas com "Família Silva"
  ✅ Todas com "Paris"
  ✅ Todas com "Viagem Europa"
```

### Exemplo 2: Aniversário
```
Pasta: "Aniversário Maria"
👤 Pessoa: Maria
📍 Local: Buffet Alegria
📅 Evento: Aniversário 5 anos

Resultado: 120 fotos importadas
  ✅ Todas com "Maria"
  ✅ Todas com "Buffet Alegria"
  ✅ Todas com "Aniversário 5 anos"
```

### Exemplo 3: Fotos Profissionais
```
Pasta: "Ensaio Fotográfico"
👤 Pessoa: (deixar vazio)
📍 Local: Estúdio
📅 Evento: Ensaio Profissional

Resultado: 30 fotos importadas
  ✅ Todas com "Estúdio"
  ✅ Todas com "Ensaio Profissional"
```

---

## 🎯 Vantagens

### ⚡ Economia de Tempo
- **Antes:** ~5 minutos para organizar 50 fotos
- **Agora:** ~10 segundos (preenche na importação)

### 🎯 Mais Preciso
- Você lembra melhor no momento da importação
- Não precisa voltar depois e tentar lembrar

### 🔄 Mais Prático
- Organiza tudo de uma vez
- Sem precisar procurar fotos em várias páginas
- Sem precisar selecionar uma a uma

### 📊 Melhor Filtragem
- Fotos já organizadas desde o início
- Filtros funcionam imediatamente
- Estatísticas já contabilizadas

---

## 🔧 Detalhes Técnicos

### Fluxo no Backend
```javascript
1. Recebe tags do frontend
2. Log das tags no console
3. Durante sincronização:
   - Processa cada foto normalmente
   - Extrai tags automáticas (da pasta)
   - Aplica tags manuais (do formulário)
   - Tags manuais SOBRESCREVEM automáticas
4. Salva foto com todas as tags
```

### Logs do Backend
```
=== NOVA SINCRONIZAÇÃO ===
Usuário: abc-123
Pasta: Aniversário Maria 2024
Tags automáticas:
  - Pessoa: Maria
  - Local: São Paulo
  - Evento: Aniversário
========================

📁 Sincronizando pasta: Aniversário Maria 2024
🏷️  Tags manuais que serão aplicadas:
   👤 Pessoa: Maria Silva
   📍 Local: Buffet Alegria
   📅 Evento: Aniversário 5 anos
```

### Onde as Tags são Aplicadas
```javascript
// No ingestService.processBatch()
if (manualTags) {
  if (manualTags.person) photoData.person_tag = manualTags.person;
  if (manualTags.location) photoData.location_name = manualTags.location;
  if (manualTags.event) photoData.event_type = manualTags.event;
}
```

---

## 🎨 Interface

### Modal Antes (altura menor):
```
┌────────────────────────────┐
│ Selecionar Pasta          │
├────────────────────────────┤
│ 📁 Pasta 1                │
│ 📁 Pasta 2                │
│ 📁 Pasta 3                │
├────────────────────────────┤
│ [Cancelar] [Sincronizar]  │
└────────────────────────────┘
```

### Modal Agora (mais alto, com tags):
```
┌────────────────────────────┐
│ Selecionar Pasta          │
├────────────────────────────┤
│ 📁 Pasta 1                │
│ 📁 Pasta 2                │
│ 📁 Pasta 3 ✓             │ ← Selecionada
├────────────────────────────┤
│ ℹ️ Organizar automaticamente │
│                            │
│ 👤 Pessoa: [___________]  │
│ 📍 Local:  [___________]  │
│ 📅 Evento: [___________]  │
├────────────────────────────┤
│ [Cancelar] [Sincronizar]  │
└────────────────────────────┘
```

---

## 🔍 Comportamento

### Se NÃO preencher tags:
- ✅ Funciona normalmente
- ✅ Aplica apenas tags automáticas (do nome da pasta)
- ✅ Você pode adicionar tags depois

### Se preencher tags:
- ✅ Aplica tags manuais em TODAS as fotos da pasta
- ✅ Tags manuais SOBRESCREVEM tags automáticas
- ✅ Economiza tempo

### Campos são opcionais:
- Pode preencher só 1 campo
- Pode preencher 2 campos
- Pode preencher todos os 3
- Pode não preencher nenhum

---

## 📝 Arquivos Modificados

### Frontend (5 arquivos):
1. `frontend/components/FolderSelector.tsx`
   - Adicionados 3 inputs (pessoa, local, evento)
   - Estado para cada tag
   - Passa tags para callback

2. `frontend/components/SyncButton.tsx`
   - Atualizado handleSelectFolder para receber tags
   - Passa tags para startSync

3. `frontend/hooks/useSync.ts`
   - Atualizado startSync para aceitar tags
   - Passa tags para API

4. `frontend/utils/api.ts`
   - Atualizado startSync para enviar tags

### Backend (2 arquivos):
5. `backend/routes/sync.routes.js`
   - Recebe tags do request body
   - Logs das tags recebidas
   - Passa tags para ingestService

6. `backend/services/ingest.service.js`
   - syncPhotos aceita manualTags
   - processBatch aceita manualTags
   - Aplica tags em cada foto processada
   - Tags manuais sobrescrevem automáticas

---

## ✅ Pronto para Usar!

**Reinicie o backend:**
```powershell
cd backend
npm run dev
```

**Teste:**
1. Acesse http://localhost:3000
2. Clique "Sincronizar Nova Pasta"
3. Selecione uma pasta
4. Preencha pessoa/local/evento
5. Sincronize
6. Veja as fotos já organizadas!

---

## 🎉 Benefício Real

### Cenário Real: 500 fotos de uma viagem

**Antes:**
- Importar: 5 min
- Procurar nas páginas: 10 min
- Selecionar e organizar: 15 min
- **Total: 30 minutos**

**Agora:**
- Importar com tags: 5 min
- **Total: 5 minutos**

**Economia: 25 minutos (83% mais rápido!)** 🚀

---

_Funcionalidade implementada e pronta para uso!_ ✨

