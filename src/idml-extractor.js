/**
 * SCRIPT: idml-extractor.js
 * DESCRIÇÃO: Extrai TODA a informação relevante de um arquivo .idml e a persiste
 *            em JSON estruturado. É a fonte de verdade visual do template.
 *            Extrai: estilos (paragraph/character/object/table/cell) com herança
 *            BasedOn resolvida, cores/swatches, fontes, variáveis de documento,
 *            idiomas, geometria de página e master pages.
 * CHAMADO POR: robo-render.js (comando extract-idml e pipeline render)
 * CONTRATO:
 *   - INPUT: caminhos para o .idml e para o JSON de saída
 *   - OUTPUT: objeto TemplateData + arquivo JSON gravado em outputJsonPath
 */

import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { parseStringPromise } from 'xml2js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lê um arquivo XML de dentro do IDML (ZIP) e retorna o objeto parseado.
 * @param {string} idmlPath - Caminho do .idml
 * @param {string} entryName - Nome do arquivo interno (ex: "Resources/Styles.xml")
 * @returns {Promise<object|null>}
 */
async function readIdmlXml(idmlPath, entryName) {
  try {
    const dir = await unzipper.Open.file(idmlPath);
    const entry = dir.files.find((f) => f.path === entryName);
    if (!entry) return null;
    const content = await entry.buffer();
    return await parseStringPromise(content.toString('utf-8'), {
      explicitArray: false,
      mergeAttrs: true,
    });
  } catch {
    return null;
  }
}

/**
 * Converte pt para cm com 4 casas decimais.
 */
const ptToCm = (pt) => (pt != null ? Math.round((pt / 28.3465) * 10000) / 10000 : null);

/**
 * Converte pt para em (relativo a 9pt = tamanho base).
 */
const ptToEm = (pt, base = 9) => (pt != null ? Math.round((pt / base) * 1000) / 1000 : null);

/**
 * Normaliza o valor de um atributo IDML — retorna número para strings numéricas,
 * string para o resto, null para ausentes/$ IDs internos.
 */
function normalizeAttr(val) {
  if (val == null || val === '' || String(val).startsWith('$ID/')) return null;
  const n = Number(val);
  return isNaN(n) ? String(val) : n;
}

// ---------------------------------------------------------------------------
// Extração de Estilos
// ---------------------------------------------------------------------------

/**
 * Traversal recursivo nos grupos de estilos para coletar todos os styles.
 * @param {object|Array} node - O nó XML atual (Root group ou subgrupo)
 * @param {string} type - "ParagraphStyle", "CharacterStyle", etc.
 * @param {Array} accumulator - Resultado acumulado
 * @param {string} prefix - Caminho de grupos pai (ex: "Body Text:Subgrupo")
 */
function collectStyles(node, type, accumulator = [], prefix = '') {
  if (!node) return accumulator;

  const groupKey = `${type}Group`;

  // Se é um array, itera cada elemento
  if (Array.isArray(node)) {
    for (const child of node) collectStyles(child, type, accumulator, prefix);
    return accumulator;
  }

  // Coleta estilos do tipo especificado neste nível
  if (node[type]) {
    const styles = Array.isArray(node[type]) ? node[type] : [node[type]];
    for (const s of styles) {
      // O Name do estilo não inclui o caminho de grupos — isso é responsabilidade do prefix
      accumulator.push({ ...s, _prefix: prefix });
    }
  }

  // Desce em subgrupos, acumulando o caminho
  if (node[groupKey]) {
    const groups = Array.isArray(node[groupKey]) ? node[groupKey] : [node[groupKey]];
    for (const g of groups) {
      // Monta o caminho: "GrupoPai:GrupoFilho"
      const groupName = g.Name || '';
      const newPrefix = groupName
        ? (prefix ? `${prefix}:${groupName}` : groupName)
        : prefix;
      collectStyles(g, type, accumulator, newPrefix);
    }
  }

  return accumulator;
}


/**
 * Extrai o valor de propriedade do IDML que pode vir como:
 *   - atributo direto (string)
 *   - objeto mergeado: { _: "valor", type: "string|unit|object|enumeration" }
 * Retorna string ou null.
 */
