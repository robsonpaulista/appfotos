# 🔧 Corrigir Erro ao Adicionar Evento

## ❌ Problema
Erro `PGRST116` ao tentar adicionar evento nas fotos porque o campo `event_type` não existe no banco de dados.

## ✅ Solução Rápida

### Você precisa executar a migration no Supabase!

1. **Acesse o Supabase:**
   ```
   https://supabase.com/dashboard
   ```

2. **Vá para o SQL Editor:**
   - Clique no seu projeto
   - Menu lateral → **SQL Editor**
   - Clique em **"New query"**

3. **Cole e execute este SQL:**

```sql
-- Adicionar colunas para tags automáticas (se não existirem)
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS event_year INTEGER,
ADD COLUMN IF NOT EXISTS event_month INTEGER,
ADD COLUMN IF NOT EXISTS event_city TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS folder_path TEXT;

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_photos_event_year ON photos(event_year);
CREATE INDEX IF NOT EXISTS idx_photos_event_month ON photos(event_month);
CREATE INDEX IF NOT EXISTS idx_photos_event_city ON photos(event_city);
CREATE INDEX IF NOT EXISTS idx_photos_event_type ON photos(event_type);
```

4. **Clique em "Run"** (ou pressione Ctrl+Enter)

5. **Aguarde a confirmação:** `Success. No rows returned`

6. **Teste novamente:**
   - Volte para http://localhost:3000
   - Selecione fotos
   - Clique em "Evento"
   - Digite o nome do evento
   - Salvar
   - **Deve funcionar agora!** ✅

## 📊 O que isso faz?

Adiciona 5 novos campos na tabela `photos`:
- ✅ `event_year` - Ano do evento
- ✅ `event_month` - Mês do evento
- ✅ `event_city` - Cidade do evento
- ✅ `event_type` - **Tipo de evento (o que estava faltando!)**
- ✅ `folder_path` - Caminho da pasta no Drive

## 🎯 Após executar:

Você poderá:
1. ✅ Adicionar eventos em lote nas fotos
2. ✅ Buscar fotos por tipo de evento
3. ✅ Organizar por cidade/ano/mês automaticamente
4. ✅ Filtrar por evento nos filtros avançados

---

**Execute o SQL acima no Supabase e teste novamente!** 🚀

