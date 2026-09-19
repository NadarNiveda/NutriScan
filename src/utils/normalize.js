import additivesData from '../data/additives.json' with { type: 'json' };

/**
 * Normalizes input text by lowercasing, stripping diacritics, and collapsing whitespace.
 * @param {string} str 
 * @returns {string}
 */
export function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if the scanned text is a Nutrition Values / Calories Table (e.g. Energy 377 kcal, Protein 11g, Carbohydrates, RDA)
 * rather than an Ingredients List (e.g. Wheat Flour, Palm Oil, INS 621).
 * @param {string} str 
 * @returns {boolean}
 */
export function detectNutritionTable(str) {
  if (!str) return false;
  const norm = str.toLowerCase();

  const nutrientKeywords = [
    'kcal', 'macronutrients', 'carbohydrate', 'protein', 'total sugars',
    'added sugar', 'saturated fat', 'trans fat', 'cholesterol', 'sodium',
    'vitamin a', 'vitamin b', 'vitamin c', 'vitamin d', 'calcium',
    'magnesium', 'phosphorus', 'potassium', 'iron', 'iodine', 'zinc',
    'recommended dietary allowance', 'rda', 'serving size', 'nutrients per 100',
    'approx. no. of serves', 'benefits'
  ];

  let matches = 0;
  for (const kw of nutrientKeywords) {
    if (norm.includes(kw)) {
      matches++;
    }
  }

  return matches >= 2;
}

/**
 * Smart Extractor: Scans garbled OCR text for recognized E-numbers, INS codes, and known ingredient names.
 * @param {string} str 
 * @returns {string[]} Array of extracted valid ingredient strings
 */
export function extractKnownIngredients(str) {
  if (!str) return [];

  const normText = normalizeText(str);
  const found = new Set();

  // 1. Extract INS / E codes (e.g., INS 621, E211, 627, 631, 102, 330, 500)
  const codeMatches = normText.match(/(?:ins|e)?\s*\d{3,4}[a-z]?\b/g);
  if (codeMatches) {
    for (const code of codeMatches) {
      const cleanCode = code.replace(/\s+/g, ' ').trim();
      if (cleanCode.length >= 3) {
        found.add(cleanCode.toUpperCase());
      }
    }
  }

  // 2. Extract database additive plain names and synonyms
  for (const [slug, entry] of Object.entries(additivesData)) {
    for (const name of entry.names) {
      const normName = normalizeText(name);
      if (normName.length >= 4 && normText.includes(normName)) {
        found.add(entry.plainName);
      }
    }
  }

  return Array.from(found);
}

/**
 * Strips out random OCR noise characters, symbols (@, ©, §, {, }, [, ]), and gibberish tokens from garbled packaging scans.
 * @param {string} str 
 * @returns {string}
 */
