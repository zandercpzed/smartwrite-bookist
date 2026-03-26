# HANDOVER — Smartwrite Bookist

> **Este documento é o prompt de contexto do projeto.**  
> Um novo agente (ou o mesmo agente numa nova sessão) deve lê-lo integralmente antes de fazer qualquer coisa.  
> Ele responde: *"O que foi feito?"* e *"O que fazer agora?"*

---

## 🎯 O Projeto (em 30 segundos)

O **Smartwrite Bookist** é um motor headless de geração de livros (PDF print-ready + EPUB3), portátil e extensível.

Ele extrai o design visual de um template `.idml` do InDesign, ingere o texto fonte em Markdown, e combina os dois para renderizar volumes editoriais sem abrir nenhuma interface gráfica.

- **Repositório:** https://github.com/zandercpzed/smartwrite-bookist
- **Template visual:** `_templates/template miolo.idml` (já existe)
- **Texto piloto:** `01. Liezi - HISTÓRIA DE YAN SHI (séc. IV AEC)/_ texto/` (11 arquivos .md)

---

## ✅ O que já foi feito

- [x] `01_PRODUTO.md` — PRD completo com É/Não É, Faz/Não Faz, Entradas/Saídas, Portabilidade, Métricas
- [x] `02_ROADMAP.md` e `03_BACKLOG.md` — Fases e tarefas definidas
- [x] `_arquitetura/OSS_COMPARAVEIS.md` — Análise de 6 sistemas OSS com matriz de decisão
- [x] `99_DIÁRIO.md` — Log de sessões iniciado
- [x] Workflows `/sod`, `/eod`, `/eow` criados em `_agent/workflows/`
- [x] 8 skills instaladas em `.agent/`
- [x] **ADR-001 APROVADO** — Stack: Node.js (orquestrador) + Typst CLI (PDF) + Pandoc (EPUB)
- [x] **ADR-002 APROVADO** — Estratégia IDML → Typst: unzipper + xml2js → theme.typ gerado automaticamente
- [x] **ADR-003 APROVADO** — Pipeline Markdown: unified/remark (AST) → conversão para sintaxe Typst → livro.typ

---

## 🚧 Onde Paramos

**Fase atual:** Todos os ADRs aprovados. **Pronto para Sprint 1 — primeiro código.**

---

## ▶️ Próximos Passos (Sprint 1 — PoC)

1. **Inicializar o repositório** no GitHub com a estrutura base do projeto Node.js/TypeScript
2. **Instalar dependências:** `unzipper`, `xml2js`, `unified`, `remark`, plugins remark, `@typst/typst` (CLI wrapper)
3. **Implementar `src/idml-parser.js`** — extrator IDML → theme.typ (seguindo ADR-002)
   - Rodar dump dos estilos do `template miolo.idml` primeiro (skill `idml-reader`)
4. **Implementar `src/markdown-compiler.js`** — AST Markdown → Typst (seguindo ADR-003)
   - Cobrir: headings, parágrafos, negrito, itálico, footnotes básicas
5. **Implementar `robo-render.js`** — orquestrador CLI: `bookist render --vol "01. Liezi"`
6. **Gerar o primeiro PDF** do Liezi e rodar `pdf-preflight` (skill)
7. **Gerar o primeiro EPUB** via Pandoc e rodar `epub-validator` (skill)

---

## ⚠️ Cuidados e Decisões Pacíficas

- **Stack APROVADA e FECHADA:** Node.js + Typst + Pandoc. Não reabrir esta discussão.
- **Asciidoctor descartado** como engine (footnotes → endnotes no Prawn; container Ruby 990MB). Documentado no ADR-001.
- **NENHUM** estilo será definido em código — apenas extraído do IDML.
- **NENHUM** texto editorial será editado pelo motor.
- O motor deve funcionar nos 4 modos: CLI, Docker, API REST, Cloud Run/Firebase.
- **Fail-Fast:** se build falhar uma vez, PARE e comunique.

---

## 📂 Arquivos-Chave

| Arquivo | Papel |
|---|---|
| `_docs/01_PRODUTO.md` | PRD completo |
| `_docs/02_ROADMAP.md` | 4 fases de desenvolvimento |
| `_docs/03_BACKLOG.md` | Tarefas da Sprint 1 |
| `_docs/99_DIÁRIO.md` | Memória estendida — log de decisões |
| `_arquitetura/ADR-001_stack-tecnologica.md` | Stack aprovada ✅ |
| `_arquitetura/ADR-002_idml-to-typst-theme.md` | Estratégia IDML ✅ |
| `_arquitetura/ADR-003_markdown-pipeline.md` | Pipeline Markdown ✅ |
| `_templates/template miolo.idml` | Template visual (source of truth do design) |
| `01. Liezi/_ texto/*.md` | Texto piloto para a PoC |

---

*Atualizado em: 2026-03-26 | Próxima sessão: Sprint 1 — primeiro código*
