# ADR-003: Pipeline de Compilação Markdown → Typst

**Status:** APROVADO ✅
**Data:** 2026-03-26
**Decisores:** Zander + Agente
**Depende de:** ADR-001 (stack: Node.js + Typst), ADR-002 (tema via IDML)

---

## Contexto

O texto editorial vive em múltiplos arquivos `.md` (um por seção), escritos pelo time editorial. O Bookist precisa transformar esses arquivos em um documento Typst estruturado (`.typ`), aplicar o tema gerado pelo ADR-002 e enviar ao engine Typst para renderização final.

O Typst não tem suporte nativo a Markdown — a conversão é responsabilidade nossa.

---

## Decisão

**Pipeline em 4 etapas, implementado em Node.js:**

### Etapa 1 — Leitura e Ordenação das Seções

- Ler todos os arquivos `secao-NN_*.md` da pasta `_ texto/` em ordem léxica
- Extrair o frontmatter YAML de cada arquivo (se existir) — metadados por seção
- Ler o arquivo `book.yaml` global — metadados do volume (título, autor, ISBN, etc.)

### Etapa 2 — Parse do Markdown

- Usar **`unified`** com plugins **`remark`** para parsear o Markdown para AST
- Preservar: headings, parágrafos, negrito, itálico, footnotes (`[^1]`), citações, listas
- Mapear notas de rodapé Markdown `[^id]: texto` para `footnote[texto]` do Typst

### Etapa 3 — Conversão AST → Typst

- Traduzir cada nó do AST para a sintaxe Typst equivalente:

| Markdown | Typst |
|---|---|
| `# Título` | `= Título` |
| `## Subtítulo` | `== Subtítulo` |
| `**negrito**` | `*negrito*` |
| `_itálico_` | `_itálico_` |
| `[^1]` (inline) | `footnote[texto da nota]` |
| `> citação` | `#quote[citação]` |
| `---` (divisor) | `#line(length: 100%)` |
| Imagem `![alt](path)` | `#image("path", alt: "alt")` |

### Etapa 4 — Montagem do Documento Final

- Concatenar em um único `livro.typ`:
  1. `#import "theme.typ": *` (tema gerado pelo ADR-002)
  2. Folha de rosto (metadados do `book.yaml`)
  3. Sumário automático (`#outline()` do Typst)
  4. Corpo do livro (seções compiladas)
  5. Colofão (metadados editoriais)

---

## Casos de Borda Mapeados

| Elemento | Abordagem |
|---|---|
| Caracteres CJK (Pinyin, Hanzi) | Passados literalmente — Typst suporta UTF-8 nativo |
| Notas numeradas `[^1]` múltiplas | `remark-footnotes` processa; mapeadas para `footnote:id[]` Typst |
| Imagens sem resolução suficiente | Log de warning durante compilação; não bloqueia |
| Frontmatter YAML inválido | Erro com mensagem clara: `❌ markdown-compiler: frontmatter inválido em secao-XX` |

---

## Consequências

**Positivas:**
- Pipeline totalmente automatizado: `$ bookist render --vol "01"` → PDF + EPUB
- Fonte de verdade editorial permanece nos `.md` — nunca tocados pelo motor
- AST intermediário permite reutilização futura (ex: geração de EPUB a partir do mesmo parse)

**Trade-offs:**
- A camada de conversão `Markdown AST → Typst` é código a ser desenvolvido — nossa contribuição original
- Elementos Markdown muito específicos (tabelas complexas, HTML inline) precisarão de tratamento individual

**Pendências:**
- [ ] Sprint 1: implementar o parser básico cobrindo: headings, parágrafos, negrito, itálico, footnotes
- [ ] Sprint 2: implementar frontmatter parser e injeção automática de TOC, rosto e colofão
- [ ] Sprint 3 (backlog): tabelas, imagens, caracteres CJK stress test
