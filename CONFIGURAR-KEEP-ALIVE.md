# 🔄 Configurar Keep-Alive para Supabase

Guia para configurar o script keep-alive e evitar que o Supabase pause o projeto automaticamente.

---

## 🎯 Por que usar Keep-Alive?

O Supabase pausa projetos do plano gratuito após **1 semana de inatividade**. O script keep-alive acessa o banco periodicamente para mantê-lo ativo.

---

## 📋 Opções de Configuração

### Opção 1: Execução Manual (Simples)

Execute manualmente a cada 6 dias:

```bash
node backend/scripts/keep-alive.js
```

**Vantagens:**
- ✅ Simples
- ✅ Não precisa configurar nada

**Desvantagens:**
- ❌ Precisa lembrar de executar
- ❌ Não é automático

---

### Opção 2: Windows Task Scheduler (Recomendado para Windows)

Configure para executar automaticamente:

1. **Abrir o Agendador de Tarefas:**
   - Pressione `Win + R`
   - Digite: `taskschd.msc`
   - Pressione Enter

2. **Criar Nova Tarefa:**
   - Clique em **"Criar Tarefa Básica"**
   - Nome: `Supabase Keep-Alive`
   - Descrição: `Mantém o projeto Supabase ativo`

3. **Configurar Gatilho:**
   - Escolha: **"Recorrente"**
   - Repetir: **"A cada 6 dias"**
   - Hora: Escolha um horário (ex: 02:00)

4. **Configurar Ação:**
   - Ação: **"Iniciar um programa"**
   - Programa: `node`
   - Argumentos: `C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive\backend\scripts\keep-alive.js`
   - Iniciar em: `C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive`

5. **Salvar:**
   - Clique em **"Concluir"**

**✅ Pronto!** O script executará automaticamente a cada 6 dias.

---

### Opção 3: Script Contínuo (Servidor Sempre Ligado)

Se você tem um servidor sempre ligado:

```bash
# Executar e deixar rodando em background
node backend/scripts/keep-alive-continuous.js
```

**Ou usar PM2 (gerenciador de processos):**

```bash
# Instalar PM2
npm install -g pm2

# Executar keep-alive com PM2
pm2 start backend/scripts/keep-alive-continuous.js --name "supabase-keepalive"

# Ver status
pm2 status

# Ver logs
pm2 logs supabase-keepalive

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

---

### Opção 4: Serviço de Nuvem (Mais Confiável)

Use um serviço online que executa HTTP requests periodicamente:

#### Usando cron-job.org (Gratuito)

1. **Criar endpoint HTTP no backend:**

```javascript
// backend/routes/keep-alive.routes.js
import express from 'express';
import { supabase } from '../config/supabase.config.js';

const router = express.Router();

router.get('/keep-alive', async (req, res) => {
  try {
    const { count } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true });
    
    res.json({ 
      success: true, 
      message: 'Keep-alive executado',
      timestamp: new Date().toISOString(),
      photosCount: count || 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
```

2. **Registrar rota no backend:**

```javascript
// backend/index.js
import keepAliveRoutes from './routes/keep-alive.routes.js';
// ...
app.use('/api', keepAliveRoutes);
```

3. **Configurar no cron-job.org:**
   - Acesse: https://cron-job.org
   - Crie uma conta gratuita
   - Crie novo job:
     - URL: `https://seu-backend.railway.app/api/keep-alive`
     - Intervalo: A cada 6 dias
     - Método: GET

**✅ Pronto!** O serviço chamará seu endpoint automaticamente.

---

## 🧪 Testar o Script

Execute manualmente para testar:

```bash
node backend/scripts/keep-alive.js
```

**Saída esperada:**
```
🔄 Keep-Alive executado: 2025-01-XX...
✅ Keep-alive executado com sucesso!
📊 Total de fotos no banco: X

✅ Projeto Supabase mantido ativo!
💡 Execute este script a cada 6 dias para evitar pausas automáticas.
```

---

## 📅 Calendário Recomendado

Execute o keep-alive:
- ✅ **A cada 6 dias** (antes de completar 7 dias de inatividade)
- ✅ **Horário:** Qualquer horário (prefira madrugada)
- ✅ **Frequência mínima:** 1 vez por semana

---

## 🔍 Verificar se Está Funcionando

### No Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Vá em **Logs** → **API Logs**
3. Você deve ver requisições periódicas do keep-alive

### No Backend:

Se configurou o endpoint HTTP, verifique os logs:
- Deve aparecer requisições GET em `/api/keep-alive`
- A cada 6 dias aproximadamente

---

## 🐛 Troubleshooting

### Script não executa

**Verifique:**
1. Node.js está instalado? `node --version`
2. Caminho do script está correto?
3. Variáveis de ambiente estão configuradas?

### Erro de conexão

**Verifique:**
1. Supabase está despausado?
2. `SUPABASE_URL` está correto?
3. `SUPABASE_SERVICE_KEY` está configurado?

### Task Scheduler não funciona

**Solução:**
1. Verifique se a tarefa está habilitada
2. Teste executar manualmente primeiro
3. Verifique os logs do Task Scheduler

---

## 💡 Dicas

1. **Combine métodos:** Use Task Scheduler + serviço de nuvem para redundância
2. **Monitore:** Configure alertas se o keep-alive falhar
3. **Documente:** Anote quando configurou para referência futura
4. **Teste:** Execute manualmente antes de automatizar

---

## 📝 Checklist

- [ ] Script keep-alive criado
- [ ] Testado manualmente
- [ ] Configurado método de execução automática
- [ ] Verificado que está funcionando
- [ ] Documentado quando configurado

---

**Pronto!** Seu projeto Supabase não será mais pausado automaticamente! 🎉

