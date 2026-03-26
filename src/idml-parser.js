/**
 * SCRIPT: idml-parser.js
 * DESCRIÇÃO: Camada de compatibilidade — delega para idml-extractor.js (extração
 *            completa com resolução de herança BasedOn, cores, fontes, etc.).
 *            Mantém o contrato público original para não quebrar chamadores.
 * CHAMADO POR: robo-render.js, style-mapper.js (via robo-render)
 * CONTRATO:
 *   - INPUT: caminho para arquivo .idml
 *   - OUTPUT: { paragraphStyles, characterStyles, pageGeometry, _templateData }
 *             _templateData contém o objeto completo extraído pelo extractor
 */

import fs from 'fs';
import path from 'path';
import { extractIdml } from './idml-extractor.js';

// ---------------------------------------------------------------------------
// Conversão formato extractor → formato legado (compatibilidade style-mapper)
// ---------------------------------------------------------------------------

/**
 * Converte as propriedades tipográficas do formato do extractor
 * para o formato legado esperado pelo style-mapper.js.
 * Usa `resolved` quando disponível (com herança BasedOn aplicada).
 */
function toLegacyStyle(s) {
  const r = s.resolved || s; // usa o resolved (com herança) quando disponível
  return {
    name: s.name,
    self: s.self,
    pointSize: r.pointSize ?? null,
    leading: r.leading ?? null,
    spaceBefore: r.spaceBefore ?? 0,
    spaceAfter: r.spaceAfter ?? 0,
    leftIndent: r.leftIndent ?? 0,
    firstLineIndent: r.firstLineIndent ?? 0,
    justification: r.justification ?? null,
    fontFamily: r.fontFamily ?? null,
    fontStyle: r.fontStyle ?? null,
  };
}

// ---------------------------------------------------------------------------
// Função principal exportada (compatibilidade com style-mapper existente)
// ---------------------------------------------------------------------------

/**
 * Extrai estilos e geometria de página de um arquivo .idml.
 * Internamente usa o idml-extractor para extração completa com BasedOn resolvido.
 * Usa cache JSON automático: se `<idml>.json` for mais novo que o .idml, usa o cache.
 *
 * @param {string} idmlPath - Caminho absoluto para o .idml
 * @returns {Promise<{
 *   paragraphStyles: object[],
 *   characterStyles: object[],
 *   pageGeometry: object,
 *   _templateData: object
 * }>}
 */
export async function parseIdml(idmlPath) {
  if (!fs.existsSync(idmlPath)) {
    throw new Error(`❌ idml-parser: arquivo não encontrado: ${idmlPath}`);
  }

  // Verifica cache JSON: usa se existir e for mais novo que o .idml
  const jsonPath = idmlPath + '.json';
  let templateData = null;

  if (fs.existsSync(jsonPath)) {
    const jsonMtime = fs.statSync(jsonPath).mtimeMs;
    const idmlMtime = fs.statSync(idmlPath).mtimeMs;
    if (jsonMtime > idmlMtime) {
      console.log(`📦 idml-parser: usando cache (${path.basename(jsonPath)})`);
      templateData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
  }

  // Sem cache: extrai do IDML e grava JSON
  if (!templateData) {
    templateData = await extractIdml(idmlPath, jsonPath);
  }

  // --- Adapta geometria de página para formato legado ---
  const p = templateData.page;
  const recto = templateData.margins?.recto;

  const pageGeometry = {
    pageWidth: p?.widthPt ?? null,
    pageHeight: p?.heightPt ?? null,
    marginTop: recto?.marginTopPt ?? null,
    marginBottom: recto?.marginBottomPt ?? null,
    marginLeft: recto?.marginInsidePt ?? null,
    marginRight: recto?.marginOutsidePt ?? null,
  };

  // --- Estilos usando `resolved` (herança BasedOn aplicada) ---
  const paragraphStyles = templateData.paragraphStyles.map(toLegacyStyle);
  const characterStyles = templateData.characterStyles.map(toLegacyStyle);

  return {
    paragraphStyles,
    characterStyles,
    pageGeometry,
    _templateData: templateData, // dados completos acessíveis se necessário
  };
}
