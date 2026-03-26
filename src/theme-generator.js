/**
 * SCRIPT: theme-generator.js
 * DESCRIÇÃO: Gera o arquivo theme.typ do Typst a partir dos estilos mapeados.
 *            O arquivo gerado é a única fonte de verdade tipográfica para o Typst.
 *            NUNCA editar o theme.typ manualmente — ele é regenerado a cada execução.
 * CHAMADO POR: robo-render.js
 * CONTRATO:
 *   - INPUT: { mappedStyles: [...], page: {...} } (saída do style-mapper.js)
 *   - OUTPUT: grava output/theme.typ (retorna o conteúdo como string)
 */

import fs from 'fs';
import path from 'path';

/**
 * Gera o conteúdo do theme.typ como string.
 * @param {{ mappedStyles: object[], page: object }} mapped
 * @returns {string}
 */
export function generateThemeContent(mapped, meta = null) {
  const { mappedStyles, page } = mapped;
  const lines = [];

  lines.push('// ============================================================');
  lines.push('// theme.typ — Gerado automaticamente pelo Smartwrite Bookist');
  lines.push('// NÃO EDITE ESTE ARQUIVO MANUALMENTE.');
  lines.push('// Fonte de verdade: template miolo.idml');
  lines.push('// ============================================================');
  lines.push('');

  const titleForHeader = (meta && meta.title) ? meta.title.replace(/"/g, '\\"') : '';

  lines.push('');


  // Estilos por role semântico — prioriza o estilo com mais dados (mais campos typst não-nulos)
  const byRole = {};

  /**
   * Conta quantos campos tipográficos relevantes são não-nulos num estilo.
   * Usado para priorizar o estilo "mais completo" quando vários têm o mesmo role.
   */
  function typstScore(style) {
    const t = style.typst;
    return (t.fontSize != null ? 1 : 0)
      + (t.leading != null ? 1 : 0)
      + (t.fontFamily != null ? 1 : 0)
      + (t.firstLineIndent && t.firstLineIndent !== '0em' ? 1 : 0)
      + (t.align != null ? 1 : 0);
  }

  for (const style of mappedStyles) {
    if (!style.role) continue;
    const existing = byRole[style.role];
    if (!existing || typstScore(style) > typstScore(existing)) {
      byRole[style.role] = style;
    }
  }

  // Corpo do texto (set global)
  // IMPORTANTE: body sempre emite as regras se houver dados — independente do align
  if (byRole.body) {
    const s = byRole.body.typst;
    lines.push('// --- Texto Corrido (body) ---');

    // #set text — sempre emite se tiver font ou size
    const textArgs = [];
    if (s.fontFamily) textArgs.push(`font: "${s.fontFamily}"`);
    if (s.fontSize) textArgs.push(`size: ${s.fontSize}`);
    if (textArgs.length) lines.push(`#set text(${textArgs.join(', ')})`);

    // #set par — emite todos os valores relevantes individualmente
    const parArgs = [];
    if (s.leading && s.leading !== '0pt') parArgs.push(`leading: ${s.leading}`);
    if (s.firstLineIndent && s.firstLineIndent !== '0em' && s.firstLineIndent !== 'nullem') {
      parArgs.push(`first-line-indent: (amount: ${s.firstLineIndent}, all: false)`);
    }
    // justify: true para FullyJustified, false para Left (default Typst é false)
    if (s.align === 'justify') parArgs.push(`justify: true`);
    if (parArgs.length) lines.push(`#set par(${parArgs.join(', ')})`);
    lines.push('');
  }

  // Headings
  for (const [role, level] of [['heading1', 1], ['heading2', 2], ['heading3', 3]]) {
    if (byRole[role]) {
      const s = byRole[role].typst;
      const name = byRole[role].name;
      const cleanName = name.split(':').pop() || name;
      lines.push(`// --- ${cleanName} (heading level ${level}) ---`);
      lines.push(`#show heading.where(level: ${level}): it => {`);

      // set text: font, size, SmallCaps, tracking (letter-spacing)
      const textArgs = [];
      if (s.fontFamily) textArgs.push(`font: "${s.fontFamily}"`);
      if (s.fontSize) textArgs.push(`size: ${s.fontSize}`);

      // SmallCaps via OpenType feature — IDML "SmallCaps" → Typst features: ("smcp",)
      if (s.capitalization === 'SmallCaps') {
        textArgs.push('features: ("smcp",)');
      } else if (s.capitalization === 'AllCaps') {
        textArgs.push('features: ("c2sc", "smcp")');  // AllCaps via OT
      }

      // Tracking: IDML usa 1/1000 de em. Typst usa pt diretamente.
      // tracking/1000 * fontSize = valor em pt (ex: 150/1000 * 10pt = 1.5pt)
      if (s.tracking != null && s.tracking !== 0) {
        const fontSizePt = parseFloat(s.fontSize || '10') || 10;
        const trackPt = ((s.tracking / 1000) * fontSizePt).toFixed(3);
        textArgs.push(`tracking: ${trackPt}pt`);
      }

      // Neutralização do default do motor: Typst faz heading Bold por padrão.
      // InDesign tem Regular como padrão implícito.
      if (s.fontStyle && s.fontStyle.toLowerCase().includes('bold')) {
        textArgs.push(`weight: "bold"`);
      } else {
        textArgs.push(`weight: "regular"`);
      }


      if (textArgs.length) lines.push(`  set text(${textArgs.join(', ')})`);

      // set par: leading quando disponível
      if (s.leading && s.leading !== '0pt' && s.leading !== 'nullpt') {
        lines.push(`  set par(leading: ${s.leading})`);
      }

      // set block: espaçamento acima/abaixo
      const blockArgs = [];
      if (s.above && s.above !== 'nullem' && s.above !== '0em') blockArgs.push(`above: ${s.above}`);
      if (s.below && s.below !== 'nullem' && s.below !== '0em') blockArgs.push(`below: ${s.below}`);
      if (blockArgs.length) lines.push(`  set block(${blockArgs.join(', ')})`);

      // Conteúdo: H1 com pagebreak para página ímpar (recto) + centro; outros normal
      if (level === 1) {
        if (s.align === 'center') {
          lines.push('  pagebreak(to: "odd", weak: true)');
          lines.push('  align(center, it.body)');
        } else {
          lines.push('  pagebreak(to: "odd", weak: true)');
          lines.push('  it.body');
        }
      } else if (s.align === 'center') {
        lines.push('  align(center, it.body)');
      } else {
        lines.push('  it.body');
      }

      lines.push('}');
      lines.push('');
    }
  }


  // Footnote
  if (byRole.footnote) {
    const s = byRole.footnote.typst;
    lines.push('// --- Notas de Rodapé ---');
    const footnoteArgs = [];
    if (s.fontFamily) footnoteArgs.push(`font: "${s.fontFamily}"`);
    if (s.fontSize) footnoteArgs.push(`size: ${s.fontSize}`);
    if (footnoteArgs.length) lines.push(`#show footnote.entry: set text(${footnoteArgs.join(', ')})`);
    lines.push('');
  }

  // Block quote
  if (byRole.blockquote) {
    const s = byRole.blockquote.typst;
    lines.push('// --- Citação em Bloco ---');
    lines.push(`#show quote: it => {`);
    const padAmt = (s.indent && s.indent !== '0em') ? s.indent : '1.5em';
    lines.push(`  pad(left: ${padAmt}, it.body)`);
    lines.push('}');
    lines.push('');
  }

  // Epígrafe (Epigraph and Dedication do IDML)
  if (byRole.epigraph) {
    const s = byRole.epigraph.typst;
    const epArgs = [];
    if (s.fontFamily) epArgs.push(`font: "${s.fontFamily}"`);
    if (s.fontSize) epArgs.push(`size: ${s.fontSize}`);
    lines.push('// --- Epígrafe ---');
    if (epArgs.length) {
      lines.push(`// Tipografia IDML: ${epArgs.join(', ')}, style: "italic", align: center`);
    }
    lines.push(`// Uso no Typst: #block(inset: (left: 2em, right: 2em))[#set text(style: "italic")\\`);
    lines.push(`//   <texto da epígrafe>]`);
    lines.push('');
  }

  return lines.join('\n');
}


/**
 * Gera APENAS o bloco #set page para ser emitido diretamente no documento raiz (livro.typ).
 * IMPORTANTE: #set page dentro de #include NÃO afeta o documento pai no Typst.
 * Por isso este bloco deve ser inserido pelo mountBook() diretamente no livro.typ.
 *
 * @param {{ page: object }} mapped - objeto com page {width, height, margins}
 * @param {string|null} meta - BookMeta (para header com título)
 * @returns {string} - string com o bloco #set page completo
 */
export function generatePageSetup(mapped, meta = null) {
  const { page } = mapped;
  const titleForHeader = (meta && meta.title) ? meta.title.replace(/"/g, '\\"') : '';
  const lines = [];

  lines.push('// --- Página (único #set page — emitido diretamente no livro.typ) ---');
  lines.push(`#set page(`);
  lines.push(`  width: ${page.width},`);
  lines.push(`  height: ${page.height},`);
  lines.push(`  margin: (`);
  lines.push(`    top: ${page.marginTop},`);
  lines.push(`    bottom: ${page.marginBottom},`);
  lines.push(`    inside: ${page.marginLeft},`);
  lines.push(`    outside: ${page.marginRight},`);
  lines.push(`  ),`);
  lines.push(`  binding: left,`);
  lines.push('  numbering: none,');

  if (titleForHeader) {
    lines.push('  header: context {');
    lines.push('    let s = page-section.get()');
    lines.push('    if s == "rosto" or s == "sumario" { none }');
    lines.push('    else {');
    lines.push('      let p = counter(page).get().first()');
    lines.push('      set text(size: 6pt)');
    lines.push('      if calc.odd(p) {');
    lines.push(`        align(right)["${titleForHeader}"]`);
    lines.push('      } else {');
    lines.push('        let hs = query(selector(heading).before(here()))');
    lines.push('        if hs.len() > 0 { align(left)[#hs.last().body] }');
    lines.push('      }');
    lines.push('    }');
    lines.push('  },');
    lines.push('  footer: context {');
    lines.push('    let s = page-section.get()');
    lines.push('    if s == "rosto" { none }');
    lines.push('    else {');
    lines.push('      set text(size: 7pt)');
    lines.push('      align(center)[#counter(page).display()]');
    lines.push('    }');
    lines.push('  },');
  }

  lines.push(')');
  return lines.join('\n');
}

/**
 * Grava o theme.typ no diretório output/ e retorna o caminho.
 * @param {{ mappedStyles: object[], page: object }} mapped
 * @param {string} outputDir - Diretório onde gravar (default: ./output)
 * @param {object} [meta] - BookMeta opcional
 * @returns {string} - Caminho do arquivo gerado
 */
export function writeTheme(mapped, outputDir = './output', meta = null) {
  const content = generateThemeContent(mapped, meta);
  const outPath = path.join(outputDir, 'theme.typ');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`✅ theme-generator: theme.typ gerado em ${outPath}`);
  return outPath;
}

