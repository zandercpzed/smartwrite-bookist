/**
 * SCRIPT: robo-render.js
 * DESCRIÇÃO: Orquestrador CLI principal do Smartwrite Bookist.
 *            Encadeia: IDML Parser → Style Mapper → Theme Generator → Markdown Compiler → Typst PDF → Pandoc EPUB
 * CHAMADO POR: linha de comando (node robo-render.js --vol "01. Liezi") ou npm run render
 * CONTRATO:
 *   - INPUT: --vol <nome-da-pasta-do-volume>, --idml <caminho-do-template> (opcional)
 *   - OUTPUT: output/<vol>/miolo.pdf + output/<vol>/livro.epub
 */

import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { parseIdml } from './src/idml-parser.js';
import { mapStyles } from './src/style-mapper.js';
import { writeTheme } from './src/theme-generator.js';
import { compileMarkdown } from './src/markdown-compiler.js';

// ---------------------------------------------------------------------------
// CLI Setup
// ---------------------------------------------------------------------------

program
  .name('bookist')
  .description('Smartwrite Bookist — Motor headless de geração de livros')
  .version('0.1.0');

program
  .command('render')
  .description('Renderiza um volume (PDF + EPUB)')
  .requiredOption('--vol <nome>', 'Nome da pasta do volume (ex: "01. Liezi")')
  .option('--idml <path>', 'Caminho custom do template .idml')
  .option('--col-dir <path>', 'Caminho para a pasta da coleção (onde vivem os volumes)')
  .option('--pdf-only', 'Gerar apenas o PDF (pular EPUB)')
  .option('--epub-only', 'Gerar apenas o EPUB (pular PDF)')
  .option('--dump', 'Apenas fazer dump dos estilos IDML (não renderiza)')
  .action(async (options) => {
    await runRender(options);
  });

program.parse(process.argv);

// ---------------------------------------------------------------------------
// Pipeline Principal
// ---------------------------------------------------------------------------