export function cleanOcrNoise(str) {
  if (!str) return '';

  let cleaned = str
    .replace(/[@©®™§{}~\[\]\\^|/`_=+<>]/g, ' ')
    .replace(/-{2,}/g, ' ')
    .replace(/\.{2,}/g, ' ');

  const tokens = cleaned.split(/\s+/);

  const validTokens = tokens.filter(token => {
    const trimmed = token.replace(/[^a-zA-Z0-9%]/g, '');
    if (!trimmed) return false;

    if (/^\d+%?$/.test(trimmed)) return true;
    if (/^(ins|e\d{3}|e)$/i.test(trimmed)) return true;
    if (trimmed.length === 1 && !/^[aA]$/.test(trimmed)) return false;
    if (trimmed.length === 2 && !/[aeiouyAEIOUY]/i.test(trimmed)) return false;

    return true;
  });

  return validTokens.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Carefully fixes common OCR misreadings without corrupting INS / E codes or numeric percentages.
 * @param {string} str 
 * @returns {string}
 */
export function fixCommonOcrErrors(str) {
  if (!str) return '';

  let text = cleanOcrNoise(str);
  text = text.replace(/\|/g, 'l');
  text = text.replace(/([a-zA-Z])rn([a-zA-Z\s,.]|$)/g, '$1m$2');

  const tokens = text.split(/(\s+|[(),:;.])/);

  const processed = tokens.map(token => {
    if (/^(ins|e)?\s*\d+[a-z]?%?$/i.test(token.trim())) {
      return token;
    }

    let word = token;
    if (/[a-zA-Z]/.test(word) && /0/.test(word)) {
      word = word.replace(/0/g, 'o');
    }
    if (/[a-zA-Z]/.test(word) && /1/.test(word) && !/^(e|ins)1/i.test(word)) {
      word = word.replace(/1/g, 'l');
    }
    if (/^5[a-zA-Z]/.test(word)) {
      word = word.replace(/^5/, 's');
    }

    return word;
  });

  return processed.join('');
}

/**
 * Evaluates OCR or user-provided text for image quality issues:
 * 1. Blurry / Unreadable text (too short, garbage character ratio, low density)
 * 2. Non-ingredient image text (photos of cars, faces, pets, landscapes lacking food/ingredient terms)
 * @param {string} rawText
 * @returns {{ isBlurry: boolean, isNotIngredient: boolean, reason: string | null }}
 */
export function validateIngredientText(rawText) {
  if (!rawText || !rawText.trim()) {
    return {
      isBlurry: true,
      isNotIngredient: false,
      reason: 'No text extracted. The image appears blurry, dark, or unreadable. Please retake or upload a clearer photo.'
    };
  }

  const norm = normalizeText(rawText);

  // 1. Check for Blurry / Short / Garbled Text
  if (norm.length < 15) {
    return {
      isBlurry: true,
      isNotIngredient: false,
      reason: 'The scanned text is too short or blurry. Please retake or upload a clearer, well-lit photo.'
    };
  }

  // Check garbage symbol ratio
  const nonWordCharCount = (rawText.match(/[^a-zA-Z0-9\s(),.-]/g) || []).length;
  if (nonWordCharCount / rawText.length > 0.4) {
    return {
      isBlurry: true,
      isNotIngredient: false,
      reason: 'High OCR noise detected. The image appears blurry or out of focus. Please upload a clearer photo.'
    };
  }

  // 2. Check for Food / Ingredient List Terms
  const foodTerms = [
    'ingredient', 'ingredients', 'contains', 'flour', 'sugar', 'salt', 'oil',
    'water', 'acid', 'flavour', 'flavor', 'ins', 'e-', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6',
    'milk', 'wheat', 'extract', 'natural', 'powder', 'starch', 'emulsifier',
    'preservative', 'syrup', 'fat', 'spice', 'spices', 'masala', 'lecithin', 'sodium',
    'protein', 'calcium', 'cocoa', 'gum', 'yeast', 'butter', 'ghee', 'corn', 'rice',
    'meal', 'dextrose', 'fructose', 'maltodextrin', 'color', 'colour', 'agent', 'regulator',
    'acidifier', 'solid', 'solids', 'palm', 'palmolein', 'herb', 'seasoning', 'curd',
    'cheese', 'whey', 'casein', 'oat', 'barley', 'soy', 'soya', 'peanut', 'almond',
    'hazelnut', 'cashew', 'citric', 'benzoate', 'sorbate', 'glutamate', 'guanylate', 'inosinate'
  ];

  let foodMatches = 0;
  for (const term of foodTerms) {
    if (norm.includes(term)) {
      foodMatches++;
    }
  }

  // Also check if text has comma-separated list of items (e.g. "item1, item2, item3")
  const commaSeparatedItems = rawText.split(',').map(s => s.trim()).filter(s => s.length > 2);

  if (foodMatches === 0 && commaSeparatedItems.length < 3) {
    return {
      isBlurry: false,
      isNotIngredient: true,
      reason: 'This image does not appear to contain a food ingredients panel. Please capture or upload a photo showing the package INGREDIENTS list.'
    };
  }

  return {
    isBlurry: false,
    isNotIngredient: false,
    reason: null
  };
}