function extractPropValue(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return raw;
  // Objeto com _ como valor e type como metadado (padrão Properties IDML)
  if (typeof raw === 'object') {
    const val = raw._ ?? raw['#text'] ?? null;
    return val;
  }
  return null;
}

/**
 * Extrai as propriedades tipográficas relevantes de um nó de style XML.
 * Com mergeAttrs:true, atributos diretos ficam no objeto,
 * mas elementos como <BasedOn>, <Leading>, <AppliedFont> ficam em Properties
 * como objetos { _: valor, type: "..." }.
 */
function extractStyleProps(raw) {
  const props = raw.Properties || {};

  // Extrai AppliedFont (fonte principal) dos Properties
  let fontFamily = extractPropValue(props.AppliedFont) || extractPropValue(raw.AppliedFont);
  if (fontFamily && (fontFamily.startsWith('$ID/') || fontFamily === '')) fontFamily = null;

  // BasedOn: está SEMPRE em Properties como elemento objeto
  let basedOn = extractPropValue(props.BasedOn) || null;

  // Leading: pode estar em Properties como <Leading type="unit"> ou em atributo direto
  let leading = null;
  const leadingRaw = props.Leading ?? raw.Leading;
  const leadingVal = extractPropValue(leadingRaw);
  if (leadingVal != null && leadingVal !== 'Auto' && leadingVal !== '') {
    const n = Number(leadingVal);
    if (!isNaN(n)) leading = n;
  }

  return {
    self: raw.Self || null,
    basedOn,
    name: raw.Name || null,
    fontFamily,
    fontStyle: raw.FontStyle || extractPropValue(props.FontStyle) || null,
    pointSize: raw.PointSize != null ? Number(raw.PointSize) || null : null,
    leading,
    spaceBefore: raw.SpaceBefore != null ? Number(raw.SpaceBefore) || 0 : 0,
    spaceAfter: raw.SpaceAfter != null ? Number(raw.SpaceAfter) || 0 : 0,
    leftIndent: raw.LeftIndent != null ? Number(raw.LeftIndent) || 0 : 0,
    firstLineIndent: raw.FirstLineIndent != null ? Number(raw.FirstLineIndent) || 0 : 0,
    justification: raw.Justification || extractPropValue(props.Justification) || null,
    tracking: raw.Tracking != null ? Number(raw.Tracking) || 0 : 0,
    capitalization: raw.Capitalization || extractPropValue(props.Capitalization) || null,
    pageBreakBefore: raw.PageBreakBefore || extractPropValue(props.PageBreakBefore) || 'Auto',
    keepLinesTogether: raw.KeepLinesTogether === 'true',
    keepAllLinesTogether: raw.KeepAllLinesTogether === 'true',
    keepWithNext: raw.KeepWithNext != null ? Number(raw.KeepWithNext) || 0 : 0,
    keepFirstLines: raw.KeepFirstLines != null ? Number(raw.KeepFirstLines) || 2 : 2,
    keepLastLines: raw.KeepLastLines != null ? Number(raw.KeepLastLines) || 2 : 2,

    fontColor: (() => {
      const fc = raw.FillColor || extractPropValue(props.FillColor);
      if (!fc || String(fc).startsWith('$ID/') || String(fc).startsWith('Swatch/')) return null;
      return String(fc).replace('Color/', '');
    })(),
  };
}



/**
 * Extrai todos os estilos de um tipo do Styles.xml e cria um mapa por Self.
 * Navega até o Root group (ex: RootParagraphStyleGroup) antes do traversal.
 * @returns {{ list: object[], byId: Map<string, object> }}
 */
function extractStyleType(stylesXml, typeName) {
  const root = stylesXml?.['idPkg:Styles'] || stylesXml;
  if (!root) return { list: [], byId: new Map() };

  // Cada tipo tem um Root group específico
  const rootGroupKey = `Root${typeName}Group`;
  const rootGroup = root[rootGroupKey];
  if (!rootGroup) return { list: [], byId: new Map() };

  const rawList = collectStyles(rootGroup, typeName);
  const list = rawList.map((raw) => {
    const props = extractStyleProps(raw);
    const prefix = raw._prefix || '';
    // Monta nome completo: "Grupo:Subgrupo:Nome"
    const fullName = prefix
      ? `${prefix}:${props.name}`
      : props.name;
    return { ...props, name: fullName || props.name };
  });

  const byId = new Map(list.map((s) => [s.self, s]));
  return { list, byId };
}


