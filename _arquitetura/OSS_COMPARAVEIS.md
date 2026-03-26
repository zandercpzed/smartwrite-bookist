# Pesquisa: Sistemas OSS Comparáveis ao Smartwrite Bookist

> Objetivo: Antes de começar a construir, entender o que já existe.
> Critério de avaliação: portabilidade, suporte print-ready (CMYK, marcas de corte), notas de rodapé, CJK, extensibilidade.

---

## 1. Vivliostyle
**Repo:** https://github.com/vivliostyle  
**Stack:** JavaScript / TypeScript (Node.js)  
**Licença:** MIT / AGPL

**O que faz:** Typesetting engine baseado em CSS Paged Media. O mais próximo do que estamos construindo em filosofia. Inclui:
- `vivliostyle-cli`: Markdown → PDF via CSS Paged Media (usa Chrome headless internamente).
- `VFM` (Vivliostyle Flavored Markdown): extensão de Markdown otimizada para livros.
- `Vivliostyle Pub`: editor online em alpha (roda no browser com WASM).
- Suporte a temas via CSS.
- Output: PDF print-ready + EPUB.

**Pontos fortes vs. nosso projeto:**
- Filosofia idêntica: CSS como camada de estilo, Markdown como fonte textual.
- Portável: roda local (CLI) e online (browser/WASM).
- Comunidade ativa, focada em publicação japonesa (CJK forte).

**Pontos fracos:**
- Notas de rodapé: depende de CSS `float: footnote` (Paged Media Spec) — comportamento ainda não 100% estável em todos os engines de browser.
- CMYK: não suporta nativamente — exporta RGB via Chrome. Pós-processamento necessário.
- Não resolve o problema do "Sugador IDML".

**Relação com o Bookist:** Vivliostyle é um **concorrente direto e referência de arquitetura**. Devemos estudar seu pipeline de CSS e sua estrutura de temas como inspiração.

---

## 2. Pandoc
**Repo:** https://github.com/jgm/pandoc  
**Stack:** Haskell  
**Licença:** GPL

**O que faz:** Conversor universal de formatos de documento. A "navalha suíça" da publicação.
- Markdown → HTML, PDF (via LaTeX/XeLaTeX), EPUB3, DOCX, etc.
- Suporta templates Lua para customização de output.
- Lua filters para pós-processamento do AST.
- Excelente suporte a footnotes, CJK (via XeLaTeX), matemática.

**Pontos fortes:**
- Extremamente maduro e confiável.
- EPUB3 nativo de alta qualidade.
- PDF via LaTeX: qualidade tipográfica profissional, CMYK, footnotes perfeitas.
- Portável: single binary, multiplataforma.

**Pontos fracos:**
- Não lê IDML (irrelevante como engine de renderização, mas não resolve o "Sugador").
- PDF via LaTeX exige instalação do LaTeX (TeX Live ~4GB) — pesado para deploy online.
- Customização de layout visual é via template LaTeX — curva de aprendizado alta.

**Relação com o Bookist:** Pandoc é candidato forte para **geração de EPUB3**. Para PDF pode ser usado como fallback ou alternativa ao engine principal.

---

## 3. Typst
**Repo:** https://github.com/typst/typst  
**Stack:** Rust  
**Licença:** Apache 2.0

**O que faz:** Sistema de typesetting moderno, sucessor espiritual do LaTeX.
- Sintaxe própria (`.typ`), não Markdown.
- Compila para PDF de alta qualidade com suporte nativo a CMYK.
- Notas de rodapé perfeitas (elemento de primeira classe).
- CJK excelente.
- Compila para WASM: pode rodar no browser.
- Incremental compilation: muito rápido.

**Pontos fortes:**
- **Raw power**: escrito em Rust, binário único, sub-segundo por documento.
- **Portável**: roda local, em container, ou como WASM no browser.
- CMYK nativo.
- Footnotes = cidadão de primeira classe.

**Pontos fracos:**
- Markdown não é o formato nativo — precisaria de uma camada de conversão Markdown → Typst.
- EPUB: ainda experimental / workaround. Não é output nativo.
- Ecossistema de temas ainda jovem (mas crescendo).
- A "ponte" entre IDML e Typst seria via um `theme.typ` gerado programaticamente.

