/**
 * SCRIPT: idml-parser.js
 * DESCRIÇÃO: Abre o arquivo .idml (ZIP) e extrai ParagraphStyle e CharacterStyle do XML.
 *            Suporta ParagraphStyleGroup aninhados e atributos em <Properties>.
 * CHAMADO POR: robo-render.js, scripts de dump standalone
 * CONTRATO:
 *   - INPUT: caminho para arquivo .idml
 *   - OUTPUT: { paragraphStyles: [...], characterStyles: [...], pageGeometry: {...} }
 */

import unzipper from 'unzipper';
import xml2js from 'xml2js';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers de parse XML
// ---------------------------------------------------------------------------

/**
 * Lê o conteúdo de uma entry do ZIP e parseia como XML.
 * Usa explicitArray: true para manter uniformidade (arrays são sempre arrays).
 * @param {object} file - entry do unzipper
 * @returns {Promise<object>}
 */
async function parseXmlEntry(file) {
  const stream = file.stream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const xml = Buffer.concat(chunks).toString('utf-8');
  return xml2js.parseStringPromise(xml, {
    explicitArray: true,
    mergeAttrs: false,
    explicitCharkey: false,
  });
}

// ---------------------------------------------------------------------------
// Extração de atributos tipográficos
// ---------------------------------------------------------------------------

/**
 * Extrai um valor escalar de um atributo XML ou de um filho <Properties>.
 * No IDML, alguns valores ficam como attrs direto no elemento,
 * outros ficam dentro de <Properties><AppliedFont type="string">Cardo</AppliedFont></Properties>.
 *
 * @param {object} el - objeto xml2js do elemento
 * @param {string} attr - nome do atributo/elemento filho
 * @returns {string|null}
 */
function getAttr(el, attr) {
  // 1. Tenta nos atributos diretos do elemento
  if (el.$ && el.$[attr] != null) return el.$[attr];

  // 2. Tenta dentro de Properties
  const props = el.Properties;
  if (props && Array.isArray(props) && props.length > 0) {
    const p = props[0];
    if (p[attr] != null) {
      const val = p[attr];
      if (Array.isArray(val)) {
        // O valor pode ser { _: 'Cardo', $: { type: 'string' } } ou simples string
        const first = val[0];
        if (typeof first === 'object' && first._) return first._;
        if (typeof first === 'string') return first;
        if (typeof first === 'object' && first.$) return null; // enumeração sem valor útil
        return String(first);
      }
      return val;
    }
  }

  return null;
}

/**
 * Extrai o valor numérico de um atributo (retorna null se ausente ou não numérico).
 */
function getNum(el, attr) {
  const v = getAttr(el, attr);
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Traversal recursivo de ParagraphStyleGroup
// ---------------------------------------------------------------------------

/**
 * Percorre recursivamente ParagraphStyleGroup e extrai todos os ParagraphStyle.
 * Suporta múltiplos nívels de aninhamento.
 * @param {object|object[]} groupOrGroups - pode ser um objeto ou array de grupos
 * @returns {object[]} - lista flat de elementos ParagraphStyle
 */
function collectParagraphStyles(groupOrGroups) {
  const results = [];

  const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups];

  for (const group of groups) {
    // Estilos diretamente neste grupo
    if (group.ParagraphStyle) {
      const styles = Array.isArray(group.ParagraphStyle)
        ? group.ParagraphStyle
        : [group.ParagraphStyle];
      results.push(...styles);
    }
    // Subgrupos aninhados
    if (group.ParagraphStyleGroup) {
      results.push(...collectParagraphStyles(group.ParagraphStyleGroup));
    }
  }

  return results;
}

/**
 * Percorre recursivamente CharacterStyleGroup e extrai todos os CharacterStyle.
 */
