# PRD: Smartwrite Bookist — Robô de Diagramação Headless (Z•Edições)

> **Versão:** 0.2 — 2026-03-26  
> **Status:** Em Definição  
> **Repositório:** https://github.com/zandercpzed/smartwrite-bookist

---

## 1. Visão do Produto

O **Smartwrite Bookist** é um motor de geração de miolos de livro (PDF Print-ready e EPUB3) totalmente automatizado, portátil e extensível.

Ele resolve o gargalo de escala da Adobe: permite que o design visual (o "Esqueleto" da página — paleta de estilos, margens, fontes) continue sendo criado _exclusivamente_ no InDesign (exportado em `.idml`), enquanto a **renderização final** é executada por um motor leve e headless, ingerindo textos em Markdown previamente revisados e aprovados.

O motor é projetado para ser **n-aplicável**: outros sistemas (online ou locais) podem consumir o Bookist como biblioteca ou serviço, não apenas a Z•Edições.

---

## 2. É / Não É

| É | Não É |
|---|---|
| Um **motor de renderização** headless (CLI e/ou API) | Um editor de texto ou processador de palavras |
| Uma **ponte** entre o design do InDesign e o output digital | Um substituto do InDesign para criação de layout |
| Uma ferramenta para **automação em lote** de volumes | Uma ferramenta de criação interativa (GUI) |
| Um sistema **portátil** (local, Docker, serverless) | Um SaaS com interface web própria (não nesta fase) |
| Uma **biblioteca extensível** (n-aplicável) | Uma ferramenta para um único cliente ou projeto |
| O **orquestrador** do pipeline editorial técnico | Um sistema de gestão de conteúdo (CMS) |

---

## 3. Faz / Não Faz

### ✅ O Bookist FAZ:
- Extrair hierarquia tipográfica e espacial de um arquivo `.idml` (tamanho de corpo, entrelinha, margens, famílias de fontes).
- Traduzir esse DNA visual em um tema de renderização (CSS, YAML de tema Typst, ou similar).
- Ingerir múltiplos arquivos `.md` e compilá-los em um documento estruturado único.
- Renderizar um **PDF print-ready** com: tamanho 14x21cm, margens espelhadas (recto/verso), marcas de corte, sangria, CMYK, notas de rodapé no rodapé da página.
- Renderizar um **EPUB3 válido** a partir da mesma fonte textual.
- Executar o pipeline via **linha de comando** (`bookist render --vol 01`).
- Expor o pipeline como **API/serviço** para integração com outros sistemas.
- Processar **múltiplos volumes em lote**.
- Lidar com caracteres **CJK** (Chinês, Japonês, Coreano — incluindo Pinyin tonal).
- Injetar metadados editoriais (folha de rosto, sumário com âncoras, colofão) a partir de um arquivo de frontmatter.

### ❌ O Bookist NÃO FAZ:
- Criar ou modificar capas (são geradas e acopladas manualmente no InDesign).
- Definir ou alterar estilos de design diretamente no código (isso é papel exclusivo do Diretor de Arte no InDesign).
- Editar o texto final (o `.md` é sempre a fonte de verdade — nunca será alterado pelo motor).
- Gerar arquivos `.idml` ou abrir o InDesign.
- Gerenciar upload/publicação para distribuidoras (KDP, Kobo, etc.) — isso é escopo de outro sistema.
- Suportar formatos de texto de entrada além de Markdown (ex: `.docx`, `.odt`) — nesta fase.
- Garantir conformidade com requisitos especiais de gráficas específicas além do padrão definido.

---

## 4. Entradas e Saídas

### Entradas (Inputs)

| # | Entrada | Formato | Obrigatório? | Limite |
|---|---|---|---|---|
| 1 | Template visual do volume | `.idml` (ZIP/XML) | ✅ Sim | 1 arquivo por coleção |
| 2 | Texto editorial por seção | `.md` (Markdown) | ✅ Sim | N arquivos por volume |
| 3 | Frontmatter do volume | `book.yaml` ou cabeçalho YAML | ✅ Sim | 1 por volume (título, autor, ISBN, etc.) |
| 4 | Imagens internas | `.jpg`, `.png`, `.svg` | ❌ Opcional | Resolução mínima 300dpi para print |
| 5 | Fontes customizadas | `.otf`, `.ttf` | ❌ Opcional | Devem estar instaladas localmente ou embutidas |

