---
description: Rotina de Fim de Dia — Documentação, Git Sync e Handover do Bookist
---

# /eod — End of Day (Bookist)

> Execute esta rotina ao final de cada sessão de trabalho no projeto `smartwrite-bookist`.
> **Esta rotina é obrigatória. Não encerre a sessão sem completá-la.**

---

## 1. Atualizar o `99_DIÁRIO.md`

Adicione uma entrada ao `_docs/99_DIÁRIO.md` com:
- Data e participantes da sessão
- O que foi discutido e as decisões tomadas
- Próximos passos imediatos

---

## 2. Atualizar o Backlog (`03_BACKLOG.md`)

- Marque as tarefas concluídas com `[x]`
- Adicione novas tarefas descobertas durante a sessão
- Reavalie prioridades se necessário

---

## 3. Atualizar ADRs em `_arquitetura/` (se aplicável)

Se alguma decisão de arquitetura foi tomada ou modificada na sessão:
- Atualize o ADR correspondente (ou crie um novo)
- Mude o status de `[EM DISCUSSÃO]` para `[APROVADO]` ou `[REJEITADO]` conforme o caso

---

## 4. Atualizar o `01_PRODUTO.md` (se aplicável)

Se algum requisito foi adicionado, alterado ou removido, atualize o documento de produto.

---

## 5. Git Add, Commit e Push

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git add -A && git commit -m "chore(docs): EOD sync - $(date +%Y-%m-%d)" || echo "✅ Nada novo para commitar"
```

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git push origin main || echo "⚠️ Push falhou ou branch não configurada"
```

> [!CAUTION]
> **REGRA FAIL-FAST:** Se o push falhar, **PARE** e comunique. Não tente resolver sozinho.

---

## 6. Atualizar o Handover (`04_HANDOVER.md`)

Atualize a seção "O que a Inteligência Antiga já testou" com qualquer descoberta técnica nova da sessão. Mantenha o documento curto e relevante para o próximo agente.

---

## 7. Declarar Fim de Sessão

Declare ao Zander:
> "EOD concluído. Resumo: [2-3 linhas do que foi feito]. Próxima sessão: [próximo objetivo]."
