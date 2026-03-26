# HANDOVER — Smartwrite Bookist

> **Este documento é o prompt de contexto do projeto.**  
> Um novo agente (ou o mesmo agente numa nova sessão) deve lê-lo integralmente antes de fazer qualquer coisa.  
> Ele responde: *"O que foi feito?"* e *"O que fazer agora?"*

---

## 🎯 O Projeto (em 30 segundos)

O **Smartwrite Bookist** é um motor headless de geração de livros (PDF print-ready + EPUB3), portátil e extensível. Parte da suite **Smartwrite**.

Ele extrai o design visual de um template `.idml` do InDesign, ingere o texto fonte em Markdown, e combina os dois para renderizar volumes editoriais sem abrir nenhuma interface gráfica.

- **Repositório:** https://github.com/zandercpzed/smartwrite-bookist
- **Template visual:** `_templates/template miolo.idml` (já existe)
- **Texto piloto:** `FASE I/01. Liezi - HISTÓRIA DE YAN SHI/_ texto/` (10 arquivos .md)

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
- [x] **Sprint 1 CONCLUÍDA** — Primeiro PDF e EPUB do Liezi gerados com sucesso

### 🏆 Sprint 1 — Entregáveis (2026-03-26)

| Arquivo | O que faz |
|---|---|
| `package.json` | Setup do projeto Node.js (ESM) |
| `src/idml-parser.js` | Extrai 47 estilos do `template miolo.idml` (traversal recursivo) |
| `src/style-mapper.js` | Mapeia nomes reais IDML → roles Typst; converte pt→em/cm |
| `src/theme-generator.js` | Gera `output/theme.typ` válido para Typst 0.14.2 |
| `src/markdown-compiler.js` | AST remark → Typst (headings, negrito, itálico, footnotes, escape `#/@`) |
| `robo-render.js` | Orquestrador CLI: `node robo-render.js render --vol "01. Liezi"` |

**Resultado:** `01._Liezi_miolo.pdf` (234KB) + `01._Liezi.epub` (42KB) em **4.2s** ✅

---

## 🚧 Onde Paramos

**Fase atual:** Sprint 1 concluída. **Pronto para Sprint 2 — Rosto, Sumário e Metadados.**

---

## ▶️ Próximos Passos (Sprint 2)

1. **`book.yaml` parser** — frontmatter por volume (título, autor, ISBN, data)
2. **Sumário automático** via `#outline()` no Typst
3. **Folha de rosto** gerada a partir de `book.yaml`
4. **Cabeçalho/rodapé de página** (título esquerda, número direita — recto/verso)
5. **Colofão** com metadados editoriais

---

## ⚠️ Cuidados e Decisões Pacíficas

- **Stack APROVADA e FECHADA:** Node.js + Typst + Pandoc. Não reabrir esta discussão.
- **Nome do projeto:** Smartwrite Bookist (parte da suite Smartwrite)
- **Volumes ficam em `FASE I/`, `FASE II/`, `FASE III/`** — fora do repositório `_ robots/`
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
| `_docs/03_BACKLOG.md` | Tarefas da Sprint 2 |
| `_docs/99_DIÁRIO.md` | Memória estendida — log de decisões |
| `_arquitetura/ADR-001_stack-tecnologica.md` | Stack aprovada ✅ |
| `_arquitetura/ADR-002_idml-to-typst-theme.md` | Estratégia IDML ✅ |
| `_arquitetura/ADR-003_markdown-pipeline.md` | Pipeline Markdown ✅ |
| `_templates/template miolo.idml` | Template visual (source of truth do design) |
| `src/idml-parser.js` | Extrator IDML → estilos normalizados |
| `src/style-mapper.js` | Mapeamento semântico + conversão de unidades |
| `src/theme-generator.js` | Gerador de theme.typ |
| `src/markdown-compiler.js` | Compilador Markdown → Typst |
| `robo-render.js` | Orquestrador CLI principal |

---

*Atualizado em: 2026-03-26 | Sprint 1 concluída | Próxima sessão: Sprint 2 — Rosto, Sumário e Metadados*
