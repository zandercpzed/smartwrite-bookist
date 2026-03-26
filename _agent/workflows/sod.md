---
description: Rotina de Início de Dia — Contextualização e Planejamento do Bookist
---

# /sod — Start of Day (Bookist)

> Execute esta rotina no início de cada sessão de trabalho no projeto `smartwrite-bookist`.

---

## 1. Ler o Handover (Documento Principal de Contexto)

> O `04_HANDOVER.md` é o **prompt de entrada** do projeto. Ele diz o que foi feito e o que está planejado a seguir. Leia-o primeiro, sempre.

1. **`_docs/04_HANDOVER.md`** — Leia integralmente. Este é o seu briefing de contexto.
2. **`_docs/03_BACKLOG.md`** — Confirme as prioridades da Sprint atual.
3. **`_arquitetura/`** — Há ADRs marcados como `[EM DISCUSSÃO]` que precisam de decisão?

> 💡 O `99_DIÁRIO.md` é a memória estendida do projeto (log de decisões históricas). Consulte-o apenas se precisar entender o histórico de uma decisão específica.

---

## 2. Verificar Estado do Git e Sincronizar

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git status --short && git fetch origin && git log origin/main..HEAD --oneline 2>/dev/null || echo "Branch local sincronizada"
```

---

## 3. Levantar Ambiente Local

> **⚠️ Este step evolui conforme a stack for definida nos ADRs.**  
> Após os ADRs serem aprovados, substitua os placeholders abaixo pelos comandos reais da stack escolhida.

// turbo
```bash
# Verificar runtimes instalados e versões
node --version 2>/dev/null && echo "Node ✅" || echo "Node ❌ não encontrado"
# [PLACEHOLDER] Adicionar verificação do engine de renderização (ex: typst --version) quando definido
```

> [!IMPORTANT]
> Se qualquer runtime ou serviço essencial não estiver disponível, **PARE e comunique ao Zander** antes de continuar.

---

## 4. Verificar Atualizações de Dependências e Ferramentas

> Execute apenas quando houver um `package.json` ou equivalente no projeto.

```bash
# [PLACEHOLDER] npm outdated  ← ativar quando package.json existir
# [PLACEHOLDER] Verificar versão do engine de render vs. versão instalada
echo "Checagem de dependências: ativar após Sprint 1 (setup do projeto)"
```

> Reporte ao Zander qualquer atualização de **minor** ou **major** antes de aplicar. Patches podem ser aplicados sem bloqueio.

---

## 5. Verificar Integridade de Rede e Serviços

// turbo
```bash
# Verificar conectividade básica e acesso ao GitHub
curl -s --max-time 5 https://api.github.com/repos/zandercpzed/smartwrite-bookist | grep -q '"name"' && echo "GitHub ✅ acessível" || echo "GitHub ❌ sem resposta"
```

> [!IMPORTANT]
> Se não houver conectividade com o GitHub, avise imediatamente — não tente fazer push nem consultar issues.

---

## 6. Definir o Objetivo da Sessão

Com base no Handover e no Backlog, defina em UMA frase o objetivo do dia e compartilhe com o Zander:

> "Hoje o objetivo é: [OBJETIVO]"

Aguarde confirmação antes de qualquer execução.

---

## 7. Atualizar o task.md

Crie ou atualize o artefato `task.md` com as tarefas planejadas para a sessão, seguindo o método APAE.
