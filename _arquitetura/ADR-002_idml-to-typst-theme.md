# ADR-002: Estratégia de Extração IDML → Tema de Renderização

**Status:** APROVADO ✅
**Data:** 2026-03-26
**Decisores:** Zander + Agente
**Depende de:** ADR-001 (stack: Node.js + Typst)

---

## Contexto

O design visual do livro vive exclusivamente no arquivo `.idml` criado pelo Diretor de Arte no InDesign. O Bookist precisa extrair esse DNA visual e traduzi-lo para o formato de tema do Typst (`.typ`), sem que nenhuma regra tipográfica seja definida manualmente em código.

O `.idml` é um arquivo ZIP contendo XMLs. A fonte de verdade tipográfica está em `Resources/Styles.xml`.

---

## Decisão

**Estratégia de extração em 3 etapas, implementada em Node.js:**

### Etapa 1 — Descompressão e Parse do XML

- Usar `unzipper` (Node.js) para abrir o `.idml` como ZIP
- Usar `xml2js` para parsear `Resources/Styles.xml` em objeto JavaScript
- Extrair `ParagraphStyle` e `CharacterStyle` como arrays mapeados

### Etapa 2 — Normalização dos Valores

Converter as unidades Adobe para unidades Typst:

| Campo IDML | Atributo XML | Saída Typst | Conversão |
|---|---|---|---|
| Tamanho de fonte | `PointSize` | `font-size: Xpt` | direto (pt) |
| Entrelinha | `Leading` | `par(leading: Xpt)` | direto (pt) |
| Espaço antes | `SpaceBefore` | `par(above: Xem)` | pt → em (÷ font-size) |
| Espaço depois | `SpaceAfter` | `par(below: Xem)` | pt → em |
| Recuo esquerdo | `LeftIndent` | `par(indent: Xem)` | pt → em |
| Recuo primeira linha | `FirstLineIndent` | via set rule | pt → em |
| Alinhamento | `Justification` | `text(align: ...)` | `FullyJustified` → `justify` |
| Margem | `PageTopMargin` etc | `page(margin: ...)` | pt → cm |
| Tamanho de página | `PageWidth/Height` | `page(width/height: ...)` | pt → cm |

### Etapa 3 — Geração do Arquivo de Tema Typst

- Gerar `output/theme.typ` com as regras `set` e `show` do Typst
- O tema é **gerado programaticamente** — nunca editado à mão
- Um mapeamento semântico (style name → elemento Typst) é aplicado:

| Nome do Estilo (IDML) | Elemento Typst |
|---|---|
| `Body Text` / `Corpo` | `set par(...)` global |
| `Heading 1` | `show heading.where(level: 1): ...` |
| `Heading 2` | `show heading.where(level: 2): ...` |
| `Footnote Text` | `set footnote(...)` |
| `Block Quote` | `show quote: ...` |

> ⚠️ Os nomes exatos dos estilos no IDML do DA devem ser mapeados na primeira execução com o script de dump da skill `idml-reader`.

---

## Consequências

**Positivas:**
- Zero código CSS/YAML escrito à mão pela DA — o IDML é a única fonte de estilo
- Tema é regenerado automaticamente se o IDML mudar (basta re-rodar o extrator)
- Output é um `.typ` limpo, versionável no Git

**Trade-offs:**
- Mapeamento semântico (nome do estilo → elemento Typst) precisa ser calibrado na Sprint 1 com o IDML real
- Estilos com nomes não convencionais ou em português exigirão mapeamento manual na primeira vez

**Pendências:**
- [ ] Sprint 1: rodar dump do `template miolo.idml` e mapear os nomes reais dos estilos
- [ ] Sprint 1: validar que as unidades convertidas (pt → em/cm) produzem resultado visual correto
