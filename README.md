# smartwrite-bookist

> Motor headless de geração de livros — PDF print-ready + EPUB3 a partir de templates InDesign e texto Markdown.

---

## O que é

O **Smartwrite Bookist** é um motor de renderização editorial _headless_, portátil e extensível.

Ele extrai o DNA visual de um template `.idml` (InDesign), ingere o texto fonte em Markdown, e combina os dois para renderizar volumes editoriais de forma automatizada — sem abrir nenhum software gráfico.

**Desenvolvido por [Z•Edições](https://zedicoes.com.br)**

---

## O que faz

- Lê um template `.idml` do InDesign e extrai hierarquia tipográfica (fontes, tamanhos, espaçamentos, margens)
- Compila arquivos `.md` em um documento Typst estruturado
- Gera **PDF print-ready** (14×21cm, CMYK, notas de rodapé no rodapé, fontes embutidas)
- Gera **EPUB3** válido

## O que não faz

- Não edita o texto editorial (o `.md` é sempre a fonte de verdade)
- Não substitui o InDesign para design de capas
- Não processa PDFs já gerados

---

## Stack

| Camada       | Tecnologia                        |
| ------------ | --------------------------------- |
| Orquestrador | Node.js / TypeScript              |
| Engine PDF   | [Typst](https://typst.app) (Rust) |
| Engine EPUB  | [Pandoc](https://pandoc.org)      |

---

## Portabilidade

O motor roda em 4 modos:

- **CLI local:** `bookist render --vol "01"`
- **Docker:** container ~200MB (Node + Typst + Pandoc)
- **API REST:** `POST /render`
- **Cloud Run / Firebase Functions**

---

## Documentação

| Documento                                                                                      | Conteúdo                            |
| ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| [`_docs/01_PRODUTO.md`](./_docs/01_PRODUTO.md)                                                 | PRD — definição completa do produto |
| [`_docs/02_ROADMAP.md`](./_docs/02_ROADMAP.md)                                                 | Fases de desenvolvimento            |
| [`_docs/03_BACKLOG.md`](./_docs/03_BACKLOG.md)                                                 | Backlog atual                       |
| [`_arquitetura/ADR-001_stack-tecnologica.md`](./_arquitetura/ADR-001_stack-tecnologica.md)     | Decisão de stack                    |
| [`_arquitetura/ADR-002_idml-to-typst-theme.md`](./_arquitetura/ADR-002_idml-to-typst-theme.md) | Estratégia IDML → Typst             |
| [`_arquitetura/ADR-003_markdown-pipeline.md`](./_arquitetura/ADR-003_markdown-pipeline.md)     | Pipeline Markdown                   |

---

## Status

🚧 **Em desenvolvimento** — Sprint 1 (PoC) em andamento.

---

## Licença

[MIT](./LICENSE) © 2026 Z•Edições / Zander Catta Preta
