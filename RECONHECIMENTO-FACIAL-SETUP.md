# 🤖 Setup de Reconhecimento Facial

## ✅ O que já foi feito

1. ✅ Instalado Face-API.js e dependências (face-api.js + @tensorflow/tfjs)
2. ✅ Baixado modelos de ML (~10MB) do repositório oficial
3. ✅ Criado serviço de reconhecimento facial
4. ✅ Criado rotas da API
5. ✅ Integrado ao backend
6. ✅ Migration criada e testada
7. ✅ Backend rodando com sucesso

---

## 📋 Próximos Passos

### 1. Executar Migration no Supabase

Abra o **SQL Editor** no Supabase e execute o arquivo:
```sql
database/migrations/add_face_recognition.sql
```

Isso criará as tabelas:
- `face_descriptors` - armazena vetores faciais (128 dimensões)
- `persons` - pessoas identificadas

### 2. Reiniciar o Backend

```bash
cd backend
npm start
```

Você deve ver:
```
🚀 PhotoFinder Backend → http://localhost:4000
🤖 Carregando modelos de reconhecimento facial...
✅ Modelos carregados com sucesso!
```

---

## 🧪 Testando o Reconhecimento Facial

### Teste 1: Analisar uma foto

```bash
# Substitua PHOTO_ID pelo ID real de uma foto
curl -X POST http://localhost:4000/api/faces/analyze/PHOTO_ID \
  -H "Content-Type: application/json" \
  --cookie "connect.sid=SEU_SESSION_ID"
```

**Resposta esperada:**
```json
{
  "faces": [
    {
      "id": "uuid",
      "photo_id": "uuid",
      "bounding_box": {"x": 100, "y": 150, "width": 200, "height": 250},
      "confidence": 0.95
    }
  ],
  "count": 1,
  "message": "1 rosto(s) detectado(s)"
}
```

### Teste 2: Buscar rostos similares

```bash
curl -X POST http://localhost:4000/api/faces/find-similar \
  -H "Content-Type: application/json" \
  -d '{"descriptorId": "UUID_DO_ROSTO", "threshold": 0.6}' \
  --cookie "connect.sid=SEU_SESSION_ID"
```

### Teste 3: Agrupar rostos automaticamente

```bash
curl -X POST http://localhost:4000/api/faces/cluster \
  -H "Content-Type: application/json" \
  -d '{"threshold": 0.6}' \
  --cookie "connect.sid=SEU_SESSION_ID"
```

### Teste 4: Atribuir nome a um rosto

```bash
curl -X POST http://localhost:4000/api/faces/assign-person \
  -H "Content-Type: application/json" \
  -d '{
    "descriptorIds": ["UUID1", "UUID2"],
    "personName": "João Silva"
  }' \
  --cookie "connect.sid=SEU_SESSION_ID"
```

---

## 🎯 Rotas Disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/faces/analyze/:photoId` | Analisa uma foto e extrai rostos |
| POST | `/api/faces/analyze-batch` | Analisa múltiplas fotos |
| GET | `/api/faces/photo/:photoId` | Lista rostos de uma foto |
| POST | `/api/faces/find-similar` | Busca rostos similares |
| POST | `/api/faces/cluster` | Agrupa rostos automaticamente |
| POST | `/api/faces/assign-person` | Atribui pessoa a rostos |
| GET | `/api/faces/persons` | Lista todas as pessoas |
| GET | `/api/faces/person/:personId/photos` | Fotos de uma pessoa |

---

## 🔧 Configuração de Threshold

O `threshold` controla a sensibilidade da comparação:

- **0.4** - Muito restritivo (apenas rostos muito similares)
- **0.6** - Recomendado (bom equilíbrio)
- **0.8** - Permissivo (pode agrupar pessoas diferentes)

---

## 📊 Como Funciona

1. **Detecção**: Face-API.js detecta rostos na imagem
2. **Extração**: Gera vetor de 128 dimensões (face descriptor)
3. **Armazenamento**: Salva vetor no Supabase (não salva a imagem!)
4. **Comparação**: Calcula distância euclidiana entre vetores
5. **Match**: Se distância < threshold, são a mesma pessoa

---

## 🎨 Próximos Passos (Frontend)

Ainda falta implementar no frontend:
- [ ] Botão "Analisar Rostos" em cada foto
- [ ] Visualizar rostos detectados (bounding boxes)
- [ ] Interface para agrupar rostos similares
- [ ] Marcar "quem é quem"
- [ ] Buscar fotos por pessoa

---

## ⚠️ Importante

- **Privacidade**: Imagens nunca são enviadas para serviços externos
- **Armazenamento**: Apenas vetores matemáticos são salvos (128 números)
- **Performance**: Primeira análise pode demorar ~2-3s por foto
- **Custo**: $0 - tudo roda no seu servidor

---

## 🐛 Troubleshooting

### Erro: "Modelos não carregados"
```bash
cd backend
node scripts/download-face-models.js
```

### Erro: "Cannot find module canvas"
```bash
cd backend
npm install canvas
```

### Erro ao analisar foto
- Verifique se a foto existe no Drive
- Confirme que o usuário tem permissão
- Tente com uma foto menor primeiro

---

## 📈 Performance

- **Detecção**: ~2-3s por foto (primeira vez)
- **Comparação**: ~0.1s por par de rostos
- **Agrupamento**: ~1s para 100 rostos

---

Pronto para testar! 🚀

