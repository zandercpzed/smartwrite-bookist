/**
 * SCRIPT: book-meta-parser.js
 * DESCRIÇÃO: Lê o book.yaml de um volume e retorna um objeto BookMeta normalizado.
 *            Fornece defaults seguros para todos os campos — ausência de book.yaml
 *            não quebra o pipeline (gera aviso e retorna metadados mínimos).
 * CHAMADO POR: robo-render.js
 * CONTRATO:
 *   - INPUT: caminho para a pasta do volume
 *   - OUTPUT: objeto BookMeta com todos os campos preenchidos
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Parser YAML simples (sem dependência externa)
// Suporta apenas o subconjunto flat + bloco literal (|) do YAML
// usado no book.yaml do Bookist.
// ---------------------------------------------------------------------------

/**
 * Parser YAML minimalista para o subset do book.yaml.
 * Suporta: strings, números, blocos literais (|).
 * @param {string} content
 * @returns {object}
 */
function parseBookYaml(content) {
  const result = {};
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Linha em branco ou comentário
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    // Detecta chave: valor ou chave: |
    const match = line.match(/^(\w[\w-_]*)\s*:\s*(.*)/);
    if (!match) { i++; continue; }

    const key = match[1];
    const valueRaw = match[2].trim();

    if (valueRaw === '|') {
      // Bloco literal: lê linhas indentadas até próxima chave ou fim
      i++;
      const blockLines = [];
      while (i < lines.length && (lines[i] === '' || lines[i].startsWith('  '))) {
        blockLines.push(lines[i].replace(/^  /, ''));
        i++;
      }
      result[key] = blockLines.join('\n').trim();
    } else {
      // Valor simples — remove aspas opcionais
      result[key] = valueRaw.replace(/^["']|["']$/g, '');
      i++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS = {
  title: 'Sem título',
  subtitle: '',
  series: '',
  volume: '',
  author: '',
  original_title: '',
  original_language: '',
  period: '',
  translator: '',
  editor: '',
  introduction: '',
  publisher: 'Z•Edições',
  publisher_city: 'São Paulo',
  year: new Date().getFullYear().toString(),
  isbn: '',
  language: 'pt-BR',
  rights: '',
  colophon: '',
};

// ---------------------------------------------------------------------------
// Função principal
// ---------------------------------------------------------------------------

/**
 * Lê e normaliza os metadados de um volume.
 * @param {string} volDir - Caminho absoluto da pasta do volume
 * @returns {{ meta: object, found: boolean }}
 */
export function readBookMeta(volDir) {
  const yamlPath = path.join(volDir, 'book.yaml');

  if (!fs.existsSync(yamlPath)) {
    console.warn(`⚠️ book-meta-parser: book.yaml não encontrado em ${volDir}`);
    console.warn('   → Gerando PDF sem rosto e colofão. Crie book.yaml para ativar.');
    return { meta: { ...DEFAULTS }, found: false };
  }

  try {
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const parsed = parseBookYaml(content);

    // Merge com defaults — campos ausentes recebem valor default
    const meta = { ...DEFAULTS, ...parsed };

    console.log(`✅ book-meta-parser: book.yaml lido (título: "${meta.title}")`);
    return { meta, found: true };
  } catch (err) {
    console.error(`❌ book-meta-parser: erro ao ler book.yaml: ${err.message}`);
    return { meta: { ...DEFAULTS }, found: false };
  }
}
