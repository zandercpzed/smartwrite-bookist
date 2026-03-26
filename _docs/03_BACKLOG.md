# Backlog — Smartwrite Bookist

> **Stack definida (ADR-001):** Node.js (orquestrador) + Typst CLI (PDF) + Pandoc (EPUB)

---

## ✅ Sprint 0 — Arquitetura e Planejamento (CONCLUÍDA)

- [x] Definir produto: É/Não É, Faz/Não Faz, Entradas/Saídas, Portabilidade, Métricas (`01_PRODUTO.md`)
- [x] Pesquisar OSS comparáveis (`_arquitetura/OSS_COMPARAVEIS.md`)
- [x] ADR-001: Escolha de stack tecnológica → **Node.js + Typst + Pandoc APROVADO**
- [x] ADR-002: Estratégia IDML → Typst (unzipper + xml2js → theme.typ) **APROVADO**
- [x] ADR-003: Pipeline Markdown (unified/remark AST → Typst) **APROVADO**
- [x] Instalar skills do agente (8 skills em `.agent/`)
- [x] Criar workflows `/sod`, `/eod`, `/eow`

---

## 🔲 Sprint 1 — PoC: Primeiro PDF e EPUB do Liezi

### Setup
- [ ] Inicializar repositório GitHub (`git init`, `package.json`, `tsconfig.json`)
- [ ] Instalar dependências: `unzipper`, `xml2js`, `unified`, `remark`, `remark-footnotes`, `remark-gfm`
- [ ] Verificar se Typst CLI está disponível localmente (`typst --version`)
- [ ] Verificar se Pandoc está disponível localmente (`pandoc --version`)

### Extrator IDML (Sugador)
- [ ] Rodar dump dos estilos reais do `template miolo.idml` (skill `idml-reader`)
- [ ] Implementar `src/idml-parser.js` — extrai `ParagraphStyle`/`CharacterStyle` do XML
- [ ] Implementar `src/style-mapper.js` — normaliza valores (pt → em, pt → cm)
- [ ] Implementar `src/theme-generator.js` — gera `output/theme.typ`

### Compilador Markdown
- [ ] Implementar `src/markdown-compiler.js` — AST → Typst (headings, parágrafos, negrito, itálico, footnotes básicas)
- [ ] Implementar fallback para fonte sem glifos CJK (log de warning, não bloqueador)

### Orquestrador e Saída
- [ ] Implementar `robo-render.js` — CLI: `node robo-render.js --vol "01. Liezi"`
- [ ] Montar `livro.typ` (theme + rosto básico + corpo)
- [ ] Gerar PDF via `typst compile livro.typ`
- [ ] Gerar EPUB via Pandoc a partir do Markdown
- [ ] Rodar `pdf-preflight` (skill) no PDF gerado
- [ ] Rodar `epub-validator` (skill) no EPUB gerado

---

## 🔲 Sprint 2 — Rosto, Sumário e Metadados

- [ ] Frontmatter parser (`book.yaml` por volume — título, autor, ISBN, data)
- [ ] Sumário automático via `#outline()` do Typst
- [ ] Cabeçalho/rodapé de página: título esquerda, número direita (`right page`, `left page`)
- [ ] Folha de rosto e colofão gerados a partir de `book.yaml`

---

## 🔲 Sprint 3 — Casos de Borda ("As Dores")

- [ ] **Suporte multi-script (font stack):** substituir o fallback genérico CJK por uma stack
      de fontes tipada no `book.yaml` e/ou extraída do IDML:
      - CJK (Hanzi, Kanji, Pinyin): Kozuka Mincho Pr6N (já no IDML JSON)
      - Cirílico: Noto Serif
      - Árabe / Hebraico (RTL): Noto Naskh Arabic + bloco `#set text(dir: rtl)` no compilador
      - Devanagari / Sânscrito: Noto Serif Devanagari
      - Matemático / IPA: STIX Two Math
      - **Implementação:** `theme-generator.js` monta `font: (primária, …fallbacks)` a partir de
        `book.yaml[fonts.fallbacks]` + fontes extraídas do IDML (`idml-extractor.json`)

- [ ] Margens internas/externas espelhadas (sangria, bleed, crop marks)
- [ ] Tabelas Markdown → Typst
- [ ] Imagens `![alt](path)` → `#image(...)` Typst

---

## 🔲 Sprint 4 — Portabilidade e API

- [ ] Dockerizar o pipeline (container leve: Node + Typst + Pandoc, ~200MB)
- [ ] API REST `POST /render` → aceita volume ID, retorna PDF + EPUB
- [ ] Deploy em Cloud Run (GCloud) ou Firebase Functions
- [ ] Batch render: `bookist render --all` → processar todos os volumes da coleção