### Saídas (Outputs)

| # | Saída | Formato | Descrição |
|---|---|---|---|
| 1 | Miolo print-ready | `.pdf` | 14x21cm, CMYK, marcas de corte, sangria |
| 2 | E-book | `.epub` (EPUB3) | Válido pelo epubcheck, acessível |
| 3 | Tema extraído | `.css` ou `.typ` | Arquivo intermediário reutilizável |
| 4 | Log de execução | `.log` ou stdout | Fontes usadas, warnings, tempo de execução |

### O que NÃO será gerado:
- Capa (arquivo separado, fora do escopo).
- PDF para distribuição digital (somente print-ready nesta versão).
- Arquivo `.idml` modificado.
- DOCX, RTF, ou formatos de processador de texto.

---

## 5. Arquitetura Fundamental

```
[ INPUT VISUAL ]     [ INPUT TEXTUAL ]
 template.idml        secao-01.md ...
      │                     │
      ▼                     ▼
 [IDML Parser]      [Markdown Compiler]
 extrai estilos      estrutura o texto
      │                     │
      └──────────┬───────────┘
                 ▼
         [Orquestrador CLI/API]
                 │
         ┌───────┴────────┐
         ▼                ▼
   [Engine PDF]     [Engine EPUB]
   (headless)       (Pandoc/...)
         │                │
         ▼                ▼
   miolo.pdf         livro.epub
```

1. **INPUT VISUAL:** Extrai hierarquia tipográfica do `.idml`.
2. **TRADUTOR:** Converte DNA visual Adobe → tema do engine de renderização.
3. **INPUT TEXTUAL:** Ingere arquivos `.md` e os estrutura semanticamente.
4. **MOTOR HEADLESS:** Combina tema + texto sem abrir interface gráfica.
5. **OUTPUT:** PDF Print-ready + EPUB3.

---

## 6. Portabilidade e Modos de Execução

O Bookist deve funcionar em **todos os seguintes contextos** sem modificação de código:

| Modo | Como | Uso |
|---|---|---|
| **Local CLI** | `bookist render --vol 01` | Uso diário na máquina do DA/editor |
| **Docker** | `docker run bookist render ...` | Ambientes controlados, CI/CD |
| **API REST** | `POST /render` com multipart | Integração com SADE ou outros sistemas |
| **Serverless** | Cloud Run, Vercel Functions | Execução sob demanda online |

---

## 7. Restrições e Pontos Pacíficos

- **Nenhum** estilo, medida, margem ou escolha tipográfica será definida escrevendo código CSS/YAML na mão. A única caneta do Diretor de Arte é o InDesign (exportado para IDML).
- **Nenhuma** edição de texto final acontecerá dentro do IDML ou InDesign. O _source of truth_ editorial é sempre e unicamente o arquivo `.md`.
- Capas **não** fazem parte do pipeline automatizado (são geradas no InDesign e acopladas pela gráfica).
- O motor **não** roda dentro do InDesign nem depende de plugins Adobe.

---

## 8. Métricas de Sucesso

| Métrica | Meta Sprint 1 (PoC) | Meta Longo Prazo |
|---|---|---|
| Tempo de renderização por volume | < 60s | < 10s |
| Caracteres CJK perdidos ou ilegíveis | 0 | 0 |
| Notas de rodapé no rodapé (não como endnotes) | ✅ obrigatório | ✅ |
| Conformidade PDF para impressão | PDF/X-3 ou equivalente | PDF/X-4 |
| Volumes processados em lote (100 livros) | — | < 30 min total |
| EPUB válido (epubcheck sem erros críticos) | ✅ obrigatório | ✅ |
| Estilos do IDML mapeados com fidelidade | > 80% dos estilos principais | > 95% |
| Execução sem intervenção manual | 100% | 100% |

---

## 9. Conceitos Futuros (Not Roadmap)

> Estes itens **não são compromisos**. São ideias para não perder de vista.

- **Keyword Database:** Extração de entidades, termos temáticos e referências cruzadas dos textos da coleção. Potencial de construir um índice semântico por obra, autor e tema.
- **Web UI:** Interface visual para o pipeline (monitoramento, preview, status).
- **Marketplace de Temas:** Templates `.idml` pré-configurados reutilizáveis por outras editoras.