/**
 * Resolve a cadeia BasedOn recursivamente, mesclando propriedades.
 * O filho sobrescreve o pai. Campo `resolved` terá todos os valores preenchidos.
 */
function resolveInheritance(style, byId, visited = new Set()) {
  if (!style.basedOn || visited.has(style.self)) return { ...style };
  visited.add(style.self);

  // Normaliza o basedOn para o ID sem prefixo
  const parentId = style.basedOn;
  const parent = byId.get(parentId);
  if (!parent) return { ...style };

  const resolvedParent = resolveInheritance(parent, byId, visited);

  // Mescla: filho tem prioridade sobre o pai RESOLVIDO (não raw)
  // resolvedParent.resolved contém a herança transitiva já aplicada
  const parentResolved = resolvedParent.resolved || resolvedParent;
  const resolved = {};
  const typoPropKeys = [
    'fontFamily', 'fontStyle', 'pointSize', 'leading', 'justification',
    'capitalization', 'tracking', 'fontColor', 
    'pageBreakBefore', 'keepLinesTogether', 'keepAllLinesTogether',
    'keepWithNext', 'keepFirstLines', 'keepLastLines'
  ];
  for (const key of typoPropKeys) {
    resolved[key] = style[key] != null ? style[key] : (parentResolved[key] ?? null);
  }
  // Campos geométricos: não herdar cegamente (0 é valor válido)
  for (const key of ['spaceBefore', 'spaceAfter', 'leftIndent', 'firstLineIndent']) {
    resolved[key] = style[key];
  }


  return { ...style, resolved };
}

// ---------------------------------------------------------------------------
// Extração de Cores (Graphic.xml)
// ---------------------------------------------------------------------------

function extractColors(graphicXml) {
  const colors = [];
  if (!graphicXml) return colors;

  const root = graphicXml['idPkg:Graphic'] || graphicXml;
  const colorNodes = Array.isArray(root.Color) ? root.Color : root.Color ? [root.Color] : [];

  for (const c of colorNodes) {
    // Ignora cores internas ($ID/) escondidas ou sem nome real
    if (!c.Name || c.Name.startsWith('$ID/') || c.Visible === 'false') continue;
    const values = c.ColorValue
      ? c.ColorValue.split(' ').map(Number)
      : [];
    colors.push({
      name: c.Name,
      model: c.Model || 'Process',
      space: c.Space || 'CMYK',
      values,
      visible: c.Visible !== 'false',
      editable: c.ColorEditable !== 'false',
    });
  }

  // Também captura gradientes
  const gradients = [];
  const gradientNodes = Array.isArray(root.Gradient)
    ? root.Gradient
    : root.Gradient ? [root.Gradient] : [];
  for (const g of gradientNodes) {
    if (!g.Name || g.Name.startsWith('$ID/')) continue;
    gradients.push({ name: g.Name, type: g.Type || 'Linear' });
  }

  return { colors, gradients };
}

// ---------------------------------------------------------------------------
// Extração de Fontes (Fonts.xml)
// ---------------------------------------------------------------------------

function extractFonts(fontsXml) {
  const fonts = [];
  if (!fontsXml) return fonts;

  const root = fontsXml['idPkg:Fonts'] || fontsXml;
  const families = Array.isArray(root.FontFamily)
    ? root.FontFamily
    : root.FontFamily ? [root.FontFamily] : [];

  for (const family of families) {
    const familyFonts = Array.isArray(family.Font)
      ? family.Font
      : family.Font ? [family.Font] : [];
    for (const f of familyFonts) {
      fonts.push({
        family: family.Name || f.FontFamily,
        style: f.FontStyleName || f.Name,
        postScriptName: f.PostScriptName,
        status: f.Status || 'Unknown',
        type: f.FontType,
      });
    }
  }

  // Retorna somente as famílias únicas com seu status crítico (Substituted = ausente)
  const familyMap = {};
  for (const f of fonts) {
    if (!familyMap[f.family]) {
      familyMap[f.family] = { family: f.family, status: f.status, styles: [] };
    }
    familyMap[f.family].styles.push({ style: f.style, status: f.status });
  }

  return Object.values(familyMap);
}

