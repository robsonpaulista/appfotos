# PhotoFinder Frontend

Frontend Next.js 14 com TypeScript para o PhotoFinder.

## 🚀 Instalação

```bash
npm install
```

## ⚙️ Configuração

1. Copie `env.template` para `.env.local`
2. Configure a URL do backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🏃 Executar

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Servidor de produção
npm start

# Linter
npm run lint

# Type check
npm run type-check
```

## 📱 Páginas

### `/` - Galeria
- Grid de fotos com thumbnails
- Filtros avançados
- Modal de detalhes
- Edição de tags
- Paginação

### `/stats` - Estatísticas
- Total de fotos
- Fotos com rostos
- Fotos sorrindo
- Fotos com GPS
- Gráficos percentuais

### `/ingest` - Sincronização
- Iniciar sincronização
- Configurar Vision API
- Especificar pasta do Drive

## 🎨 Componentes

### `Header`
Navegação principal

### `FilterBar`
Filtros de busca:
- Pessoa
- Expressão (sorriso)
- Local
- Ano
- Número de rostos

### `PhotoGrid`
Grid responsivo de fotos com lazy loading

### `PhotoModal`
Modal de detalhes com:
- Imagem em alta resolução
- Metadados (data, câmera, GPS)
- Análise de IA (rostos, emoções)
- Edição de tags

### `StatsCard`
Card de estatística com ícone

## 🛠️ Stack

- **Next.js 14** - App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Icons** - Ícones
- **Axios** - Cliente HTTP
- **date-fns** - Formatação de datas

## 📁 Estrutura

```
frontend/
├── app/
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Home (Galeria)
│   ├── globals.css       # Estilos globais
│   ├── stats/
│   │   └── page.tsx      # Estatísticas
│   └── ingest/
│       └── page.tsx      # Sincronização
├── components/
│   ├── Header.tsx
│   ├── FilterBar.tsx
│   ├── PhotoGrid.tsx
│   ├── PhotoModal.tsx
│   └── StatsCard.tsx
├── types/
│   └── photo.ts          # TypeScript types
├── utils/
│   ├── api.ts            # Cliente API
│   └── formatters.ts     # Funções de formatação
└── package.json
```

## 🎨 Customização

### Cores

Edite `tailwind.config.ts` para mudar o tema:

```typescript
colors: {
  primary: {
    500: '#0ea5e9', // Cor principal
    600: '#0284c7',
    // ...
  },
}
```

### Fontes

Edite `app/layout.tsx`:

```typescript
import { YourFont } from 'next/font/google';
```

## 📸 Images

O Next.js Image está configurado para aceitar:
- `localhost:4000` (backend local)
- `*.googleusercontent.com` (thumbnails do Drive)

Para adicionar mais domínios, edite `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'seu-dominio.com',
    },
  ],
}
```

## 🚀 Deploy na Vercel

1. Instale a CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure as variáveis de ambiente no painel:
   - `NEXT_PUBLIC_API_URL`

## 🔒 Segurança

- Todas as chamadas de API são autenticadas
- Sem tokens expostos no frontend
- CORS configurado
- Content Security Policy

## 📱 Responsividade

O layout é responsivo para:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Wide (1920px+)

## ⚡ Performance

- ✅ Server-side rendering (SSR)
- ✅ Lazy loading de imagens
- ✅ Paginação
- ✅ Thumbnails cacheados
- ✅ Code splitting automático

## 🧪 Testes

```bash
# Adicione testes com Jest + React Testing Library
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

## ⚠️ Troubleshooting

### Erro de CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solução**: Verifique se `FRONTEND_URL` no backend está correto

### Imagens não carregam
```
Image failed to load
```
**Solução**: Adicione o domínio em `next.config.js`

### Erro de tipo TypeScript
```
Type 'X' is not assignable to type 'Y'
```
**Solução**: Execute `npm run type-check` para detalhes

