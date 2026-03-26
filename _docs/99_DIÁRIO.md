# 📓 Diário do Projeto — Z•Robô (Smartwrite Bookist)

> Este é um log humano das decisões, discussões e descobertas do projeto.  
> Formato: `[DATA] — ASSUNTO — O que foi discutido e o que foi decidido.`

---

## 2026-03-25 — Sessão Inaugural / Handover

**Participantes:** Zander + Agente de Desenvolvimento (IA)

- Lemos o documento `04_HANDOVER.md`, que explica o porquê do projeto: o InDesign é inviável para produção em escala de 100+ volumes. A solução é um motor headless.
- Mapeamos a estrutura de diretórios. O template visual já existe: `_templates/template miolo.idml`.
- O texto fonte do primeiro livro (01. Liezi) está dividido em 11 arquivos Markdown semânticos dentro de `_ texto/`.
- O repositório GitHub foi identificado: `https://github.com/zandercpzed/smartwrite-bookist` — ainda vazio.
- **Nome público do projeto:** Smartwrite Bookist.

---

## 2026-03-26 — Discussão de Arquitetura (Rodada 1)

**Participantes:** Zander + Agente

- Primeiro rascunho de tech stack proposta pelo agente: Node.js + Paged.js + Pandoc.
- Zander provocou a discussão: **E Rust? E Ruby?** — não para escolhê-los, mas para garantir que a decisão seja fundamentada, não por preferência.
- **Princípio estabelecido (decisão de processo):** O agente não deve concordar com o Zander só porque ele disse que não gosta de algo. Planejamento exige rigor. Nada de vieses de confirmação.
- Pesquisa realizada sobre: Typst (Rust), Asciidoctor-PDF (Ruby/Prawn), Node.js + Paged.js, Pandoc + LaTeX.
- **Descoberta crítica:** Asciidoctor-PDF (via Prawn) converte footnotes em endnotes — bloqueador estrutural para literatura acadêmica.
- Analisado o projeto **pythonfluente2e** (O'Reilly, Luciano Ramalho): usa AsciiDoc → asciidoctor-epub3 via Docker Ruby (990MB). PDF gerado pelo Atlas proprietário da O'Reilly — não reproduzível. Confirma peso do Ruby em container.
- **Novos requisitos confirmados:** motor portátil, n-aplicável, deployável em GCloud/Firebase (Cloud Run).

**Decisões tomadas:**
- **ADR-001 APROVADO:** Stack = Node.js (orquestrador) + Typst CLI/Rust (PDF) + Pandoc (EPUB)
- **ADR-002 APROVADO:** Estratégia IDML → Typst via unzipper + xml2js → theme.typ gerado automaticamente
- **ADR-003 APROVADO:** Pipeline Markdown via unified/remark (AST) → conversão para sintaxe Typst

**Infraestrutura do agente criada:**
- Workflows `/sod`, `/eod`, `/eow` adaptados ao Bookist
- 8 skills instaladas em `.agent/`: golden-rules, code-standard, adr-writer, session-register, idml-reader, pdf-preflight, epub-validator, debug-pipeline, keyword-extractor

**Pendências imediatas:**
- Sprint 1: inicializar repositório GitHub e escrever o primeiro código

**Encerramento da sessão (EOD):**
- Repositório inicializado e publicado no GitHub (`git init` + force push)
- `LICENSE` MIT criada
- `.gitignore` configurado (`_temp/`, `_bkps/`, `.DS_Store`, `output/`)
- Livro-teste movido pelo Zander para `_temp/` (não commitado)
- `README.md` público criado — apresentação do projeto no GitHub
- Workflows movidos de `_agent/` para `.agent/workflows/` — estrutura unificada

---

## 2026-03-26 — Sprint 2: Rosto, Sumário e Metadados

**Participantes:** Zander + Agente

**O que foi feito:**
- Criado `book.yaml` por volume com metadados editoriais (título, autor, ISBN, colofão)
- Implementados `src/book-meta-parser.js` e `src/book-assembler.js`
- O `robo-render.js` agora gera `rosto.typ` (folha de rosto), `#outline()` (sumário automático) e `colofao.typ`
- `theme-generator.js` atualizado com cabeçalho alternado (título na recto / heading corrente na verso) e rodapé numerado
- **Fonte Cardo instalada** via Homebrew Cask (`font-cardo`) — resolveu warning de fonte

**Decisões:**
- `book.yaml` é a fonte de verdade editorial por volume (metadados mutáveis)
- O IDML é a fonte de verdade de design (fontes, margens, estilos)
- Fallback gracioso: sem `book.yaml`, o PDF é gerado sem rosto/sumário/colofão

**Resultado:** PDF 293KB com rosto + sumário + corpo + colofão em 0.7s ✅

---

## 2026-03-26 — Sprint 3: Extração Completa do IDML

**Participantes:** Zander + Agente

**Ponto levantado pelo Zander:** a extração do IDML era parcial, volátil (só em memória) e não resolvia herança de estilos via `BasedOn`. Era o problema raiz de H2/H3/Footnotes terem `fontFamily: null`.

**Decisão arquitetural (sem ADR formal, mas relevante):**
- A extração IDML deve ser **completa** e **persistida** em JSON (`_templates/template miolo.idml.json`)
- Este JSON é a **fonte de verdade visual** do template — versionado no git

**O que foi feito:**
- Criado `src/idml-extractor.js`: extrai 47 estilos de parágrafo, 8 de caractere, cores, fontes, variáveis, master pages e geometria
- Resolução de herança `BasedOn` recursiva e transitiva (H3→H2→H1→Cardo)
- `src/idml-parser.js` refundado como camada de compatibilidade com cache automático do JSON
- Novo comando CLI: `node robo-render.js extract-idml`
- `theme-generator.js` corrigido: H1 com `align(center)` + `leading:24pt` + `pagebreak(weak: true)`, H2 com `leading:14pt` via `resolved`

**Outra questão levantada pelo Zander:** além do CJK, há outros scripts (cirílico, árabe RTL, devanagari, matemático) que precisam de tratamento. Registrado no backlog como item multi-script (font stack por `book.yaml`).

**Resultado:** render em 1.0s, zero warnings, theme.typ fiel ao InDesign ✅

**Commits:** `12a5d1e` (Sprint 2) · `28ab673` (Sprint 3 extractor) · `16e76ef` (theme fix)

---

_[Log em andamento. Cada sessão de trabalho deve ser documentada aqui antes do /eod.]_
