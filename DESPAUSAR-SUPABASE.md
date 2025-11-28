# 🔄 Como Despausar Projeto no Supabase

O Supabase pausa automaticamente projetos do plano gratuito após **1 semana de inatividade**. Aqui está como despausar:

---

## 🚀 Método 1: Via Dashboard (Mais Rápido)

### Passo a Passo:

1. **Acesse o Supabase:**
   - Vá em: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Encontre seu projeto:**
   - Na lista de projetos, você verá o projeto pausado
   - Ele terá um indicador de "Paused" ou "Pausado"

3. **Despausar:**
   - Clique no projeto pausado
   - Você verá uma mensagem indicando que o projeto está pausado
   - Clique no botão **"Restore project"** ou **"Restaurar projeto"**
   - Aguarde alguns minutos (geralmente 1-3 minutos)

4. **Verificar:**
   - Após restaurar, o projeto ficará ativo novamente
   - A URL do projeto continuará a mesma
   - Todas as configurações e dados serão preservados

---

## ⏱️ Método 2: Via API (Automático)

Se você quiser automatizar ou despausar via código:

### Usando cURL:

```bash
curl -X POST 'https://api.supabase.com/v1/projects/{project_ref}/restore' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json'
```

**Onde:**
- `{project_ref}` = ID do seu projeto (ex: `vgrelrhpkpcrtoibeykv`)
- `{access_token}` = Token de acesso da sua conta Supabase

### Onde encontrar o Access Token:

1. No dashboard do Supabase
2. Vá em **Account Settings → Access Tokens**
3. Crie um novo token ou use um existente

---

## 🔍 Verificar Status do Projeto

### Via Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Veja o status do projeto na lista
3. Projetos pausados aparecem com status "Paused"

### Via API:

```bash
curl 'https://api.supabase.com/v1/projects/{project_ref}' \
  -H 'Authorization: Bearer {access_token}'
```

---

## ⚠️ Importante

### O que acontece quando o projeto é pausado:

- ✅ **Dados preservados:** Todos os dados são mantidos
- ✅ **Configurações mantidas:** Variáveis, permissões, etc.
- ❌ **Inacessível:** API não responde durante a pausa
- ❌ **Sem conexão:** Aplicações não conseguem conectar

### Após despausar:

- ⏱️ **Tempo de restauração:** 1-3 minutos
- 🔄 **URL mantida:** A URL continua a mesma
- ✅ **Funciona normalmente:** Após restaurar, tudo volta ao normal

---

## 🛡️ Como Evitar Pausa Automática

### Opção 1: Usar o Projeto Regularmente

- Faça requisições ao banco pelo menos uma vez por semana
- Configure um cron job ou script que acesse o banco periodicamente

### Opção 2: Upgrade para Plano Pago

- Planos pagos não são pausados automaticamente
- Plano Pro: ~$25/mês
- Plano Team: ~$599/mês

### Opção 3: Script de "Keep-Alive"

Crie um script que acessa o banco periodicamente:

```javascript
// keep-alive.js
import { supabase } from './backend/config/supabase.config.js';

async function keepAlive() {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Keep-alive executado:', new Date().toISOString());
  } catch (error) {
    console.error('❌ Erro no keep-alive:', error.message);
  }
}

// Executar a cada 6 dias
setInterval(keepAlive, 6 * 24 * 60 * 60 * 1000);
keepAlive(); // Executar imediatamente
```

Configure para rodar automaticamente (cron, Windows Task Scheduler, etc.)

---

## 🐛 Troubleshooting

### Problema: Botão "Restore" não aparece

**Solução:**
- Verifique se você tem permissão de admin no projeto
- Tente acessar de outro navegador
- Limpe o cache do navegador

### Problema: Restauração demora muito

**Solução:**
- Aguarde até 5 minutos (pode demorar em projetos grandes)
- Recarregue a página
- Verifique o status na página do projeto

### Problema: Erro ao restaurar

**Solução:**
- Verifique se há problemas no Supabase: https://status.supabase.com
- Tente novamente após alguns minutos
- Entre em contato com o suporte do Supabase

---

## 📝 Após Despausar

1. ✅ **Verifique a conexão:**
   ```bash
   node backend/scripts/test-supabase.js
   ```

2. ✅ **Teste a aplicação:**
   - Tente fazer login novamente
   - Verifique se as requisições funcionam

3. ✅ **Configure keep-alive** (opcional):
   - Para evitar pausas futuras
   - Configure um script que acessa o banco regularmente

---

## 🎯 Resumo Rápido

1. Acesse: https://supabase.com/dashboard
2. Clique no projeto pausado
3. Clique em **"Restore project"**
4. Aguarde 1-3 minutos
5. Pronto! ✅

---

**Dica:** Após despausar, configure um keep-alive para evitar pausas futuras! 🔄

