---
description: Como iniciar o dia de trabalho no projeto Z•Edições
---

# Workflow: Start of Day (SOD)

Execute este workflow no início de cada dia de trabalho.

---

## 1. Autenticação e Configuração

### 1.1 Google Cloud

// turbo

```bash
gcloud auth application-default print-access-token > /dev/null 2>&1 && echo "✅ gcloud ADC OK" || echo "❌ gcloud ADC expirado — rodar: gcloud auth application-default login"
```

> Se `❌`: rodar `gcloud auth application-default login` (abre browser)

**Teste:**

// turbo

```bash
gcloud projects describe z-sade --format="value(projectId)" 2>&1 && echo "✅ Projeto z-sade acessível"
```

### 1.2 Firebase

// turbo

```bash
firebase login
```

**Teste:**

// turbo

```bash
firebase projects:list 2>&1 | head -8
```

### 1.3 Shopify Token (expira 24h — renovação obrigatória)

// turbo

```bash
cd "/Users/zander/Documents/_ coding/_ zedicoes-sade" && node scripts/integrations/get-shopify-token.js --update-env
```

**Resultado esperado:** `✅ Token obtido com sucesso!` + `.env atualizado automaticamente`

**Teste:**

// turbo

```bash
TOKEN=$(grep SHOPIFY_ACCESS_TOKEN "/Users/zander/Documents/_ coding/_ zedicoes-sade/.env" | cut -d= -f2) && curl -s -H "X-Shopify-Access-Token: $TOKEN" "https://3983be.myshopify.com/admin/api/2024-01/shop.json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Shopify OK: {d[\"shop\"][\"name\"]}')" || echo "❌ Shopify falhou"
```

> Se 401: verificar `SHOPIFY_CLIENT_ID` e `SHOPIFY_CLIENT_SECRET` no `.env` e no Dev Dashboard (https://dev.shopify.com/dashboard)

---

## 2. Carregar Contexto do Projeto

### 2.1 Ler Estado Atual

```bash
cat "/Users/zander/Documents/_ coding/_ zedicoes-sade/_docs/ESTADO_ATUAL.md"
```

### 2.2 Revisar Regras de Ouro

// turbo

```bash
cat "_docs/behavior/00_regras_de_ouro.md"
```

**Confirmar entendimento:**

- ✓ Ciclo A.P.A.E. (Analisar → Planejar → Autorizar → Executar)
- ✓ Comando "PARE" = interrupção imediata, sem justificativas
- ✓ Pare na falha recorrente (2x = STOP)
- ✓ Nenhuma ação sem autorização expressa

---

## 3. Subir Ambiente Local (OBRIGATÓRIO)

Sempre subir o ambiente local no início da sessão.

// turbo

```bash
bash "/Users/zander/Documents/_ coding/_ zedicoes-sade/scripts/dev-up.sh"
```

**Teste:**

// turbo

```bash
echo "=== FRONTEND ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200" && echo "✅ Frontend OK (5173)" || echo "❌ Frontend não responde" && echo "=== EDITORIAL ===" && curl -s http://localhost:3002/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Editorial OK: {d[\"service\"]}')" 2>/dev/null || echo "❌ Editorial não responde (porta 3002)"
```

### 3.1 Subir Ambiente SADEdemo (Opcional - Sideproject)

Se a tarefa do dia envolver o ambiente de demonstração SADE, inicie o servidor na pasta designada.

```bash
cd "/Users/zander/Documents/_ coding/_ zedicoes-sade/_docs/projeto/sideprojects/sadedemo" && npm run dev
```

---

## 4. Verificar Saúde dos Serviços (Produção)

### 4.1 Gateway

// turbo

```bash
curl -s https://zed-gateway-700562824890.southamerica-east1.run.app/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Gateway: {d[\"status\"]}')" || echo "❌ Gateway não respondeu"
```

### 4.2 Editorial Service

// turbo

```bash
curl -s https://zed-editorial-service-5epjlhwyjq-rj.a.run.app/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Editorial: {d[\"status\"]}')" || echo "❌ Editorial não respondeu"
```

### 4.3 Orders Service

// turbo

```bash
curl -s https://zed-orders-service-5epjlhwyjq-rj.a.run.app/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Orders: {d[\"status\"]}')" || echo "❌ Orders não respondeu"
```

---

## 5. Verificar Git Status

// turbo

```bash
cd "/Users/zander/Documents/_ coding/_ zedicoes-sade" && git status && echo "---" && git log --oneline -3
```

**Verificar:**

- Há mudanças não commitadas?
- Branch sincronizado com origin?

---

## 6. Atualizar Documentação

Revisar e atualizar os documentos de projeto conforme necessário:

```bash
# Docs a verificar:
cat _docs/ESTADO_ATUAL.md   # Verificar se dados estão atuais
cat _docs/TODO.md            # Verificar se tarefas estão corretas
cat _docs/CHANGELOG.md       # Adicionar mudanças do dia anterior se faltam
```

**Ações:**

- [ ] `ESTADO_ATUAL.md` — dados e serviços atuais?
- [ ] `TODO.md` — próximas tarefas corretas?
- [ ] `CHANGELOG.md` — entradas do dia anterior registradas?

---

## 7. Definir Objetivos do Dia

Atualizar o artifact `task.md` com:

- [ ] Tarefas prioritárias para hoje
- [ ] Bloqueadores conhecidos
- [ ] Objetivos específicos

> [!IMPORTANT]
> **PONTO DE CHECAGEM DO APAE (Autorizar):** Após montar o plano de hoje (em `task.md` ou `implementation_plan.md`), você **OBRIGATORIAMENTE** deve parar e pedir permissão ao humano via notificação `BlockedOnUser: true` antes de escrever qualquer código. NÃO prossiga para a execução com a diretiva `// turbo`.

---

## Checklist Final

- [ ] gcloud ADC autenticado e testado?
- [ ] Firebase logado e testado?
- [ ] Shopify token renovado e testado?
- [ ] Ambiente local de pé e testado (frontend + editorial)?
- [ ] Serviços de produção healthy?
- [ ] Git status verificado?
- [ ] Documentação atualizada?
- [ ] Objetivos do dia definidos?

---

**Tempo estimado:** 5-8 minutos
**Última atualização:** 02/mar/2026
