# 🔍 Problema: Fotos não aparecem em produção

## ❌ Sintoma
- Login funciona ✅
- Usuário aparece autenticado ✅
- Nenhuma foto aparece na tela ❌
- Funciona normalmente no local ✅

## 🔍 Possíveis Causas

### 1. Cookie de Sessão não está sendo enviado
O cookie pode não estar sendo enviado corretamente devido a:
- `SameSite=Strict` não funciona bem com redirects OAuth
- Cookie não está sendo definido corretamente em produção

### 2. Autenticação falhando silenciosamente
A API pode estar retornando 401 mas o erro não está sendo mostrado.

### 3. Problema com CORS ou credenciais
O `withCredentials: true` pode não estar funcionando corretamente.

## ✅ Correções Aplicadas

### 1. Cookie SameSite=Lax
Mudei de `SameSite=Strict` para `SameSite=Lax` porque:
- `Strict` bloqueia cookies em redirects entre domínios
- `Lax` permite cookies em redirects (necessário para OAuth)

### 2. Logs de Debug
Adicionei logs na API `/api/photos` para verificar:
- Se o cookie está sendo recebido
- Se a autenticação está funcionando
- Quantas fotos foram encontradas

## 🔧 Como Verificar

### 1. Verificar Logs do Vercel
1. Acesse o dashboard do Vercel
2. Vá em **Deployments → [último deploy] → Functions**
3. Clique em `/api/photos`
4. Veja os logs:
   - `📸 Requisição para /api/photos`
   - `🍪 Cookies recebidos: Sim/Não`
   - `✅ Usuário autenticado: [userId]` ou `❌ Autenticação falhou`
   - `✅ Fotos encontradas: X de Y total`

### 2. Verificar no Console do Navegador
1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página
4. Procure por `/api/photos`
5. Veja:
   - **Status**: Deve ser 200 (não 401)
   - **Request Headers**: Deve ter `Cookie: session=...`
   - **Response**: Deve ter `photos: [...]`

### 3. Verificar Cookie
1. No DevTools, vá em **Application → Cookies**
2. Procure por `session`
3. Verifique:
   - **Domain**: Deve ser `.vercel.app` ou o domínio do site
   - **Path**: Deve ser `/`
   - **HttpOnly**: Deve estar marcado
   - **Secure**: Deve estar marcado (em HTTPS)
   - **SameSite**: Deve ser `Lax`

## 🚀 Próximos Passos

1. **Fazer redeploy** no Vercel (o código já foi atualizado)
2. **Testar novamente** após o deploy
3. **Verificar os logs** do Vercel para ver o que está acontecendo
4. **Verificar o console do navegador** para ver se há erros

## 📝 Se ainda não funcionar

### Verificar se há fotos no banco:
1. Acesse o Supabase Dashboard
2. Vá em **Table Editor → photos**
3. Verifique se há fotos com o `user_id` correto

### Verificar autenticação:
1. No console do navegador, execute:
   ```javascript
   fetch('/api/auth/status', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```
2. Deve retornar `{ authenticated: true, user: {...} }`

### Verificar API de fotos:
1. No console do navegador, execute:
   ```javascript
   fetch('/api/photos', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```
2. Deve retornar `{ photos: [...], pagination: {...} }`

## 🔄 Se o cookie não estiver sendo enviado

Pode ser necessário:
1. Limpar cookies do navegador
2. Fazer logout e login novamente
3. Verificar se o domínio do cookie está correto




