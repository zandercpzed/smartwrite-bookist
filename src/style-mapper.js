/**
 * SCRIPT: style-mapper.js
 * DESCRIÇÃO: Normaliza os valores extraídos do IDML e aplica mapeamento semântico
 *            (nome do estilo → elemento Typst). Converte unidades Adobe → Typst.
 * CHAMADO POR: theme-generator.js
 * CONTRATO:
 *   - INPUT: { paragraphStyles: [...], characterStyles: [...], pageGeometry: {...} }
 *   - OUTPUT: { mappedStyles: [...], page: {...} }
 */

// ---------------------------------------------------------------------------
// Conversões de Unidades (ADR-002)
// ---------------------------------------------------------------------------

/** Converte pontos (pt) para centímetros (cm), arredondado a 4 casas. */
const ptToCm = (pt) => (pt != null ? Math.round((pt / 28.3465) * 10000) / 10000 : null);

/** Converte pontos (pt) para em, baseado no tamanho de corpo do estilo. */
const ptToEm = (pt, baseFontSizePt) =>
  pt != null && baseFontSizePt ? Math.round((pt / baseFontSizePt) * 1000) / 1000 : null;

/** Converte alinhamento Adobe → { align: string, justify: bool } */
const mapJustification = (value) => {
  const map = {
    LeftAlign: 'left',
    LeftJustified: 'left',
    RightAlign: 'right',
    CenterAlign: 'center',
    FullyJustified: 'justify',
    ToBindingSide: 'start',
    AwayFromBindingSide: 'end',
  };
  return map[value] || null;
};

// ---------------------------------------------------------------------------
// Mapeamento Semântico: Nome do Estilo → Papel no Typst
// (ADR-002, Tabela de Mapeamento)
// Nomes em inglês e português são cobertos para flexibilidade.
// ---------------------------------------------------------------------------
const SEMANTIC_MAP = [
  // Nomes reais do template miolo.idml (dump 2026-03-26)
  // Formato: "Grupo:Subgrupo:Nome" — testamos com endsWith para flexibilidade
  { pattern: /body text$/i, role: 'body' },
  { pattern: /structural styles:heading 1$/i, role: 'heading1' },
  { pattern: /structural styles:heading 2$/i, role: 'heading2' },
  { pattern: /structural styles:heading 3$/i, role: 'heading3' },
  { pattern: /structural styles:title$/i, role: 'title' },
  { pattern: /structural styles:subtitle$/i, role: 'subtitle' },
  { pattern: /estilos de documento:footnotes$/i, role: 'footnote' },
  { pattern: /body text:citation$/i, role: 'blockquote' },
  { pattern: /estilos de documento:caption$/i, role: 'caption' },
  { pattern: /estilos de documento:page header$/i, role: 'pageHeader' },
  { pattern: /body text:epigraph and dedication$/i, role: 'epigraph' },
  // Fallbacks genéricos (caso o DA renomeie estilos)
  { pattern: /^(body|corpo|body text|texto corrido|normal)$/i, role: 'body' },
  { pattern: /^(heading 1|cabeçalho 1|título 1|h1)$/i, role: 'heading1' },
  { pattern: /^(heading 2|cabeçalho 2|título 2|h2)$/i, role: 'heading2' },
  { pattern: /^(heading 3|cabeçalho 3|título 3|h3)$/i, role: 'heading3' },
  { pattern: /^(footnote text|texto de rodapé|nota de rodapé)$/i, role: 'footnote' },
  { pattern: /^(block quote|citação|quote)$/i, role: 'blockquote' },
  { pattern: /^(caption|legenda)$/i, role: 'caption' },
  { pattern: /^(header|cabeçalho de página|running head)$/i, role: 'pageHeader' },
];

/**
 * Resolve o papel semântico de um estilo pelo nome.
 * @param {string} name
 * @returns {string|null}
 */
