# Roadmap de Automação Headless

O desenvolvimento está estruturado com foco em Entregas Antecipadas de Valor (Metodologia Ágil), iniciando pelo núcleo de tradução (a mágica tecnológica) antes de integrar grandes volumes.

### Fase 1: Prova de Conceito (PoC) "Engine CSS"
- **Objetivo:** Estabelecer que Paged.js (ou similar) é a base de renderização viável.
- Selecionar um Markdown simples.
- Gerar HTML puro a partir de Markdown (via Pandoc, marked ou markdown-it).
- Adicionar folha CSS com Marcas de Corte de Gráfica, Bleed e tamanho `14x21cm`.
- Testar a velocidade e fluidez de notas de rodapé (`[^1]`).
- **Saída Validação:** PDF simples Print-Ready que atenda exigências de pré-impressão de gráfica rápida moderna.

### Fase 2: O "Sugador IDML" (InDesign to CSS Transformer)
- **Objetivo:** Eliminar o código manual e basear o estilo no trabalho visual do DA.
- Criar script leitor XML do `.idml`.
- Mapear `Resources/Styles.xml` para propriedades de Cascading Style Sheets (ex: `PointSize` -> `font-size`, `SpaceAfter` -> `margin-bottom`).
- Construir a Tabela de Equivalência Semântica (ex: `Structural Styles%3aHeading 1` -> `h1`).
- Sobrescrever a saída de CSS usando diretamente os dados visuais lidos da engine InDesign.

### Fase 3: EPUB Validator & Single Source of Truth
- **Objetivo:** Reaproveitar a mesma árvore de parsing do Markdown para compilar E-book.
- Adaptar o CSS sugador da Fase 2, ajustando propriedades relativas a dispositivos mobile limitados (e-ink readers).
- Gerar fluxo EPUB diretamente via pipeline em JS ou Pandoc (`asciidoctor-epub3`).

### Fase 4: Injector de Coleção Múltipla ("Mass Execution")
- Modificar arquitetura do Robô para rodar recursivamente as pastas da Z•Edições (`FASE I, II, III`).
- Empacotador final: Script roda na pasta `/`, acha cada subpasta, puxa os metadados do README de rosto técnico (Sumário, Folha de Rosto e Colofão automáticos).
- Dump contínuo e logging: `Collection Batch Done - 100 Livros Output em 45segundos. Log: Fontes asiáticas carregadas com sucesso`.
