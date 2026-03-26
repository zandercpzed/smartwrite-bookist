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

_[Log em andamento. Cada sessão de trabalho deve ser documentada aqui antes do /eod.]_
