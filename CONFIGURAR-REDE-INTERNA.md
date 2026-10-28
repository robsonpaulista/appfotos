# 🌐 Configurar Aplicação para Rede Interna

Este guia explica como configurar o PhotoFinder para ser acessível por outros dispositivos na mesma rede local.

## ✅ O que foi configurado

A aplicação já está configurada para aceitar conexões da rede interna:

- **Backend**: Escuta em `0.0.0.0` (todas as interfaces de rede)
- **Frontend**: Escuta em `0.0.0.0` (todas as interfaces de rede)
- **CORS**: Configurado para aceitar conexões de IPs da rede local

## 🚀 Como usar

### Passo 1: Descobrir seu IP na rede local

#### Windows:
```powershell
ipconfig
```
Procure por "IPv4 Address" na seção do adaptador de rede ativo (geralmente algo como `192.168.1.100`)

#### Linux/Mac:
```bash
ip addr show
# ou
ifconfig
```

### Passo 2: Iniciar a aplicação

Execute normalmente:
```bash
npm run dev
```

Ou inicie separadamente:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Passo 3: Acessar de outros dispositivos

1. **No computador onde a aplicação está rodando:**
   - Acesse: `http://localhost:3000` (frontend)
   - Acesse: `http://localhost:4000` (backend)

2. **Em outros dispositivos na mesma rede:**
   - Acesse: `http://SEU_IP:3000` (frontend)
   - Exemplo: `http://192.168.1.100:3000`

## ⚙️ Configuração Avançada (Opcional)

### Configurar variáveis de ambiente

Se quiser usar um IP específico, você pode configurar no arquivo `.env`:

#### Backend (.env na raiz do projeto):
```env
BACKEND_PORT=4000
FRONTEND_URL=http://192.168.1.100:3000
```

#### Frontend (.env em frontend/):
```env
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:4000
```

**⚠️ Importante:** Se você configurar um IP específico, precisará atualizar sempre que seu IP mudar. A configuração atual permite qualquer IP da rede local automaticamente.

## 🔒 Segurança

A configuração atual permite acesso apenas de:
- `localhost` / `127.0.0.1`
- IPs da rede local privada:
  - `192.168.x.x`
  - `10.x.x.x`
  - `172.16-31.x.x`

Isso garante que apenas dispositivos na sua rede local possam acessar a aplicação.

## 🐛 Solução de Problemas

### Não consigo acessar de outro dispositivo

1. **Verifique o firewall:**
   - Windows: Permita conexões nas portas 3000 e 4000
   - Linux: Configure o firewall (ufw/iptables)

2. **Verifique se está na mesma rede:**
   - Ambos os dispositivos devem estar na mesma rede Wi-Fi/Ethernet

3. **Verifique o IP:**
   - Use `ipconfig` (Windows) ou `ifconfig` (Linux/Mac) para confirmar o IP

4. **Teste a conectividade:**
   - No outro dispositivo, tente acessar: `http://SEU_IP:4000/health`
   - Deve retornar: `{"status":"ok",...}`

### Erro de CORS

Se aparecer erro de CORS, verifique:
- O frontend está acessando o backend pelo IP correto
- A variável `NEXT_PUBLIC_BACKEND_URL` está configurada corretamente

### ✅ Autenticação Google na rede interna

**Solução implementada:** O sistema agora sempre usa `localhost` para o redirect_uri do Google OAuth, mesmo quando você acessa pela rede interna. Isso funciona porque:

1. O Google **não aceita IPs privados** (192.168.x.x) como URIs de redirecionamento
2. O backend está rodando na mesma máquina, então `localhost` sempre funciona
3. O sistema detecta automaticamente a URL do frontend original e redireciona corretamente após a autenticação

**Configuração necessária no Google Cloud Console:**

Você precisa ter apenas **uma** URI de redirecionamento configurada:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs e Serviços → Credenciais**
3. Clique no seu **ID do cliente OAuth 2.0**
4. Em **URIs de redirecionamento autorizados**, certifique-se de ter:
   - `http://localhost:4000/api/auth/callback`

**✅ Não é necessário adicionar IPs privados!** O sistema funciona automaticamente para qualquer IP da rede local usando apenas o `localhost` no backend.

**Como funciona:**
- Você acessa: `http://192.168.0.45:3000` (frontend na rede)
- O sistema detecta essa URL e a salva
- A autenticação usa: `http://localhost:4000/api/auth/callback` (backend sempre localhost)
- Após autenticação, redireciona de volta para: `http://192.168.0.45:3000` (frontend original)

## 📝 Notas

- A aplicação continua funcionando normalmente em `localhost`
- Não é necessário reiniciar após mudanças de IP (a menos que configure variáveis de ambiente específicas)
- A configuração funciona automaticamente para qualquer IP da rede local