async function runRender(options) {
  const startTime = Date.now();
  const { vol, idml: idmlOverride, colDir: colDirOverride, pdfOnly, epubOnly, dump } = options;

  console.log(`\n🤖 Smartwrite Bookist — iniciando render`);
  console.log(`   Volume: ${vol}`);

  // --- Resolve caminhos ---
  const rootDir = process.cwd();

  // Resolve a pasta da coleção (onde vivem os volumes)
  const collectionDir = colDirOverride
    ? path.resolve(colDirOverride)
    : resolveCollectionDir(rootDir);
  console.log(`   Coleção: ${collectionDir}`);

  // Procura a pasta do volume dentro da coleção
  const volDir = resolveVolumeDir(collectionDir, vol);
  console.log(`   Pasta: ${volDir}`);

  const textDir = findTextDir(volDir);
  console.log(`   Textos: ${textDir}`);

  const idmlPath = idmlOverride
    ? path.resolve(idmlOverride)
    : path.join(rootDir, '_templates', 'template miolo.idml');

  if (!fs.existsSync(idmlPath)) {
    fatal(`Template .idml não encontrado: ${idmlPath}`);
  }
  console.log(`   Template: ${idmlPath}`);

  // Diretório de saída por volume
  const outputDir = path.join(rootDir, 'output', sanitizeVolName(vol));
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`   Output: ${outputDir}\n`);

  // --- Etapa 1: Extração IDML ---
  console.log('🔍 [1/5] Extraindo estilos do IDML...');
  const parsed = await parseIdml(idmlPath);
  console.log(`   → ${parsed.paragraphStyles.length} paragraph styles, ${parsed.characterStyles.length} character styles`);

  // Dump mode: mostra os estilos e sai
  if (dump) {
    console.log('\n📋 DUMP — Paragraph Styles:');
    parsed.paragraphStyles.forEach((s) =>
      console.log(`  [${s.name}] size=${s.pointSize}pt leading=${s.leading}pt font="${s.fontFamily}"`)
    );
    console.log('\n📋 DUMP — Character Styles:');
    parsed.characterStyles.forEach((s) =>
      console.log(`  [${s.name}] size=${s.pointSize}pt font="${s.fontFamily}"`)
    );
    console.log('\n📋 DUMP — Page Geometry:');
    console.log(parsed.pageGeometry);
    console.log('\n✅ Dump concluído.');
    return;
  }

  // --- Etapa 2: Mapeamento de Estilos ---
  console.log('🗺️  [2/5] Mapeando estilos para Typst...');
  const mapped = mapStyles(parsed);
  const mappedCount = mapped.mappedStyles.filter((s) => s.role).length;
  console.log(`   → ${mappedCount} estilos mapeados, ${mapped.unmappedStyles.length} sem mapeamento semântico`);

  // --- Etapa 3: Geração do Tema ---
  console.log('🎨 [3/5] Gerando theme.typ...');
  const themePath = writeTheme(mapped, outputDir);

  // --- Etapa 4: Compilação do Markdown ---
  console.log('📝 [4/5] Compilando Markdown → Typst...');
  compileMarkdown(textDir, outputDir);

  // Monta o livro.typ final
  const bookTypPath = mountBook(outputDir, vol, parsed.paragraphStyles);
  console.log(`   → livro.typ montado em ${bookTypPath}`);

  // --- Etapa 5: Renderização ---
  if (!epubOnly) {
    console.log('\n📄 [5/5] Renderizando PDF com Typst...');
    renderPdf(bookTypPath, outputDir, vol);
  }

  if (!pdfOnly) {
    console.log('\n📖 [5/5] Gerando EPUB com Pandoc...');
    renderEpub(textDir, outputDir, vol);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Render concluído em ${elapsed}s`);
  console.log(`   📁 ${outputDir}`);
}

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

/**
 * Resolve a pasta da coleção (onde ficam os volumes).
 * Tenta, em ordem: FASE I → FASE II → FASE III → pai do repositório.
 */
function resolveCollectionDir(rootDir) {
  const parentDir = path.dirname(rootDir);
  const faseDirs = ['FASE I', 'FASE II', 'FASE III'];
  for (const fase of faseDirs) {
    const p = path.join(parentDir, fase);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p; // Retorna a primeira FASE que existir — será buscado recursivamente em todas
    }
  }
  // Fallback: busca na raiz do projeto
  return rootDir;
}

function resolveVolumeDir(collectionDir, vol) {
  // Busca em todas as subpastas FASE I, II, III se collectionDir for o pai
  const parentDir = collectionDir;
  let searchDirs = [parentDir];

  // Se collectionDir for o pai de FAESs, busca em todas elas
  const faseDirs = ['FASE I', 'FASE II', 'FASE III'];
  const fasePaths = faseDirs.map((f) => path.join(path.dirname(parentDir), f)).filter(fs.existsSync);
  if (fasePaths.some((p) => p === parentDir)) {
    // Já estamos em uma FASE, busca direta
    searchDirs = [parentDir];
  } else if (fasePaths.length > 0) {
    searchDirs = fasePaths;
  }

  for (const searchDir of searchDirs) {
    if (!fs.existsSync(searchDir)) continue;
    const entries = fs.readdirSync(searchDir);
    const match = entries.find(
      (e) => e.toLowerCase().startsWith(vol.toLowerCase()) || e === vol
    );
    if (match) {
      const full = path.join(searchDir, match);
      if (fs.statSync(full).isDirectory()) return full;
    }
  }

  fatal(`Pasta do volume não encontrada: "${vol}"\nBuscado em: ${searchDirs.join(', ')}`);
}

function findTextDir(volDir) {
  // Procura "_ texto" ou "_texto" ou "texto"
  const candidates = ['_ texto', '_texto', 'texto', 'text'];
  for (const candidate of candidates) {
    const p = path.join(volDir, candidate);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  fatal(`Pasta de textos não encontrada em: ${volDir}\nEsperado: "_ texto", "_texto" ou "texto"`);
}

function sanitizeVolName(vol) {
  return vol.replace(/[^a-zA-Z0-9À-ÿ\-_. ]/g, '').trim().replace(/\s+/g, '_');
}

/**
 * Monta o livro.typ final unindo theme + body.
 * Sprint 2 adicionará rosto, TOC e colofão.
 */
function mountBook(outputDir, volTitle, paragraphStyles) {
  const bookPath = path.join(outputDir, 'livro.typ');

  // Detecta a fonte principal do body para CJK fallback
  const bodyStyle = paragraphStyles.find((s) => /^(body|corpo|texto corrido|normal)$/i.test(s.name));
  const bodyFont = bodyStyle?.fontFamily || 'Linux Libertine';

  const content = `// ============================================================
// livro.typ — Gerado automaticamente pelo Smartwrite Bookist
// NÃO EDITE ESTE ARQUIVO MANUALMENTE.
// ============================================================

#import "theme.typ": *

// CJK fallback (Pinyin, Hanzi, Kanji)
#set text(fallback: true)

// Corpo do livro
#include "livro-body.typ"
`;

  fs.writeFileSync(bookPath, content, 'utf-8');
  return bookPath;
}

function renderPdf(bookTypPath, outputDir, vol) {
  const pdfName = `${sanitizeVolName(vol)}_miolo.pdf`;
  const pdfPath = path.join(outputDir, pdfName);
  try {
    execFileSync('typst', ['compile', bookTypPath, pdfPath], { stdio: 'inherit' });
    console.log(`   ✅ PDF gerado: ${pdfPath}`);
  } catch (err) {
    fatal(`Typst falhou ao compilar o PDF: ${err.message}`);
  }
}

function renderEpub(textDir, outputDir, vol) {
  const epubName = `${sanitizeVolName(vol)}.epub`;
  const epubPath = path.join(outputDir, epubName);

  // Pandoc: concatena todos os .md em ordem léxica
  const mdFiles = fs
    .readdirSync(textDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => path.join(textDir, f));

  if (mdFiles.length === 0) {
    console.warn('⚠️ Nenhum .md encontrado para gerar o EPUB');
    return;
  }

  try {
    execFileSync(
      'pandoc',
      [
        ...mdFiles,
        '--from', 'markdown+footnotes+smart',
        '--to', 'epub3',
        '--output', epubPath,
        '--epub-cover-image', path.join(process.cwd(), '_templates', 'cover-placeholder.jpg'),
        '--toc',
        '--toc-depth=2',
      ].filter((arg, i, arr) => {
        // Remove --epub-cover-image se o arquivo não existir
        if (arg === '--epub-cover-image') {
          const coverPath = arr[i + 1];
          return fs.existsSync(coverPath);
        }
        if (i > 0 && arr[i - 1] === '--epub-cover-image' && !fs.existsSync(arg)) return false;
        return true;
      }),
      { stdio: 'inherit' }
    );
    console.log(`   ✅ EPUB gerado: ${epubPath}`);
  } catch (err) {
    fatal(`Pandoc falhou ao gerar o EPUB: ${err.message}`);
  }
}

function fatal(msg) {
  console.error(`\n❌ robo-render: ${msg}`);
  process.exit(1);
}
