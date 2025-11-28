# 🤖 Como Usar o Reconhecimento Facial

## 📍 Onde encontrar

### **Opção 1: No Modal da Foto**

1. **Abra qualquer foto** clicando nela na galeria
2. **Role até o final** do painel lateral direito
3. Você verá a seção **"Reconhecimento Facial"**
4. Clique em **"Analisar Rostos"**

```
┌─────────────────────────────────────┐
│  [Foto]        │  Detalhes          │
│                │                     │
│                │  📅 Data            │
│                │  📍 Local           │
│                │  👤 Pessoa          │
│                │                     │
│                │  ─────────────────  │
│                │                     │
│                │  🤖 Reconhecimento  │
│                │     Facial          │
│                │                     │
│                │  [Analisar Rostos]  │ ← AQUI!
│                │                     │
└─────────────────────────────────────┘
```

### **Opção 2: Página Dedicada**

1. Clique em **"Reconhecimento Facial"** no menu superior
2. Use o painel **"Agrupar Rostos Similares"**
3. Gerencie todas as pessoas identificadas

---

## 🎯 Fluxo Completo

### **Passo 1: Analisar Fotos**

1. Abra uma foto com pessoas
2. Role até "Reconhecimento Facial"
3. Clique em **"Analisar Rostos"**
4. Aguarde 2-3 segundos
5. Sistema mostra quantos rostos foram detectados

**Exemplo:**
```
🤖 Reconhecimento Facial
┌────────────────────────────────┐
│ 👤 Rosto 1                     │
│    Confiança: 95%              │
│                   [Identificar]│
├────────────────────────────────┤
│ 👤 Rosto 2                     │
│    Confiança: 92%              │
│                   [Identificar]│
└────────────────────────────────┘
```

### **Passo 2: Identificar Pessoas (Método Manual)**

1. Clique em **"Identificar"** em cada rosto
2. Digite o nome da pessoa
3. Sistema salva a identificação
4. Rosto agora mostra o nome

**Resultado:**
```
┌────────────────────────────────┐
│ 👤 João Silva                  │
│    Confiança: 95%              │
│                                │
├────────────────────────────────┤
│ 👤 Maria Santos                │
│    Confiança: 92%              │
│                                │
└────────────────────────────────┘
```

### **Passo 3: Agrupar Automaticamente (Método Rápido)**

1. Vá em **"Reconhecimento Facial"** (menu superior)
2. Ajuste a sensibilidade (0.6 é recomendado)
3. Clique em **"Agrupar Rostos"**
4. Sistema encontra rostos similares
5. Identifique cada grupo de uma vez

**Exemplo:**
```
✅ 3 grupo(s) encontrado(s)

┌────────────────────────────────────┐
│  15  Grupo com 15 rostos similares │
│      Provavelmente a mesma pessoa  │
│                      [Identificar] │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  8   Grupo com 8 rostos similares  │
│      Provavelmente a mesma pessoa  │
│                      [Identificar] │
└────────────────────────────────────┘
```

### **Passo 4: Ver Fotos de uma Pessoa**

1. Na página "Reconhecimento Facial"
2. Clique em qualquer pessoa da lista
3. Veja todas as fotos dela
4. Clique em uma foto para abrir

---

## 🎨 Interface Completa

### **Menu Superior:**
```
PhotoFinder  |  Minhas Fotos  |  🤖 Reconhecimento Facial  |  🤖 Teste de IA
                                         ↑
                                    CLIQUE AQUI
```

### **Modal da Foto:**
```
┌─────────────────────────────────────────────────┐
│  [Imagem Grande]  │  Nome da Foto              │
│                   │  [Google Drive] [X]        │
│                   │                             │
│                   │  👤 Pessoa: [editar]        │
│                   │  📍 Local: [editar]         │
│                   │                             │
│                   │  ─────────────────────────  │
│                   │  Metadados                  │
│                   │  📅 Data                    │
│                   │  📷 Câmera                  │
│                   │                             │
│                   │  ─────────────────────────  │
│                   │  🤖 Reconhecimento Facial   │
│                   │                             │
│                   │  [Analisar Rostos]          │ ← AQUI!
│                   │                             │
└─────────────────────────────────────────────────┘
```

### **Página de Reconhecimento:**
```
┌─────────────────────────────────────────────────┐
│  🤖 Reconhecimento Facial                       │
│  Gerencie pessoas e agrupe rostos similares     │
├─────────────────────────────────────────────────┤
│                                                  │
│  📊 Agrupar Rostos Similares                    │
│  ┌──────────────────────────────────────────┐  │
│  │  Sensibilidade: [====●====] 0.6          │  │
│  │                    [Agrupar Rostos]      │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  👥 Pessoas Identificadas (5)                   │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │ J      │ │ M      │ │ P      │             │
│  │ João   │ │ Maria  │ │ Pedro  │             │
│  │ 15 fotos│ │ 8 fotos│ │ 12 fotos│            │
│  └────────┘ └────────┘ └────────┘             │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Teste Agora!

1. **Abra o frontend**: http://localhost:3000
2. **Clique em uma foto** que tenha pessoas
3. **Role até o final** do modal
4. **Clique em "Analisar Rostos"**
5. **Aguarde** a análise (2-3s)
6. **Identifique** as pessoas

---

## 💡 Dicas:

- **Analise várias fotos** antes de agrupar (mínimo 10-20)
- **Use threshold 0.6** para melhor precisão
- **Identifique grupos grandes** primeiro (economiza tempo)
- **Rostos de perfil** podem ter menor confiança
- **Fotos muito antigas** podem ter qualidade menor

---

## ⚡ Atalhos:

- **Enter** no campo de nome = salvar
- **Escape** = cancelar edição
- **Clicar fora** do modal = fechar

---

Pronto para testar! 🎉