function resolveRole(name) {
  for (const entry of SEMANTIC_MAP) {
    if (entry.pattern.test(name)) return entry.role;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Função principal
// ---------------------------------------------------------------------------

/**
 * Normaliza e mapeia os estilos extraídos pelo idml-parser.
 * @param {{ paragraphStyles: object[], characterStyles: object[], pageGeometry: object }} parsed
 * @returns {{ mappedStyles: object[], unmappedStyles: string[], page: object }}
 */
export function mapStyles(parsed) {
  const { paragraphStyles, characterStyles, pageGeometry } = parsed;

  // Resolve o font-size do estilo "body" como base para conversão de em
  const bodyStyle = paragraphStyles.find((s) => resolveRole(s.name) === 'body');
  const bodyFontSizePt = bodyStyle?.pointSize || 11; // fallback 11pt

  const mappedStyles = [];
  const unmappedStyles = [];

  for (const style of paragraphStyles) {
    const role = resolveRole(style.name);
    const fontSizePt = style.pointSize || bodyFontSizePt;

    const mapped = {
      name: style.name,
      role,
      raw: style,
      typst: {
        fontSize: style.pointSize != null ? `${style.pointSize}pt` : null,
        leading: style.leading != null ? `${style.leading}pt` : null,
        above:
          style.spaceBefore != null
            ? `${ptToEm(style.spaceBefore, fontSizePt)}em`
            : null,
        below:
          style.spaceAfter != null
            ? `${ptToEm(style.spaceAfter, fontSizePt)}em`
            : null,
        indent:
          style.leftIndent != null
            ? `${ptToEm(style.leftIndent, fontSizePt)}em`
            : null,
        firstLineIndent:
          style.firstLineIndent != null
            ? `${ptToEm(style.firstLineIndent, fontSizePt)}em`
            : null,
        align: mapJustification(style.justification),
        fontFamily: style.fontFamily,
        fontStyle: style.fontStyle,
        // Capitalização: SmallCaps / AllCaps — do IDML (via resolved ou direto)
        capitalization: style.capitalization || style.resolved?.capitalization || null,
        // Tracking em 1/1000 de em (IDML) → convertido para Typst em (tracking/1000em)
        tracking: style.tracking != null ? style.tracking
                  : (style.resolved?.tracking != null ? style.resolved.tracking : null),

        // Page break e Keep Options
        pageBreakBefore: style.pageBreakBefore ?? null,
        keepLinesTogether: style.keepLinesTogether ?? false,
        keepAllLinesTogether: style.keepAllLinesTogether ?? false,
        keepWithNext: style.keepWithNext ?? 0,
        keepFirstLines: style.keepFirstLines ?? 2,
        keepLastLines: style.keepLastLines ?? 2,
      },
    };

    mappedStyles.push(mapped);

    if (!role) unmappedStyles.push(style.name);
  }

  // Geometria de página → Typst
  const page = {
    width: pageGeometry.pageWidth != null ? `${ptToCm(pageGeometry.pageWidth)}cm` : '14cm',
    height: pageGeometry.pageHeight != null ? `${ptToCm(pageGeometry.pageHeight)}cm` : '21cm',
    marginTop:
      pageGeometry.marginTop != null ? `${ptToCm(pageGeometry.marginTop)}cm` : '2cm',
    marginBottom:
      pageGeometry.marginBottom != null ? `${ptToCm(pageGeometry.marginBottom)}cm` : '2cm',
    marginLeft:
      pageGeometry.marginLeft != null ? `${ptToCm(pageGeometry.marginLeft)}cm` : '2.5cm',
    marginRight:
      pageGeometry.marginRight != null ? `${ptToCm(pageGeometry.marginRight)}cm` : '2cm',
  };

  if (unmappedStyles.length > 0) {
    console.warn(
      `⚠️ style-mapper: ${unmappedStyles.length} estilos sem mapeamento semântico:\n  ${unmappedStyles.join('\n  ')}`
    );
    console.warn(
      '   → Estes estilos serão incluídos no dump mas não gerarão regras Typst automaticamente.'
    );
  }

  return { mappedStyles, unmappedStyles, page };
}
