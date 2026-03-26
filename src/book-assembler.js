/**
 * SCRIPT: book-assembler.js
 * DESCRIÇÃO: Gera os arquivos Typst estruturais do livro: rosto.typ e colofao.typ.
 *            Os arquivos são gerados a partir do BookMeta (lido pelo book-meta-parser).
 * CHAMADO POR: robo-render.js
 * CONTRATO:
 *   - INPUT: { meta: BookMeta, outputDir: string }
 *   - OUTPUT: grava rosto.typ e colofao.typ; retorna { rostoPath, colofaoPath }
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers de escape Typst
// ---------------------------------------------------------------------------

/**
 * Escapa caracteres especiais em strings a serem emitidas em Typst.
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/@/g, '\\@')
    .replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// Gerador da Folha de Rosto
// ---------------------------------------------------------------------------

/**
 * Gera o conteúdo Typst da folha de rosto.
 * @param {object} meta - BookMeta
 * @param {object} [page] - Dimensões da página { width, height } (do style-mapper)
 * @returns {string}
 */
export function generateRosto(meta, page = null) {
  const lines = [];
  const w = page?.width || '12cm';
  const h = page?.height || '18cm';

  lines.push('// rosto.typ — Gerado automaticamente pelo Smartwrite Bookist');
  lines.push('// NÃO EDITE MANUALMENTE.');
  lines.push('// Nota: #set page é gerenciado pelo theme.typ via page-section state');
  lines.push('');

  // Layout vertical: tudo centralizado com espaçamento proporcional
  lines.push('#align(center)[');
  lines.push('');

  // Série e volume (topo, discreto)
  if (meta.series) {
    lines.push(`  #text(size: 7pt, tracking: 0.1em)[${esc(meta.series).toUpperCase()}]`);
    if (meta.volume) {
      lines.push(`  #linebreak()`);
      lines.push(`  #text(size: 7pt)[Vol. ${esc(String(meta.volume))}]`);
    }
    lines.push(`  #v(2cm)`);
  }

  // Título principal
  lines.push(`  #text(size: 28pt, weight: "regular")[${esc(meta.title)}]`);

  // Subtítulo
  if (meta.subtitle) {
    lines.push(`  #v(0.5cm)`);
    lines.push(`  #text(size: 11pt, style: "italic")[${esc(meta.subtitle)}]`);
  }

  // Título original (se diferente)
  if (meta.original_title) {
    lines.push(`  #v(0.3cm)`);
    lines.push(`  #text(size: 8pt)[${esc(meta.original_title)}]`);
  }

  // Espaço generoso antes da autoria
  lines.push(`  #v(3cm)`);

  // Autoria
  if (meta.author) {
    lines.push(`  #text(size: 10pt)[${esc(meta.author)}]`);
  }

  // Informações de tradução e edição (bloco separado)
  const creditLines = [];
  if (meta.translator) creditLines.push(`Tradução: ${esc(meta.translator)}`);
  if (meta.editor) creditLines.push(`Edição: ${esc(meta.editor)}`);
  if (meta.introduction) creditLines.push(`Introdução: ${esc(meta.introduction)}`);

  if (creditLines.length > 0) {
    lines.push(`  #v(0.8cm)`);
    lines.push(`  #text(size: 8pt, style: "italic")[${creditLines.join(' \\ ')}]`);
  }

  // Espaço flexível antes da editora (empurra para baixo)
  lines.push(`  #v(1fr)`);

  // Editora e ano (rodapé da rosto)
  const publisherLine = [meta.publisher, meta.publisher_city, meta.year]
    .filter(Boolean)
    .join(' · ');
  lines.push(`  #text(size: 8pt)[${esc(publisherLine)}]`);
  lines.push('');

  lines.push(']'); // fecha #align(center)

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Gerador do Colofão
// ---------------------------------------------------------------------------

/**
 * Gera o conteúdo Typst do colofão.
 * @param {object} meta - BookMeta
 * @param {object} [page] - Dimensões da página { width, height } (do style-mapper)
 * @returns {string}
 */
export function generateColofao(meta, page = null) {
  const lines = [];
  const w = page?.width || '12cm';
  const h = page?.height || '18cm';

  lines.push('// colofao.typ — Gerado automaticamente pelo Smartwrite Bookist');
  lines.push('// NÃO EDITE MANUALMENTE.');
  lines.push('// Nota: #set page é gerenciado pelo theme.typ via page-section state');
  lines.push('');

  // Posiciona o colofão na parte inferior da página
  lines.push('#v(1fr)');
  lines.push('');
  lines.push('#set align(left)');
  lines.push('#set text(size: 7pt)');
  lines.push('');

  lines.push('#line(length: 3cm)');
  lines.push('#v(0.5em)');

  // Dados bibliográficos
  if (meta.title) {
    const titleLine = meta.subtitle
      ? `${esc(meta.title)}: ${esc(meta.subtitle)}`
      : esc(meta.title);
    lines.push(`${titleLine} \\`);
  }
  if (meta.author) lines.push(`${esc(meta.author)} \\`);
  if (meta.translator) lines.push(`Tradução: ${esc(meta.translator)} \\`);
  if (meta.editor) lines.push(`Edição: ${esc(meta.editor)} \\`);

  lines.push('');

  // ISBN
  if (meta.isbn) {
    lines.push(`ISBN: ${esc(meta.isbn)} \\`);
  }

  // Direitos autorais
  if (meta.rights) {
    lines.push('');
    lines.push(`${esc(meta.rights)} \\`);
  }

  // Colofão tipográfico (campo livre do book.yaml)
  if (meta.colophon) {
    lines.push('');
    // Converte quebras de linha do colofão em \\ Typst
    const colophonLines = meta.colophon.split('\n').filter(l => l.trim());
    lines.push(colophonLines.map(l => esc(l)).join(' \\\n'));
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Função principal: grava os arquivos
// ---------------------------------------------------------------------------

/**
 * Gera e grava rosto.typ e colofao.typ no diretório de output.
 * @param {object} meta - BookMeta
 * @param {string} outputDir - Diretório de output
 * @param {object} [page] - Dimensões { width, height } do template IDML
 * @returns {{ rostoPath: string, colofaoPath: string }}
 */
export function writeBookStructure(meta, outputDir, page = null) {
  fs.mkdirSync(outputDir, { recursive: true });

  const rostoContent = generateRosto(meta, page);
  const rostoPath = path.join(outputDir, 'rosto.typ');
  fs.writeFileSync(rostoPath, rostoContent, 'utf-8');
  console.log(`✅ book-assembler: rosto.typ gerado`);

  const colofaoContent = generateColofao(meta, page);
  const colofaoPath = path.join(outputDir, 'colofao.typ');
  fs.writeFileSync(colofaoPath, colofaoContent, 'utf-8');
  console.log(`✅ book-assembler: colofao.typ gerado`);

  return { rostoPath, colofaoPath };
}
