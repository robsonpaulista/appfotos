# 🤝 Contribuindo para o PhotoFinder

Obrigado por considerar contribuir para o PhotoFinder! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Tabela de Conteúdos

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Diretrizes de Desenvolvimento](#diretrizes-de-desenvolvimento)
- [Processo de Pull Request](#processo-de-pull-request)
- [Estilo de Código](#estilo-de-código)

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, espera-se que você mantenha este código.

## 🎯 Como Posso Contribuir?

### Reportando Bugs

Antes de criar um relatório de bug, verifique se o problema já não foi relatado. Se não encontrar um issue existente:

1. Use um título claro e descritivo
2. Descreva os passos para reproduzir o problema
3. Forneça exemplos específicos
4. Descreva o comportamento observado e o esperado
5. Inclua capturas de tela se aplicável
6. Mencione a versão do Node.js e do navegador

**Exemplo de Bug Report:**

```markdown
**Descrição**
Erro ao sincronizar fotos do Google Drive

**Passos para Reproduzir**
1. Fazer login com Google
2. Clicar em "Sincronizar Fotos"
3. Aguardar 5 minutos
4. Observar erro no console

**Comportamento Esperado**
Fotos devem ser sincronizadas sem erros

**Comportamento Atual**
Erro: "Token expired"

**Ambiente**
- Node.js: v18.0.0
- Navegador: Chrome 120
- OS: Windows 11
```

### Sugerindo Melhorias

Se você tem uma ideia para melhorar o PhotoFinder:

1. Use um título claro e descritivo
2. Forneça uma descrição detalhada da melhoria sugerida
3. Explique por que essa melhoria seria útil
4. Liste exemplos de como a funcionalidade funcionaria

### Contribuindo com Código

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🛠️ Diretrizes de Desenvolvimento

### Configuração do Ambiente

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/photofinder.git
cd photofinder

# Adicione o repositório upstream
git remote add upstream https://github.com/original/photofinder.git

# Instale as dependências
cd backend && npm install
cd ../frontend && npm install
```

### Estrutura do Projeto

```
photofinder/
├── backend/
│   ├── config/           # Configurações (Google, Supabase)
│   ├── services/         # Lógica de negócio
│   ├── routes/           # Rotas da API
│   └── index.js          # Ponto de entrada
├── frontend/
│   ├── components/       # Componentes React
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Páginas Next.js
│   ├── types/            # Tipos TypeScript
│   └── utils/            # Utilitários
└── database/
    └── schema.sql        # Schema do banco
```

### Boas Práticas

#### TypeScript
- ✅ Use tipos explícitos, evite `any`
- ✅ Crie interfaces para objetos complexos
- ✅ Use tipos de união quando apropriado

```typescript
// ❌ Ruim
const fetchData = async (id: any) => { ... }

// ✅ Bom
const fetchData = async (id: string): Promise<Photo> => { ... }
```

#### React Hooks
- ✅ Siga as regras dos Hooks
- ✅ Use hooks customizados para lógica reutilizável
- ✅ Declare dependências corretas no useEffect

```typescript
// ✅ Bom
useEffect(() => {
  fetchPhotos();
}, [filters]); // Dependências corretas
```

#### Backend
- ✅ Use async/await ao invés de callbacks
- ✅ Trate erros adequadamente
- ✅ Valide entrada do usuário
- ✅ Use middleware para autenticação

```javascript
// ✅ Bom
router.get('/photos', requireAuth, async (req, res) => {
  try {
    const photos = await getPhotos(req.query);
    res.json(photos);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Falha ao buscar fotos' });
  }
});
```

### Testes

Embora o projeto não tenha testes implementados ainda, ao contribuir considere:

- Testar manualmente todas as mudanças
- Verificar comportamento em diferentes navegadores
- Testar com diferentes tamanhos de tela
- Validar com diferentes quantidades de dados

## 🔄 Processo de Pull Request

1. **Atualize seu fork**
```bash
git checkout main
git pull upstream main
```

2. **Crie uma branch descritiva**
```bash
git checkout -b feature/adiciona-busca-por-tags
```

3. **Faça commits semânticos**
```bash
git commit -m "feat: adiciona busca por tags customizadas"
git commit -m "fix: corrige erro ao carregar thumbnail"
git commit -m "docs: atualiza README com novas instruções"
```

Prefixos de commit:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação (sem mudança de código)
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

4. **Preencha o template do PR**

Ao abrir o PR, preencha:
- Descrição clara da mudança
- Issue relacionada (se houver)
- Tipo de mudança (bugfix, feature, etc)
- Checklist de testes realizados

5. **Aguarde Review**

Mantenedores irão revisar seu código e podem:
- Aprovar e fazer merge
- Solicitar mudanças
- Fazer comentários

## 🎨 Estilo de Código

### JavaScript/TypeScript

- Use 2 espaços para indentação
- Use aspas simples para strings
- Ponto e vírgula ao final das linhas
- Nomes descritivos para variáveis

```typescript
// ✅ Bom
const userPhotos: Photo[] = await fetchUserPhotos(userId);

// ❌ Ruim
const x = await f(u);
```

### React Components

- Um componente por arquivo
- Use TypeScript para props
- Desestruture props
- Use arrow functions

```typescript
// ✅ Bom
interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <div onClick={onClick}>
      <img src={photo.thumbnail_url} alt={photo.name} />
    </div>
  );
}
```

### CSS

- Use CSS-in-JS (styled-jsx) no frontend
- Nomes de classes em kebab-case
- Mobile-first approach

```jsx
<style jsx>{`
  .photo-card {
    border-radius: 8px;
    transition: transform 0.2s;
  }
  
  .photo-card:hover {
    transform: scale(1.05);
  }
`}</style>
```

## 📝 Documentação

Ao adicionar novas funcionalidades:

1. Atualize o README.md
2. Adicione comentários no código quando necessário
3. Documente APIs com JSDoc

```typescript
/**
 * Busca fotos com base em filtros
 * @param {PhotoFilters} filters - Filtros a aplicar
 * @returns {Promise<PhotosResponse>} Lista de fotos
 */
async function fetchPhotos(filters: PhotoFilters): Promise<PhotosResponse> {
  // ...
}
```

## ❓ Dúvidas?

Se tiver dúvidas sobre como contribuir:

1. Abra uma issue com a tag `question`
2. Envie um e-mail para os mantenedores
3. Participe das discussões

## 🙏 Obrigado!

Sua contribuição é muito valiosa para tornar o PhotoFinder melhor!

---

**Happy Coding! 🚀**
