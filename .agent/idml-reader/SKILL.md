---
name: IDML Reader
description: Guia para interpretar a estrutura XML de arquivos .idml do InDesign e mapear estilos para CSS/tema
---

# Skill: IDML Reader

## O que é um .idml

Um arquivo `.idml` é um **ZIP** contendo XMLs que descrevem o documento InDesign.
Para inspecioná-lo, basta descompactar:

```bash
unzip "template miolo.idml" -d idml_extracted/
```

---

## Estrutura Relevante para o Bookist

```
idml_extracted/
├── Resources/
│   └── Styles.xml        ← ⭐ PRINCIPAL: hierarquia tipográfica completa
├── Spreads/
│   └── Spread_*.xml      ← layout das páginas (não usamos no pipeline)
├── Stories/
│   └── Story_*.xml       ← texto real (não usamos — nossa fonte é o .md)
└── MasterSpreads/
    └── MasterSpread_*.xml ← páginas master (margins, headers, footers)
```

---

## Mapeamento de Tags: IDML → CSS

| Tag IDML (Styles.xml) | Atributo | Equivalente CSS |
|---|---|---|
| `ParagraphStyle` | `PointSize` | `font-size` (pt → px: ×1.333) |
| `ParagraphStyle` | `Leading` | `line-height` |
| `ParagraphStyle` | `SpaceBefore` | `margin-top` |
| `ParagraphStyle` | `SpaceAfter` | `margin-bottom` |
| `ParagraphStyle` | `LeftIndent` | `padding-left` |
| `ParagraphStyle` | `FirstLineIndent` | `text-indent` |
| `ParagraphStyle` | `Justification` | `text-align` (`LeftAlign`→`left`, `FullyJustified`→`justify`) |
| `CharacterStyle` | `FontStyle` | `font-weight` / `font-style` |
| `CharacterStyle` | `PointSize` | `font-size` |
| `DocumentPreference` | `PageWidth` / `PageHeight` | `@page { size: Xcm Ycm }` |
| `DocumentPreference` | `PageTopMargin` etc. | `@page { margin: ... }` |

---

## Mapeamento Semântico: Nome do Estilo → HTML Tag

Os nomes dos estilos no IDML da Z•Edições seguem convenção InDesign. O agente deve mapear para a semântica HTML correta:

| Nome do Estilo no IDML | Tag HTML | Observação |
|---|---|---|
| `Heading 1` / `H1` / `Título` | `h1` | Um por arquivo |
| `Heading 2` / `H2` / `Subtítulo` | `h2` | |
| `Body Text` / `Corpo` / `$ID/NormalParagraphStyle` | `p` | Estilo mais comum |
| `Footnote Text` | `.footnote` / `<aside>` | Verificar suporte no engine |
| `Block Quote` / `Citação` | `blockquote` | |
| `Caption` / `Legenda` | `figcaption` | |

> ⚠️ **Os nomes exatos dependem do arquivo `.idml` do DA.** Sempre faça dump dos nomes reais antes de montar a tabela definitiva.

---

## Como fazer dump dos estilos

```bash
# Extrair e listar todos os ParagraphStyles pelo atributo Name
python3 -c "
import zipfile, xml.etree.ElementTree as ET
with zipfile.ZipFile('_templates/template miolo.idml') as z:
    with z.open('Resources/Styles.xml') as f:
        tree = ET.parse(f)
        for el in tree.iter():
            if 'Style' in el.tag:
                name = el.get('Name', '')
                if name: print(el.tag, '|', name)
"
```

---

## Regras

1. **Nunca assuma os nomes dos estilos** — sempre faça o dump acima antes de iniciar a extração.
2. **Preserve as unidades do InDesign** — converta pontos (pt) para unidades CSS explicitamente.
3. **Fontes:** Se a fonte declarada no IDML não existir localmente, registre no log e aplique o fallback definido (`font-family: "Minion Pro", "Songti SC", serif`).
