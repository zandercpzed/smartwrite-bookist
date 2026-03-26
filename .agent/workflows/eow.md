---
description: Rotina de Fim de Semana — Revisão de Sprint, Integridade e Planejamento do Próximo Ciclo
---

# /eow — End of Week (Bookist)

> Execute esta rotina ao final de cada sprint ou semana de trabalho.

---

## 0. Executar o `/eod` (obrigatório, mesmo que já tenha rodado hoje)

> O `/eow` começa sempre com um `/eod` completo — sem exceção.
> Isso garante que o Diário, o Backlog, os ADRs e o GitHub estejam 100% sincronizados antes da revisão semanal.

Execute todos os steps do workflow `/eod` agora (veja `_agent/workflows/eod.md`).

---

## 1. Revisar o Sprint Atual

Leia o `_docs/03_BACKLOG.md` e responda:

- Quantas tarefas foram concluídas vs. planejadas?
- Alguma tarefa ficou bloqueada? Por quê?
- Alguma decisão de arquitetura foi tomada e ainda não documentada em ADR?

Apresente um **resumo de Sprint** ao Zander (3-5 linhas).

---

## 2. Verificar Integridade do Repositório

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git log --oneline -10
```

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git status
```

> [!CAUTION]
> Se houver arquivos não commitados, trate-os antes de prosseguir.

---

## 3. Verificar Integridade da Documentação

Confirme que os seguintes documentos estão atualizados:

- [ ] `_docs/04_HANDOVER.md` — Reflete o estado real do projeto?
- [ ] `_docs/03_BACKLOG.md` — Todas as tarefas concluídas marcadas como `[x]`?
- [ ] `_arquitetura/` — ADRs recentes têm status definido (`[APROVADO]` / `[EM DISCUSSÃO]`)?
- [ ] `_docs/99_DIÁRIO.md` — Todas as sessões da semana registradas?

---

## 4. Testes de Integridade do Pipeline (quando aplicável)

> Ativar após Sprint 1 — quando o primeiro artefato executável existir.

```bash
# [PLACEHOLDER] Rodar suite de testes do pipeline
# ex: node robo-render.js --vol "01. Liezi" --dry-run
echo "Testes de pipeline: ativar após Sprint 1"
```

---

## 5. Cleanup

// turbo
```bash
# Remover arquivos temporários e logs de build antigos
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && find . -name "*.log" -not -path "./.git/*" -mtime +7 -exec echo "Arquivo de log antigo: {}" \;
```

> Apenas liste — não delete automaticamente. Mostre a lista ao Zander para confirmar.

---

## 6. Planejar o Próximo Ciclo

Com base na revisão do Sprint e nas prioridades do Roadmap (`_docs/02_ROADMAP.md`):

1. Atualize `_docs/03_BACKLOG.md` com as tarefas do próximo ciclo
2. Identifique bloqueadores conhecidos
3. Defina o objetivo da próxima Sprint em UMA frase

Apresente ao Zander e aguarde confirmação antes de fechar a sessão.

---

## 7. Push e Sync Final

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git add -A && git commit -m "chore(docs): EOW sync - $(date +%Y-%m-%d)" || echo "✅ Nada novo para commitar"
```

// turbo
```bash
cd "/Users/zander/Library/CloudStorage/GoogleDrive-zander.cattapreta@zedicoes.com/Shared drives/Z•Edições/~ livros/# clássicos do futuro/_ robots" && git push origin main || echo "⚠️ Push falhou"
```