// ---------------------------------------------------------------------------
// Extração de Geometria (Preferences.xml + MasterSpreads)
// ---------------------------------------------------------------------------

function extractPageGeometry(prefsXml) {
  const root = prefsXml?.['idPkg:Preferences'] || prefsXml;
  const pagePref = root?.DocumentPreference;
  if (!pagePref) return null;

  return {
    widthPt: Number(pagePref.PageWidth) || null,
    heightPt: Number(pagePref.PageHeight) || null,
    widthCm: ptToCm(Number(pagePref.PageWidth)),
    heightCm: ptToCm(Number(pagePref.PageHeight)),
    pagesPerSpread: Number(pagePref.PagesPerDocument) || 1,
    facingPages: pagePref.FacingPages === 'true',
    intent: pagePref.Intent || 'PrintIntent',
  };
}

function extractMasterSpread(masterXml) {
  const root = masterXml?.['idPkg:MasterSpread']?.MasterSpread;
  if (!root) return null;

  const pages = Array.isArray(root.Page) ? root.Page : root.Page ? [root.Page] : [];
  const result = {
    name: root.Name,
    prefix: root.NamePrefix,
    pages: pages.map((p, i) => {
      const m = p.MarginPreference || {};
      return {
        side: i === 0 ? 'verso' : 'recto',
        columns: Number(m.ColumnCount) || 1,
        columnGutterPt: Number(m.ColumnGutter) || 0,
        marginTopPt: Number(m.Top) || 0,
        marginBottomPt: Number(m.Bottom) || 0,
        marginInsidePt: Number(m.Left) || 0,
        marginOutsidePt: Number(m.Right) || 0,
        // Em cm para uso humano
        marginTopCm: ptToCm(Number(m.Top)),
        marginBottomCm: ptToCm(Number(m.Bottom)),
        marginInsideCm: ptToCm(Number(m.Left)),
        marginOutsideCm: ptToCm(Number(m.Right)),
      };
    }),
  };

  return result;
}

// ---------------------------------------------------------------------------
// Extração de Variáveis e Idiomas (designmap.xml)
// ---------------------------------------------------------------------------

function extractDocumentMeta(designmapXml) {
  const root = designmapXml?.Document || designmapXml;
  if (!root) return { textVariables: [], languages: [] };

  // TextVariables
  const tvNodes = Array.isArray(root.TextVariable)
    ? root.TextVariable
    : root.TextVariable ? [root.TextVariable] : [];
  const textVariables = tvNodes.map((tv) => ({
    name: tv.Name?.replace(/^<\?AID.*?\?>\s*/, '') || tv.Name,
    type: tv.VariableType,
  }));

  // Languages
  const langNodes = Array.isArray(root.Language)
    ? root.Language
    : root.Language ? [root.Language] : [];
  const languages = langNodes
    .filter((l) => !l.Name?.startsWith('$ID/'))
    .map((l) => ({
      name: l.Name?.replace('$ID/', '') || l.Name,
      hyphenationVendor: l.HyphenationVendor,
    }));

  // Color profile
  const colorProfile = {
    cmyk: root.CMYKProfile,
    rgb: root.RGBProfile,
  };

  return { textVariables, languages, colorProfile };
}

// ---------------------------------------------------------------------------
// Função Principal
// ---------------------------------------------------------------------------

/**
 * Extrai TODA a informação relevante do IDML e a persiste em JSON.
 * @param {string} idmlPath - Caminho do .idml
 * @param {string} [outputJsonPath] - Caminho para gravar o JSON (opcional)
 * @returns {Promise<object>} - O objeto TemplateData completo
 */
