# 🔐 Solução: Autenticação Google na Rede Interna

## ⚠️ Problema

O Google OAuth **não aceita IPs privados** (192.168.x.x) como URIs de redirecionamento. Quando você acessa a aplicação pela rede interna de outro dispositivo e tenta autenticar, o Google rejeita a URI de callback.

## ✅ Solução Implementada

O sistema agora sempre usa `localhost` para o redirect_uri, que o Google aceita. No entanto, há uma limitação:

### Limitação

Quando você acessa de **outro dispositivo** na rede:
- O Google redireciona para `http://localhost:4000/api/auth/callback`
- Mas esse `localhost` é do **dispositivo do usuário**, não do servidor
- Resultado: O callback não funciona automaticamente

## 🛠️ Soluções Disponíveis

### Opção 1: Autenticar no Servidor (Recomendado)

1. Acesse a aplicação pela rede: `http://SEU_IP:3000`
2. Clique em "Entrar com Google"
3. **Após autenticar no Google**, você será redirecionado para uma URL como:
   ```
   http://localhost:4000/api/auth/callback?code=XXXXX&state=YYYYY
   ```
4. **Copie essa URL completa**
5. **Acesse essa URL diretamente no servidor** (no navegador do computador onde o backend está rodando)
6. Você será redirecionado de volta para o frontend na rede

### Opção 2: Usar Túnel Público (ngrok)

Para uma solução mais automática, use um túnel público:

1. **Instale ngrok:**
   ```bash
   # Windows (com Chocolatey)
   choco install ngrok
   
   # Ou baixe de: https://ngrok.com/download
   ```

2. **Crie um túnel para o backend:**
   ```bash
   ngrok http 4000
   ```

3. **Copie a URL pública** (ex: `https://abc123.ngrok.io`)

4. **Configure no Google Cloud Console:**
   - Adicione: `https://abc123.ngrok.io/api/auth/callback`
   - Como URI de redirecionamento autorizado

5. **Configure no `.env`:**
   ```env
   GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback
   ```

6. **Reinicie o backend**

Agora funcionará automaticamente mesmo acessando pela rede!

### Opção 3: Usar Apenas no Servidor

Se você sempre acessa do próprio servidor:
- Use `http://localhost:3000` para acessar
- Funciona perfeitamente sem configuração adicional

## 📝 Notas

- A solução atual funciona perfeitamente quando você acessa do próprio servidor
- Para acesso de outros dispositivos, use a Opção 1 (copiar URL) ou Opção 2 (ngrok)
- O ngrok é gratuito para uso pessoal e resolve o problema completamente

