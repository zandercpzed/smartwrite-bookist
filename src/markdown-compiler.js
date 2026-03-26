/**
 * SCRIPT: markdown-compiler.js
 * DESCRIÇÃO: Lê os arquivos .md de uma pasta de volume, converte via AST (unified/remark)
 *            para sintaxe Typst e grava o corpo do livro em output/livro-body.typ.
 * CHAMADO POR: robo-render.js
 * CONTRATO:
 *   - INPUT: caminho para a pasta do volume (ex: "01. Liezi/_ texto")
 *   - OUTPUT: string com o corpo do livro em Typst (também grava output/livro-body.typ)
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFootnotes from 'remark-footnotes';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Configuração do pipeline unified/remark
// ---------------------------------------------------------------------------
const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFootnotes, { inlineNotes: true });

// ---------------------------------------------------------------------------
// Escape de caracteres especiais do Typst
// ---------------------------------------------------------------------------

/**
 * Escapa caracteres que têm significado especial na sintaxe Typst:
 * # (commandos), @ (labels/refs)
 * Não escapa * _ ` pois esses são traduzidos explicitamente no AST.
 * @param {string} str
 * @returns {string}
 */
function escapeTypst(str) {
  // Em Typst, # inicia comandos e @ inicia labels/referências
  return str.replace(/#/g, '\\#').replace(/@/g, '\\@');
}

// ---------------------------------------------------------------------------
// Conversão de nós AST → Typst (ADR-003, Tabela de Mapeamento)
// ---------------------------------------------------------------------------

/**
 * Converte um nó do AST remark para string Typst.
 * @param {object} node
 * @param {{ footnotes: Map<string, string> }} ctx - contexto compartilhado
 * @returns {string}
 */
function nodeToTypst(node, ctx) {
  switch (node.type) {
    case 'root':
      return node.children.map((n) => nodeToTypst(n, ctx)).join('\n');

    case 'paragraph': {
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('');
      return `${inner}\n`;
    }

    case 'heading': {
      const level = '='.repeat(node.depth);
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('');
      return `\n${level} ${inner}\n`;
    }

    case 'text':
      return escapeTypst(node.value);

    case 'strong': {
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('');
      return `*${inner}*`;
    }

    case 'emphasis': {
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('');
      return `_${inner}_`;
    }

    case 'inlineCode':
      return `\`${node.value}\``;

    case 'code':
      return `\n#raw(lang: "${node.lang || ''}", block: true, """${node.value}""")\n`;

    case 'blockquote': {
      // join('\n') garante linha em branco entre parágrafos dentro do quote
      // (em Typst, \n simples = espaço; \n\n = novo parágrafo)
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('\n');
      return `\n#quote[\n${inner}]\n`;
    }

    case 'thematicBreak':
      // Linha fina 0.25pt, centralizada, com margem lateral (~5cm da borda da coluna)
      return '\n#v(0.8em)\n#pad(x: 2cm)[#line(length: 100%, stroke: 0.25pt)]\n#v(0.8em)\n';


    case 'list': {
      const items = node.children
        .map((item) => {
          const content = item.children.map((n) => nodeToTypst(n, ctx)).join('').trim();
          return node.ordered ? `+ ${content}` : `- ${content}`;
        })
        .join('\n');
      return `\n${items}\n`;
    }

    case 'listItem': {
      return node.children.map((n) => nodeToTypst(n, ctx)).join('');
    }

    case 'image': {
      const alt = node.alt ? `, alt: "${node.alt}"` : '';
      return `#image("${node.url}"${alt})`;
    }

    case 'link': {
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('');
      return `#link("${node.url}")[${inner}]`;
    }

    // Notas de rodapé (remark-footnotes)
    case 'footnoteReference': {
      const id = node.identifier;
      const footnoteText = ctx.footnotes.get(id) || `[nota ${id}]`;
      return `#footnote[${footnoteText}]`;
    }

    case 'footnoteDefinition': {
      // Registra a nota — será consumida pelo footnoteReference
      const id = node.identifier;
      const text = node.children.map((n) => nodeToTypst(n, ctx)).join('').trim();
      ctx.footnotes.set(id, text);
      return ''; // não gera output direto aqui
    }

    case 'footnote': {
      // Nota inline [^texto]
      const inner = node.children.map((n) => nodeToTypst(n, ctx)).join('').trim();
      return `#footnote[${inner}]`;
    }

    case 'html':
      // HTML inline é ignorado com aviso — Typst não suporta HTML
      console.warn(`⚠️ markdown-compiler: HTML inline ignorado: ${node.value.substring(0, 60)}`);
      return '';

    case 'table': {
      // Tabelas básicas (Sprint 3 fará tratamento aprofundado)
      const rows = node.children.map((row) => {
        const cells = row.children.map((cell) =>
          cell.children.map((n) => nodeToTypst(n, ctx)).join('').trim()
        );
        return cells.join(' | ');
      });
      return `\n// TABLE (simplificado — Sprint 3 melhorará isso)\n${rows.join('\n')}\n`;
    }

    default:
      console.warn(`⚠️ markdown-compiler: tipo de nó não mapeado: "${node.type}"`);
      return node.value || '';
  }
}

// ---------------------------------------------------------------------------
// Função de compilação de um arquivo .md
// ---------------------------------------------------------------------------

/**
 * Compila um único arquivo Markdown para string Typst.
 * @param {string} filePath
 * @returns {string}
 */
function compileFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(content);

  // Contexto compartilhado para coletar definições de footnotes antes de resolver refs
  const ctx = { footnotes: new Map() };

  // Primeira passagem: coletar definições de footnotes
  (function collectFootnotes(node) {
    if (node.type === 'footnoteDefinition') {
      const text = node.children
        .map((n) => nodeToTypst(n, ctx))
        .join('')
        .trim();
      ctx.footnotes.set(node.identifier, text);
    }
    if (node.children) node.children.forEach(collectFootnotes);
  })(ast);

  // Segunda passagem: converter para Typst
  return nodeToTypst(ast, ctx);
}

