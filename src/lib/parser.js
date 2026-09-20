import { fixCommonOcrErrors, normalizeText } from '../utils/normalize.js';

/**
 * Boundary markers indicating the end of the ingredients list, used as an
 * early safety net for labels that run straight into nutrition/FSSAI text
 * without a clean sentence break.
 */
const BOUNDARY_MARKERS = [
  'nutrition information',
  'nutritional facts',
  'nutrition facts',
  'nutrient',
  'fssai',
  'mkt. lic. no.',
  'lic. no.',
  'license no.',
  'lic no',
  'mfg by',
  'manufactured by',
  'best before',
  'net wt',
  'net weight',
  'store in a cool',
  'store in cool',
  'per 100g',
  'per 100 g',
  'batch no'
];

/**
 * Functional/category terms commonly used on Indian FSSAI labels to group
 * several specific substances under one umbrella name, e.g.
 * "Flavour Enhancers (627, 631)" or "Seasoning (Sugar, Iodised Salt, ...)".
 * When one of these appears as an outer name with inner parenthetical
 * content, the outer name is discarded and the inner items become the
 * real ingredients. Matched case-insensitively, trimmed, singular/plural
 * variants included.
 */
const GENERIC_CATEGORY_TERMS = new Set([
  'cereal products', 'edible vegetable oil', 'edible fats & oils', 'edible fats and oils',
  'seasoning', 'seasonings', 'spices and condiments', 'spices & condiments',
  'flavour', 'flavor', 'flavours', 'flavors',
  'flavour enhancer', 'flavour enhancers', 'flavor enhancer', 'flavor enhancers',
  'flavouring agent', 'flavouring agents', 'flavoring agent', 'flavoring agents',
  'flavouring substances', 'flavoring substances',
  'natural and nature identical flavouring substances',
  'natural and nature identical flavoring substances',
  'acidity regulator', 'acidity regulators',
  'emulsifying & stabilising agent', 'emulsifying and stabilising agent',
  'emulsifying & stabilizing agent', 'emulsifying and stabilizing agent',
  'emulsifying stabilising agent', 'emulsifying stabilizing agent',
  'emulsifier', 'emulsifiers', 'stabiliser', 'stabilisers', 'stabilizer', 'stabilizers',
  'salt replacer', 'anti-caking agent', 'anti caking agent', 'anticaking agent',
  'preservative', 'preservatives', 'raising agent', 'raising agents',
  'colour', 'colours', 'color', 'colors', 'synthetic colour', 'synthetic colours',
  'sweetener', 'sweeteners', 'thickener', 'thickeners', 'humectant', 'humectants',
  'antioxidant', 'antioxidants', 'firming agent', 'firming agents',
  'gelling agent', 'gelling agents', 'vegetable fat', 'fat & oil', 'fat and oil'
]);

/** Compact Levenshtein distance for fuzzy header detection. */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Strips an "INGREDIENTS:" (or similarly OCR-garbled) header from the start
 * of the text using fuzzy matching, instead of an ever-growing list of
 * hardcoded typo patterns.
 */
function stripHeaderFuzzy(text) {
  let t = text;

  // Fast path: common known typo patterns (cheap, catches the obvious cases first)
  t = t
    .replace(/\bIN\s*GRED\s*IENTS\b\s*[:\-]?/i, '')
    .replace(/\bIN\s*EDIENTS\b\s*[:\-]?/i, '')
    .replace(/\bINGREDI\s*ENTS\b\s*[:\-]?/i, '')
    .replace(/^\s*[:\-]+\s*/, '');

  // Fuzzy path: look at the first colon within the first ~30 chars and
  // check whether the text before it is a mangled version of "INGREDIENTS"
  const earlyColonIdx = t.slice(0, 30).indexOf(':');
  if (earlyColonIdx !== -1) {
    const candidate = t.slice(0, earlyColonIdx).replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (candidate.length >= 4) {
      const dist = levenshtein(candidate, 'INGREDIENTS');
      const distComposition = levenshtein(candidate, 'COMPOSITION');
      if (dist <= 4 || distComposition <= 4) {
        t = t.slice(earlyColonIdx + 1);
      }
    }
  }

  return t.replace(/^\s+/, '');
}

/**
 * Splits text at bracket-depth-0 boundaries. Supports both () and [] brackets
 * and multiple delimiter characters like ',' and ';'.
 * @param {string} str
 * @param {string[]} delimiters delimiters to split on, e.g. [',', ';']
 * @returns {string[]} segments, delimiter removed
 */
function splitAtDepthZero(str, delimiters = [',', ';']) {
  const segments = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);

    if (delimiters.includes(ch) && depth === 0) {
      segments.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  segments.push(current);
  return segments;
}

