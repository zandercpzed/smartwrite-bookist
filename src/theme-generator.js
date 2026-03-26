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
export function generateThemeContent(mapped) {
  const { mappedStyles, page } = mapped;
  const lines = [];

  lines.push('// ============================================================');
  lines.push('// theme.typ — Gerado automaticamente pelo Smartwrite Bookist');
  lines.push('// NÃO EDITE ESTE ARQUIVO MANUALMENTE.');
  lines.push('// Fonte de verdade: template miolo.idml');
  lines.push('// ============================================================');
  lines.push('');

  // Configuração de página
  lines.push('// --- Página ---');
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
  lines.push(')');
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
      lines.push(`// --- ${name} (heading level ${level}) ---`);
      lines.push(`#show heading.where(level: ${level}): it => {`);
      if (s.fontSize || s.fontFamily) {
        const textArgs = [];
        if (s.fontFamily) textArgs.push(`font: "${s.fontFamily}"`);
        if (s.fontSize) textArgs.push(`size: ${s.fontSize}`);
        lines.push(`  set text(${textArgs.join(', ')})`);
      }
      if ((s.above && s.above !== 'null em') || (s.below && s.below !== 'null em')) {
        const blockArgs = [];
        if (s.above && s.above !== 'null em' && s.above !== '0em') blockArgs.push(`above: ${s.above}`);
        if (s.below && s.below !== 'null em' && s.below !== '0em') blockArgs.push(`below: ${s.below}`);
        if (blockArgs.length) lines.push(`  set block(${blockArgs.join(', ')})`);
      }
      lines.push('  it.body');
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

  return lines.join('\n');
}

/**
 * Grava o theme.typ no diretório output/ e retorna o caminho.
 * @param {{ mappedStyles: object[], page: object }} mapped
 * @param {string} outputDir - Diretório onde gravar (default: ./output)
 * @returns {string} - Caminho do arquivo gerado
 */
export function writeTheme(mapped, outputDir = './output') {
  const content = generateThemeContent(mapped);
  const outPath = path.join(outputDir, 'theme.typ');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`✅ theme-generator: theme.typ gerado em ${outPath}`);
  return outPath;
}
