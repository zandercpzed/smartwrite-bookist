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

### Sprint 1 — Primeiro PDF e EPUB (2026-03-25/26)
- [x] Setup: Node.js ESM, Typst 0.14.2, Pandoc 3.9 instalados
- [x] `src/idml-parser.js` — extrator IDML (Sprint 1, agora camada de compatibilidade)
- [x] `src/style-mapper.js` — mapeamento semântico + conversão de unidades
- [x] `src/theme-generator.js` — gerador de `theme.typ`
- [x] `src/markdown-compiler.js` — AST remark → Typst
- [x] `robo-render.js` — orquestrador CLI principal
- **Resultado:** PDF 234KB + EPUB 42KB em 4.2s ✅

### Sprint 2 — Rosto, Sumário e Metadados (2026-03-26)
- [x] `book.yaml` por volume (título, autor, ISBN, colofão)
- [x] `src/book-meta-parser.js` — lê book.yaml com defaults seguros
- [x] `src/book-assembler.js` — gera `rosto.typ` e `colofao.typ`
- [x] Cabeçalho alternado (título recto / heading verso) + rodapé numerado
- [x] Folha de rosto + `#outline()` + colofão integrados no `livro.typ`
- [x] Fonte Cardo instalada via `font-cardo` Homebrew Cask
- **Resultado:** PDF 293KB em 0.7s, zero warnings ✅

### Sprint 3 — Extração Completa do IDML (2026-03-26)
- [x] `src/idml-extractor.js` (NOVO) — extrai TUDO do IDML:
  - 47 estilos de parágrafo + 8 de caractere com herança `BasedOn` resolvida transitivamente
  - Cores/swatches (Graphic.xml), Fontes (Fonts.xml), TextVariables, Languages
  - Geometria de página + MasterSpread recto/verso
- [x] `_templates/template miolo.idml.json` (62KB) — **fonte de verdade do design, versionada no git**
- [x] `src/idml-parser.js` refundado como camada de compatibilidade com cache automático
- [x] Novo comando: `node robo-render.js extract-idml`
- [x] `theme-generator.js`: H1 com `align(center)` + `leading:24pt` + `pagebreak(weak: true)`, H2 com `leading:14pt`, H3 com Cardo transitivo
- **Resultado:** render 1.0s, zero warnings, theme.typ fiel ao InDesign ✅

---

## 🚧 Onde Paramos

**Fase atual:** Sprint 3 concluída. **Pronto para Sprint 4 — Qualidade Editorial.**

**Último commit:** `16e76ef` — fix(theme): H1 align:center+leading, H2/H3 leading via resolved, pagebreak fraco

---

## ▶️ Próximos Passos (Sprint 4 — Qualidade Editorial)

1. **Font stack multi-script** — substituir o `fallback: true` genérico por uma stack tipada:
   - CJK: Kozuka Mincho Pr6N (já no IDML JSON)
   - Cirílico, Árabe RTL, Devanagari — declarados em `book.yaml[fonts.fallbacks]`
2. **Epígrafe** — mapear `Epigraph and Dedication` do IDML → estilo específico no `theme.typ`
3. **Ornamento HR** — `---` no Markdown → ornamento `✦` centralizado (em vez de `#line`)
4. **DropCap** — primeira letra capitular após H1 via `state()` do Typst
5. **Usar `resolved` nos estilos restantes** — Bibliography, Centered, Ornaments

---

## ⚠️ Cuidados e Decisões Pacíficas

- **Stack APROVADA e FECHADA:** Node.js + Typst + Pandoc. Não reabrir.
- **Nome do projeto:** Smartwrite Bookist (parte da suite Smartwrite)
- **Volumes ficam em `FASE I/`, `FASE II/`, `FASE III/`** — fora do repositório `_ robots/`
- **NENHUM** estilo será definido em código — apenas extraído do IDML.
- **`_templates/template miolo.idml.json`** é o artefato de extração — regenerar com `extract-idml` após mudança no InDesign.
- A **herança `BasedOn`** é resolvida pelo `idml-extractor.js` — campo `resolved` contém valores com herança aplicada. O `idml-parser.js` usa `toLegacyStyle()` que prioriza `resolved`.
- **RTL (árabe/hebraico):** requer `#set text(dir: rtl)` por bloco no `markdown-compiler.js` — Sprint 5+.
- **Fail-Fast:** se build falhar uma vez, PARE e comunique.

---

## 📂 Arquivos-Chave

| Arquivo | Papel |
|---|---|
| `_docs/01_PRODUTO.md` | PRD completo |
| `_docs/03_BACKLOG.md` | Tarefas da Sprint 4 |
| `_docs/99_DIÁRIO.md` | Memória estendida — log de decisões |
| `_arquitetura/ADR-001_stack-tecnologica.md` | Stack aprovada ✅ |
| `_templates/template miolo.idml` | Template visual |
| `_templates/template miolo.idml.json` | **JSON extraído (62KB) — fonte de verdade do design** |
| `src/idml-extractor.js` | Extração completa do IDML com BasedOn resolvido |
| `src/idml-parser.js` | Camada de compatibilidade (delega ao extractor) |
| `src/style-mapper.js` | Mapeamento semântico + conversão de unidades |
| `src/theme-generator.js` | Gerador de theme.typ (H1 center, pagebreak, leadings) |
| `src/markdown-compiler.js` | Compilador Markdown → Typst |
| `src/book-meta-parser.js` | Lê book.yaml com defaults seguros |
| `src/book-assembler.js` | Gera rosto.typ e colofao.typ |
| `robo-render.js` | Orquestrador CLI + comando extract-idml |
| `FASE I/01. Liezi/book.yaml` | Metadados editoriais do volume piloto |

---

*Atualizado em: 2026-03-26 | Sprint 3 concluída | Próxima sessão: Sprint 4 — Qualidade Editorial*