**Relação com o Bookist:** Typst é o candidato mais forte para **engine de renderização PDF**. A camada de conversão Markdown → Typst pode ser nossa "contribuição original" como sistema.

---

## 4. Quarto
**Repo:** https://github.com/quarto-dev/quarto-cli  
**Stack:** TypeScript + Lua (Deno runtime)  
**Licença:** MIT

**O que faz:** Sistema de publicação científica/técnica multi-output.
- `.qmd` (Quarto Markdown) como fonte.
- Output: HTML, PDF, EPUB, Slides, Dashboards.
- Sistema de extensões robusto (Lua filters).
- Usado por O'Reilly, Posit (ex-RStudio), comunidade científica.

**Pontos fortes:**
- Arquitetura de plugins madura — bom modelo de referência.
- Multi-output de uma fonte única.
- Portável (roda local e em CI/CD).

**Pontos fracos:**
- Foco em documentação técnica/científica. Não foi projetado para livros literários/editoriais.
- PDF ainda via LaTeX/Typst como backend.
- Não tem conceito de "importar visual de IDML".

**Relação com o Bookist:** Quarto é uma **referência de arquitetura de extensibilidade**. O modelo de plugins Lua + o conceito de "source único, múltiplos outputs" são princípios que devemos adotar.

---

## 5. Crowbook
**Repo:** https://github.com/lise-henry/crowbook  
**Stack:** Rust  
**Licença:** LGPL

**O que faz:** Converte Markdown (escritos para ficção/romance) em HTML, PDF (via LaTeX) e EPUB.
- Foco explícito em narrativa literária, não técnica.
- Configuração via arquivo `.book`.

**Pontos fortes:**
- Mais próximo do caso de uso literário/editorial.
- Rust: rápido.

**Pontos fracos:**
- Projeto com pouca atividade recente (potencialmente dormindo).
- PDF via LaTeX — mesmas limitações de instalação.
- Sem suporte a IDML.

**Relação com o Bookist:** Referência de **caso de uso literário**. Seu modelo de arquivo `.book` (metadados + lista de arquivos Markdown) é similar ao que teremos no `frontmatter` dos volumes.

---

## 6. Gotenberg
**Repo:** https://github.com/gotenberg/gotenberg  
**Stack:** Go  
**Licença:** MIT

**O que faz:** API Docker para geração de PDF via Chrome headless.
- Recebe HTML/Markdown via HTTP, devolve PDF.
- Totalmente stateless, orientado a microserviço.

**Pontos fortes:**
- **Portabilidade online**: perfeito para deploy serverless.
- API REST limpa.
- Qualquer linguagem pode consumi-lo.

**Pontos fracos:**
- Não resolve o problema editorial (não entende IDML, estilos, etc).
- Como engine, ainda tem as limitações do Chrome: RGB, sem CMYK.

**Relação com o Bookist:** Gotenberg é um modelo de **arquitetura de serviço** que o Bookist poderia adotar como modo de operação online — recebendo o HTML processado e devolvendo o PDF.

---

## Matriz de Decisão

| Critério | Vivliostyle | Pandoc | Typst | Quarto | Crowbook | Gotenberg |
|---|---|---|---|---|---|---|
| Portátil (local + online) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDF Print-ready | ✅ | ✅ | ✅ | ✅ | via LaTeX | via Chrome |
| CMYK nativo | ❌ | via LaTeX | ✅ | via LaTeX | via LaTeX | ❌ |
| Notas de rodapé | ⚠️ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| CJK | ✅ | ✅ | ✅ | ✅ | ⚠️ | depends |
| EPUB3 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Lê IDML | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Arquitetura extensível | ⚠️ | ✅ Lua | ⚠️ | ✅ Lua | ❌ | REST API |
| Raw Performance | Médio | Médio | ⚡ Rust | Médio | ⚡ Rust | Go |

**Conclusão:** Nenhum sistema existente resolve o problema completo (IDML → CSS/tema → MD → render). O Bookist tem uma contribuição original clara: **a camada de tradução visual IDML → tema de renderização**. Para o rendering em si, a combinação **Typst (PDF) + Pandoc (EPUB)** aparece como a mais robusta. A arquitetura de serviço do **Gotenberg** é um modelo de referência para o modo online.