function collectCharacterStyles(groupOrGroups) {
  const results = [];
  const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups];

  for (const group of groups) {
    if (group.CharacterStyle) {
      const styles = Array.isArray(group.CharacterStyle)
        ? group.CharacterStyle
        : [group.CharacterStyle];
      results.push(...styles);
    }
    if (group.CharacterStyleGroup) {
      results.push(...collectCharacterStyles(group.CharacterStyleGroup));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Mapeamento de estilos para objetos normalizados
// ---------------------------------------------------------------------------

function mapParagraphStyle(el) {
  const name = (el.$ && el.$.Name) || '';
  return {
    name,
    self: (el.$ && el.$.Self) || '',
    pointSize: getNum(el, 'PointSize'),
    leading: getNum(el, 'Leading'),
    spaceBefore: getNum(el, 'SpaceBefore') || 0,
    spaceAfter: getNum(el, 'SpaceAfter') || 0,
    leftIndent: getNum(el, 'LeftIndent') || 0,
    firstLineIndent: getNum(el, 'FirstLineIndent') || 0,
    justification: getAttr(el, 'Justification'),
    fontFamily: getAttr(el, 'AppliedFont'),
    fontStyle: getAttr(el, 'FontStyle'),
  };
}

function mapCharacterStyle(el) {
  const name = (el.$ && el.$.Name) || '';
  return {
    name,
    self: (el.$ && el.$.Self) || '',
    pointSize: getNum(el, 'PointSize'),
    fontFamily: getAttr(el, 'AppliedFont'),
    fontStyle: getAttr(el, 'FontStyle'),
  };
}

// ---------------------------------------------------------------------------
// Extração de geometria de página
// ---------------------------------------------------------------------------

function extractPageGeometry(spreadsXml) {
  const defaults = {
    pageWidth: null,
    pageHeight: null,
    marginTop: null,
    marginBottom: null,
    marginLeft: null,
    marginRight: null,
  };

  if (!spreadsXml) return defaults;

  try {
    // xml2js com explicitArray: true encapsula tudo em arrays
    const spreadKey = Object.keys(spreadsXml)[0]; // 'idPkg:Spread'
    const spreadData = spreadsXml[spreadKey];
    const spread = spreadData?.Spread?.[0];
    if (!spread) return defaults;

    const page = spread.Page?.[0];
    if (!page) return defaults;

    const boundsStr = page.$?.GeometricBounds;
    const bounds = boundsStr ? boundsStr.split(' ').map(Number) : null;

    const marginPrefs = page.MarginPreference?.[0]?.$ || {};

    return {
      pageWidth: bounds ? Math.abs(bounds[3] - bounds[1]) : null,
      pageHeight: bounds ? Math.abs(bounds[2] - bounds[0]) : null,
      marginTop: parseFloat(marginPrefs.Top) || null,
      marginBottom: parseFloat(marginPrefs.Bottom) || null,
      marginLeft: parseFloat(marginPrefs.Left) || null,
      marginRight: parseFloat(marginPrefs.Right) || null,
    };
  } catch (err) {
    console.warn(`⚠️ idml-parser: erro ao extrair geometria: ${err.message}`);
    return defaults;
  }
}

// ---------------------------------------------------------------------------
// Função principal exportada
// ---------------------------------------------------------------------------

/**
 * Extrai estilos e geometria de página de um arquivo .idml.
 * @param {string} idmlPath - Caminho absoluto para o .idml
 * @returns {Promise<{ paragraphStyles: object[], characterStyles: object[], pageGeometry: object }>}
 */
export async function parseIdml(idmlPath) {
  if (!fs.existsSync(idmlPath)) {
    throw new Error(`❌ idml-parser: arquivo não encontrado: ${idmlPath}`);
  }

  let stylesXml = null;
  let spreadsXml = null;

  const directory = await unzipper.Open.file(idmlPath);

  for (const file of directory.files) {
    if (file.path === 'Resources/Styles.xml') {
      stylesXml = await parseXmlEntry(file);
    }
    if (!spreadsXml && file.path.startsWith('Spreads/Spread_')) {
      spreadsXml = await parseXmlEntry(file);
    }
  }

  if (!stylesXml) {
    throw new Error('❌ idml-parser: Resources/Styles.xml não encontrado no .idml');
  }

  // Navega na estrutura: { 'idPkg:Styles': { RootParagraphStyleGroup: [...] } }
  const stylesRoot = stylesXml['idPkg:Styles'] || stylesXml;

  // Extração recursiva de paragraph styles
  const rootParaGroup = stylesRoot.RootParagraphStyleGroup;
  const rawParaStyles = rootParaGroup ? collectParagraphStyles(rootParaGroup) : [];
  const paragraphStyles = rawParaStyles.map(mapParagraphStyle);

  // Extração recursiva de character styles
  const rootCharGroup = stylesRoot.RootCharacterStyleGroup;
  const rawCharStyles = rootCharGroup ? collectCharacterStyles(rootCharGroup) : [];
  const characterStyles = rawCharStyles.map(mapCharacterStyle);

  const pageGeometry = extractPageGeometry(spreadsXml);

  return { paragraphStyles, characterStyles, pageGeometry };
}