/**
 * Extracts explicit allergen declarations from trailing/footnote text,
 * e.g. "ALLERGEN ADVICE: Contains Soy, Milk, Wheat" or "May contain nuts".
 */
function extractDeclaredAllergens(trailingText) {
  if (!trailingText) return [];
  const match = trailingText.match(
    /(?:allergen\s*advice|allergen\s*information|allergen\s*declaration|may\s*contain)\s*[:\-]?\s*(?:contains?\s*)?([^.\n;]+)/i
  );
  if (!match || !match[1]) return [];

  return match[1]
    .split(/[,;&]/)
    .map(item => item.replace(/[^a-zA-Z\s]/g, '').trim())
    .filter(item => item.length > 1 && item.length < 50);
}

/**
 * Converts a bare numeric/code token like "627", "170(i)", "331(iii)" into
 * "INS <code>" form. Returns null if it doesn't look like a bare code.
 */
function toInsCodeIfBare(token) {
  const trimmed = token.trim();
  if (/^\d{2,4}[a-z]?(\([ivx]+\))?$/i.test(trimmed)) {
    return `INS ${trimmed}`;
  }
  return null;
}

const isPurePercent = (s) => /^\d+(\.\d+)?\s*%$/.test(s.trim());
const isBareCode = (s) => /^\d{2,4}[a-z]?(\([ivx]+\))?$/i.test(s.trim());

/**
 * Recursively resolves one top-level chunk (e.g. "Flavour Enhancers (627, 631)"
 * or "Seasoning [Sugar, Salt...]" or "Calcium Carbonate (170(i))")
 * into a flat array of real ingredient strings.
 */
function resolveChunk(chunk) {
  const trimmed = chunk.trim();
  if (!trimmed) return [];

  // Normalize square brackets [ ] to ( ) for uniform parsing
  const normalizedChunk = trimmed.replace(/\[/g, '(').replace(/\]/g, ')');

  // Find the first top-level '(' to split name from parenthetical group(s)
  let depth = 0;
  let firstParenIdx = -1;
  for (let i = 0; i < normalizedChunk.length; i++) {
    if (normalizedChunk[i] === '(') {
      if (depth === 0) { firstParenIdx = i; break; }
      depth++;
    } else if (normalizedChunk[i] === ')') {
      depth = Math.max(0, depth - 1);
    }
  }

  if (firstParenIdx === -1) {
    // No parens at all — leaf value
    const cleanLeaf = trimmed.replace(/^[*~•+\-\s]+/, '');
    const bare = toInsCodeIfBare(cleanLeaf);
    return [bare || cleanLeaf];
  }

  const itemName = normalizedChunk.slice(0, firstParenIdx).trim();

  // Extract ALL top-level paren groups that follow (handles "Name (P1) (P2)")
  const groups = [];
  let i = firstParenIdx;
  while (i < normalizedChunk.length) {
    if (normalizedChunk[i] === '(') {
      let d = 1;
      let j = i + 1;
      while (j < normalizedChunk.length && d > 0) {
        if (normalizedChunk[j] === '(') d++;
        else if (normalizedChunk[j] === ')') d--;
        j++;
      }
      groups.push(normalizedChunk.slice(i + 1, j - 1));
      i = j;
      while (normalizedChunk[i] === ' ') i++;
    } else {
      break;
    }
  }

  const contentGroups = groups.filter(g => !isPurePercent(g) && g.trim().length > 0);

  if (contentGroups.length === 0) {
    // Only percentage groups (or empty) — just the name itself
    const cleanName = itemName.replace(/^[*~•+\-\s]+/, '');
    const bare = toInsCodeIfBare(cleanName);
    return cleanName ? [bare || cleanName] : [];
  }

  // Combine all content groups and split at their own top level
  const combinedInner = contentGroups.join(', ');
  const subChunks = splitAtDepthZero(combinedInner, [',', ';']).map(s => s.trim()).filter(Boolean);
  const resolvedSubItems = subChunks.flatMap(resolveChunk);

  const cleanItemName = itemName.replace(/^[*~•+\-\s]+/, '');
  const nameKey = cleanItemName.toLowerCase().replace(/\s+/g, ' ').trim();
  const isGeneric = GENERIC_CATEGORY_TERMS.has(nameKey);

  if (isGeneric) {
    // Outer is just an umbrella term — the inner items are the real ingredients
    return resolvedSubItems;
  }

  // Outer is a specific named ingredient. If every resolved sub-item is a
  // bare code, it's just an identifier for the SAME substance — merge into
  // one entry. Otherwise, the inner content is a more specific name than
  // the outer — prefer the inner, drop the outer.
  const allBareCodes = subChunks.every(isBareCode);
  if (allBareCodes && cleanItemName) {
    const codes = subChunks.map(c => c.trim()).join(', ');
    return [`${cleanItemName} (INS ${codes})`];
  }

  return resolvedSubItems.length > 0 ? resolvedSubItems : [cleanItemName];
}