export async function extractIdml(idmlPath, outputJsonPath = null) {
  console.log(`🔬 idml-extractor: abrindo ${path.basename(idmlPath)}...`);

  // Lê todos os XMLs em paralelo
  const [stylesXml, graphicXml, fontsXml, prefsXml, masterXml, designmapXml] =
    await Promise.all([
      readIdmlXml(idmlPath, 'Resources/Styles.xml'),
      readIdmlXml(idmlPath, 'Resources/Graphic.xml'),
      readIdmlXml(idmlPath, 'Resources/Fonts.xml'),
      readIdmlXml(idmlPath, 'Resources/Preferences.xml'),
      readIdmlXml(idmlPath, 'MasterSpreads/MasterSpread_u11e.xml'),
      readIdmlXml(idmlPath, 'designmap.xml'),
    ]);

  // --- Estilos ---
  const stylesRoot = stylesXml?.['idPkg:Styles'] ? stylesXml : stylesXml;

  const { list: parRaw, byId: parById } = extractStyleType(stylesXml, 'ParagraphStyle');
  const { list: charRaw, byId: charById } = extractStyleType(stylesXml, 'CharacterStyle');
  const { list: objRaw } = extractStyleType(stylesXml, 'ObjectStyle');
  const { list: tableRaw } = extractStyleType(stylesXml, 'TableStyle');
  const { list: cellRaw } = extractStyleType(stylesXml, 'CellStyle');

  // Resolve herança BasedOn
  const paragraphStyles = parRaw.map((s) => resolveInheritance(s, parById));
  const characterStyles = charRaw.map((s) => resolveInheritance(s, charById));

  // --- Cores ---
  const { colors, gradients } = extractColors(graphicXml);

  // --- Fontes ---
  const fonts = extractFonts(fontsXml);

  // --- Geometria ---
  const pageGeometry = extractPageGeometry(prefsXml);
  const masterSpread = extractMasterSpread(masterXml);

  // Margens do master spread (recto — página direita) como referência
  const rectoMargins = masterSpread?.pages?.find((p) => p.side === 'recto');
  const versoMargins = masterSpread?.pages?.find((p) => p.side === 'verso');

  // --- Metadados do documento ---
  const { textVariables, languages, colorProfile } = extractDocumentMeta(designmapXml);

  // --- Montagem do objeto final ---
  const templateData = {
    meta: {
      template: path.basename(idmlPath),
      idmlPath,
      extractedAt: new Date().toISOString(),
      schemaVersion: '1',
    },
    page: pageGeometry ? {
      widthPt: pageGeometry.widthPt,
      heightPt: pageGeometry.heightPt,
      widthCm: pageGeometry.widthCm,
      heightCm: pageGeometry.heightCm,
      facingPages: pageGeometry.facingPages,
      intent: pageGeometry.intent,
    } : null,
    margins: rectoMargins ? {
      recto: rectoMargins,
      verso: versoMargins,
    } : null,
    masterSpread,
    colors,
    gradients,
    fonts,
    textVariables,
    languages,
    colorProfile,
    paragraphStyles,
    characterStyles,
    objectStyles: objRaw,
    tableStyles: tableRaw,
    cellStyles: cellRaw,
  };

  // --- Salvar JSON ---
  if (outputJsonPath) {
    fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
    fs.writeFileSync(outputJsonPath, JSON.stringify(templateData, null, 2), 'utf-8');
    const sizeKb = Math.round(fs.statSync(outputJsonPath).size / 1024);
    console.log(`✅ idml-extractor: JSON gravado (${sizeKb}KB) → ${outputJsonPath}`);
  }

  // Log de resumo
  const missing = fonts.filter((f) => f.status === 'Substituted').map((f) => f.family);
  if (missing.length > 0) {
    console.warn(`⚠️  Fontes ausentes no sistema: ${missing.join(', ')}`);
  }
  console.log(
    `   → ${paragraphStyles.length} estilos de parágrafo, ` +
    `${characterStyles.length} de caractere, ` +
    `${colors.length} cores, ` +
    `${fonts.length} famílias de fonte`
  );

  return templateData;
}