// ---------------------------------------------------------------------------
// Helper: bloco de epígrafe
// ---------------------------------------------------------------------------

/**
 * Envolve o conteúdo compilado de uma epígrafe no bloco Typst correto:
 * Cardo 9pt, itálico, centralizado, com recuo lateral.
 */
function buildEpigraphBlock(content) {
  return [
    `#v(2em)`,
    `#block(width: 100%, inset: (left: 2em, right: 2em))[`,
    `  #set text(font: "Cardo", size: 9pt, style: "italic")`,
    `  #set par(leading: 12pt)`,
    `  #set align(center)`,
    content.trim(),
    `]`,
    `#v(1em)`,
  ].join('\n');
}


/**
 * Compila um único arquivo .md e grava o resultado em um .typ de destino.
 * Suporta arquivos especiais: folha de face (tags [TITLE]/[SUBTITLE]) e epígrafe.
 * @param {string} srcPath - Caminho do arquivo .md fonte
 * @param {string} destPath - Caminho do arquivo .typ de saída
 * @returns {string} - Conteúdo Typst gerado
 */
export function compileSpecialFile(srcPath, destPath) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`❌ markdown-compiler: arquivo especial não encontrado: ${srcPath}`);
  }
  const basename = path.basename(srcPath, '.md').toLowerCase();
  let content;

  if (basename.includes('folha') || basename.includes('face') || basename.includes('rosto')) {
    // Folha de face: converte tags customizadas [TITLE]/[SUBTITLE] + layout centralizado
    content = compileFolhaFace(srcPath);
  } else {
    content = compileFile(srcPath);
    if (basename.includes('epigrafe') || basename.includes('epigraph')) {
      content = buildEpigraphBlock(content);
    }
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ markdown-compiler: ${path.basename(destPath)} gerado de ${path.basename(srcPath)}`);
  return content;
}

/**
 * Compila a Folha de Face — lê o .md bruto e converte tags [TITLE]/[SUBTITLE]
 * para marcação Typst, preservando o layout editorial vertical centralizado.
 */
function compileFolhaFace(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  const typstLines = ['// rosto.typ — gerado de ' + path.basename(filePath), ''];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      typstLines.push('#v(0.4em)');
      continue;
    }

    // Tags customizadas
    const titleMatch = trimmed.match(/^\[TITLE\](.+)\[\/TITLE\]$/);
    const subtitleMatch = trimmed.match(/^\[SUBTITLE\](.+)\[\/SUBTITLE\]$/);

    if (titleMatch) {
      typstLines.push(`#text(size: 28pt, weight: "regular")[${esc(titleMatch[1])}]`);
    } else if (subtitleMatch) {
      typstLines.push(`#v(0.5cm)`);
      typstLines.push(`#text(size: 11pt, style: "italic")[${esc(subtitleMatch[1])}]`);
    } else {
      typstLines.push(`#text(size: 8pt)[${esc(trimmed)}]`);
    }
  }

  // Envolve tudo em align(center) com espaçamento flexível
  return [
    '#align(center)[',
    '#v(2cm)',
    ...typstLines,
    '#v(1fr)',
    ']',
  ].join('\n');
}

/** Escapa caracteres especiais Typst em strings literais */
function esc(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/#/g, '\\#').replace(/@/g, '\\@');
}


/**
 * Compila todos os arquivos .md de uma pasta em ordem léxica.
 * @param {string} textDir - Pasta com os arquivos .md
 * @param {string} outputDir - Onde gravar livro-body.typ
 * @param {string[]} [exclude=[]] - Basenames a excluir (arquivos especiais já compilados)
 * @returns {string} - Conteúdo Typst completo do corpo do livro
 */
export function compileMarkdown(textDir, outputDir = './output', exclude = []) {
  if (!fs.existsSync(textDir)) {
    throw new Error(`❌ markdown-compiler: pasta não encontrada: ${textDir}`);
  }

  const mdFiles = fs
    .readdirSync(textDir)
    .filter((f) => f.endsWith('.md') && !exclude.includes(f))
    .sort()
    .map((f) => path.join(textDir, f));

  if (mdFiles.length === 0) {
    throw new Error(`❌ markdown-compiler: nenhum arquivo .md encontrado em: ${textDir}`);
  }

  console.log(`📚 markdown-compiler: compilando ${mdFiles.length} arquivo(s)...`);

  const sections = mdFiles.map((filePath) => {
    const basename = path.basename(filePath, '.md').toLowerCase();
    console.log(`  → ${path.basename(filePath)}`);
    let content = compileFile(filePath);

    // Detecção por nome de arquivo: epígrafe recebe estilo centralizado/itálico
    if (basename.includes('epigrafe') || basename.includes('epigraph')) {
      content = [
        `#v(2em)`,
        `#block(width: 100%, inset: (left: 2em, right: 2em))[`,
        `  #set text(font: "Cardo", size: 9pt, style: "italic")`,
        `  #set par(leading: 12pt)`,
        `  #set align(center)`,
        content.trim(),
        `]`,
        `#v(1em)`,
      ].join('\n');
    }

    return content;
  });


  const body = sections.join('\n\n// --- nova seção ---\n\n');

  // Grava o arquivo de saída
  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, 'livro-body.typ');
  fs.writeFileSync(outPath, body, 'utf-8');
  console.log(`✅ markdown-compiler: corpo gerado em ${outPath}`);

  return body;
}