/**
 * Removes percentage values, extra symbols, and trims whitespace from
 * ingredient strings for final display.
 */
function cleanIngredientName(str) {
  if (!str) return '';
  return str
    .replace(/\(\s*\d+(\.\d+)?\s*%\s*\)/g, '')
    .replace(/\b\d+(\.\d+)?\s*%/g, '')
    .replace(/^[\s.*\-•+~]+/, '')
    .replace(/[\s.*\-•+~]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses raw ingredient label text into a clean list of individual
 * ingredient strings.
 * @param {string} rawText
 * @returns {string[]}
 */
export function parseIngredients(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Step 1: Preprocess OCR typos & misreadings
  let text = fixCommonOcrErrors(rawText);
  text = text
    .replace(/\bCom\s*Meal\b/gi, 'Corn Meal')
    .replace(/\bGeer\s*eal\b/gi, 'Cereal')
    .replace(/\blodisediSals\b/gi, 'Iodized Salt')
    .replace(/\blodised\b/gi, 'Iodized')
    .replace(/\bsak\s*replaces\b/gi, 'Salt Replacer')
    .replace(/\bHavouring\b/gi, 'Flavouring');

  // Step 2: Strip the "INGREDIENTS:" header (fuzzy, handles OCR garbling)
  text = stripHeaderFuzzy(text);

  // Step 3: Early safety-net truncation at nutrition/FSSAI boundary markers
  const lowerText = text.toLowerCase();
  let earliestBoundaryIndex = text.length;
  for (const marker of BOUNDARY_MARKERS) {
    const idx = lowerText.indexOf(marker);
    if (idx !== -1 && idx < earliestBoundaryIndex) earliestBoundaryIndex = idx;
  }
  if (earliestBoundaryIndex < text.length) {
    text = text.substring(0, earliestBoundaryIndex);
  }

  // Step 4: Extract explicit allergen advice section if present
  let ingredientsSection = text;
  let trailingSection = '';
  const allergenMatch = text.match(/ALLERGEN\s*ADVICE\s*[:\-]?\s*(.*)/i);
  if (allergenMatch) {
    ingredientsSection = text.slice(0, allergenMatch.index);
    trailingSection = allergenMatch[0];
  }

  const explicitAllergens = extractDeclaredAllergens(trailingSection || text);

  // Step 5: Replace periods that separate items (not decimal numbers like 0.6%) with commas
  ingredientsSection = ingredientsSection.replace(/(\D)\.(?=\s+[A-Z0-9])/g, '$1,');

  // Step 6: Recursively resolve the ingredients section into a flat list
  const topLevelChunks = splitAtDepthZero(ingredientsSection, [',', ';'])
    .map(s => s.trim())
    .filter(Boolean);
  let resolved = topLevelChunks.flatMap(resolveChunk);

  // Step 7: Clean, then apply safety-net filters
  const ingredients = [];
  for (const raw of resolved) {
    const cleaned = cleanIngredientName(raw);
    if (!cleaned || cleaned.length <= 1) continue;

    if (/^(ingredients|composition|contains|allergen advice|in edients)$/i.test(cleaned)) continue;

    if (cleaned.length > 120) {
      console.warn(`[NutriScan Parser] Discarding oversized segment (${cleaned.length} chars): "${cleaned.slice(0, 50)}..."`);
      continue;
    }

    const hasLongDigitSeq = /\b\d{6,}\b/.test(cleaned);
    const isLegitInsOrE = /^(ins|e)\s*\d+/i.test(cleaned);
    if (hasLongDigitSeq && !isLegitInsOrE) {
      console.warn(`[NutriScan Parser] Discarding segment with 6+ consecutive digits: "${cleaned}"`);
      continue;
    }

    ingredients.push(cleaned);
  }

  // Step 8: Deduplicate and return, keeping explicitAllergens available
  // separately for analyzer.js to cross-check — NOT merged into the
  // ingredient list itself.
  const seen = new Set();
  const result = [];
  for (const ing of ingredients) {
    const norm = normalizeText(ing);
    if (norm && norm.length > 1 && !seen.has(norm)) {
      seen.add(norm);
      result.push(ing);
    }
  }

  result.declaredAllergens = explicitAllergens;
  return result;
}