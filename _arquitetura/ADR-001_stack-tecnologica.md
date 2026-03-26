# ADR-001: Stack Tecnológica do Bookist

**Status:** APROVADO ✅
**Data:** 2026-03-26
**Decisores:** Zander + Agente

---

## Referências de Mercado

| Projeto | Formato Fonte | Engine PDF | Engine EPUB | Runtime | Obs. |
|---|---|---|---|---|---|
| **pythonfluente2e** (O'Reilly, Luciano Ramalho) | AsciiDoc | Atlas (proprietário O'Reilly) | `asciidoctor-epub3` (Ruby) | Docker ruby:latest ~990MB | PDF fechado; EPUB open source |
| **Quarto** (Posit/RStudio) | Markdown/Quarto MD | LaTeX ou Typst | Pandoc | Node + R/Python | Multi-output |
| **mdBook** (Rust) | Markdown | Impressão via browser | N/A | Rust binary ~5MB | Só web |

> 💡 **Insight do pythonfluente2e:** `asciidoctor-epub3` é usado por O'Reilly em produção real — referência de qualidade para EPUB. Porém, o container Ruby oficial pesa **990MB** — inviável para serverless. O PDF do pipeline O'Reilly é gerado pelo Atlas proprietário, sem alternativa open source equivalente em qualidade.

---

## Contexto

Precisamos escolher a linguagem do orquestrador e o engine de renderização PDF/EPUB. Esta é a decisão mais impactante do projeto — difícil de reverter após código escrito.

**Requisitos obrigatórios:**
- Portável: CLI local, Docker, API REST e **serverless (GCloud/Firebase)**
- Raw power: processar 100 volumes sem gargalo
- Footnotes no rodapé da página (não endnotes)
- CJK (Pinyin, Hanzi) sem degradação
- CMYK direto ou pós-processamento aceitável
- EPUB3 válido

**Restrição crítica de ambiente (GCloud/Firebase):**

> O robô será integrável a webservices e hospedável em Cloud Run ou Firebase Functions. Isso impõe restrições severas sobre o que pode rodar num container:

| Recurso | Cloud Run / Firebase | Impacto |
|---|---|---|
| Chrome headless | ❌ ~1.5GB de imagem, cold-start >5s | Inviável para serverless |
| Ruby runtime | ❌ +500MB, gem ecosystem | Container pesado |
| Node.js | ✅ imagem base leve, suporte nativo | Ideal para orquestrador |
| Typst binário | ✅ ~30MB, zero dependências | Ideal para engine |
| Pandoc binário | ✅ ~100MB | Aceitável |
| TeX Live | ❌ ~4GB | Inviável |

---

## Alternativas Consideradas

### Opção A — Node.js + Typst + Pandoc ⭐ *recomendada*

| Critério | Avaliação |
|---|---|
| Orquestrador | Node.js / TypeScript |
| Engine PDF | Typst CLI (Rust, ~30MB) |
| Engine EPUB | Pandoc (~100MB) |
| Footnotes | ✅ nativo no Typst |
| CJK | ✅ excelente |
| CMYK | ✅ nativo |
| Container | ✅ leve — Node + 2 binários |
| GCloud/Firebase | ✅ Cloud Run sem fricção |
| Velocidade | ⚡ sub-segundo por livro |
| WASM futuro | ✅ Typst compila para WASM (online sem servidor) |

**Contras:** Markdown não é nativo no Typst — precisamos de conversão `md → .typ`. Esta é nossa contribuição original e diferencial do projeto.

---

### Opção B — Node.js + Paged.js (Chrome headless) + Pandoc

| Critério | Avaliação |
|---|---|
| Footnotes | ✅ via CSS `float: footnote` |
| CMYK | ❌ RGB — pós-proc com Ghostscript |
| Container | ❌ Chrome headless ~1.5GB |
| GCloud/Firebase | ❌ cold-start inviável, custo alto |
| Velocidade | 🐢 Chrome por livro |

**Veredicto:** Descartado pelo peso do container e inviabilidade em serverless.

---

### Opção C — Node.js + Pandoc → LaTeX → PDF

| Critério | Avaliação |
|---|---|
| Footnotes | ✅ perfeito |
| CMYK | ✅ |
| Container | ❌ TeX Live ~4GB |
| GCloud/Firebase | ❌ imagem inaceitável |

**Veredicto:** Descartado. TeX Live impossibilita qualquer deploy em container leve.

---

### Opção D — Asciidoctor (análise revisada)

**Importante:** A limitação de footnotes não é da *linguagem* AsciiDoc, mas do *engine de renderização PDF*.

**D1 — asciidoctor-pdf via Prawn (Ruby):**
- Footnotes: ❌ converte para endnotes — limitação arquitetural da lib Prawn, sem previsão de correção
- Container: ❌ Ruby + gems pesados
- **Veredicto: descartado.**

**D2 — asciidoctor-web-pdf (Chrome/CSS Paged Media):**
- Footnotes: ✅ suporte correto via `float: footnote`
- CMYK: ❌ Chrome só exporta RGB
- Container: ❌ Ruby + Chrome + gems = imagem >2GB
- GCloud/Firebase: ❌ inviável
- **Veredicto: descartado pelo peso em container e CMYK ausente.**

**D3 — AsciiDoc como formato intermediário (Markdown → AsciiDoc → Typst/outro):**
- Fundamento: AsciiDoc é semanticamente mais rico que Markdown para livros (epígrafes, colofão, notas editoriais, cross-references nativos)
- Contras: cadeia de conversão adicional (Markdown → AsciiDoc via Pandoc/Kramdoc é imprecisa nas bordas); eleva complexidade sem ganho claro frente à conversão direta Markdown → Typst
- **Veredicto: tecnicamente possível, mas não justificado nesta fase. Pode ser reavaliado se o projeto migrar texto fonte para AsciiDoc.**

---

## Decisão

> **[Aguardando decisão do Zander]**
>
> Recomendação do agente: **Opção A** — Node.js como orquestrador + Typst como engine PDF + Pandoc para EPUB. Única opção que atende todos os requisitos incluindo GCloud/Firebase com container leve.

---

## Consequências (após aprovação da Opção A)

**Positivas:**
- Container leve (~200MB total) — deployável em Cloud Run, Firebase Functions e outras plataformas serverless
- Typst garante footnotes, CJK e CMYK nativos desde a PoC
- Node.js permite API REST e integração com SADE ou outros sistemas
- Caminho para WASM aberto (Typst já compila para WASM)

**Trade-offs:**
- Camada `md → .typ` precisa ser desenvolvida (nossa contribuição original)
- Curva de aprendizado da sintaxe de templates Typst

**Pendências:**
- [ ] Zander escolhe a opção
- [ ] Após aprovação: redigir ADR-002 (estratégia IDML → tema) e ADR-003 (pipeline Markdown)
- [ ] Após aprovação: inicializar repositório GitHub com estrutura da stack
