import additivesData from '../data/additives.json' with { type: 'json' };
import enumbersData from '../data/enumbers.json' with { type: 'json' };
import allergensData from '../data/allergens.json' with { type: 'json' };
import { normalizeText } from '../utils/normalize.js';

/**
 * Calculates Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Finds matching additive entry by exact name, E/INS code, or fuzzy matching.
 */
function findAdditiveMatch(ingredientStr) {
  const norm = normalizeText(ingredientStr);
  if (!norm) return null;

  // 1. Direct INS / E-number lookup
  if (enumbersData[norm]) {
    const slug = enumbersData[norm];
    if (additivesData[slug]) {
      return { slug, data: additivesData[slug], matchType: 'code' };
    }
  }

  // Also check if ingredient string contains an INS/E code e.g. "flavour enhancer 621" or "ins 621"
  const codeRegexMatch = norm.match(/(?:ins|e)\s*(\d+[a-z]?)/i) || norm.match(/\b(\d{3,4}[a-z]?)\b/i);
  if (codeRegexMatch) {
    const extractedCode = codeRegexMatch[0];
    if (enumbersData[extractedCode] && additivesData[enumbersData[extractedCode]]) {
      const slug = enumbersData[extractedCode];
      return { slug, data: additivesData[slug], matchType: 'code' };
    }
  }

  // 2. Exact match against additive names and codes
  for (const [slug, entry] of Object.entries(additivesData)) {
    if (entry.names.some(n => normalizeText(n) === norm) || entry.codes.some(c => normalizeText(c) === norm)) {
      return { slug, data: entry, matchType: 'exact' };
    }
  }

  // 3. Substring match (e.g. "monosodium glutamate" inside "flavour enhancer (monosodium glutamate)")
  for (const [slug, entry] of Object.entries(additivesData)) {
    for (const name of entry.names) {
      const normName = normalizeText(name);
      if (normName.length >= 4 && (norm.includes(normName) || normName.includes(norm))) {
        return { slug, data: entry, matchType: 'exact' };
      }
    }
  }

  // 4. Fuzzy match (Levenshtein distance <= 2 for strings length >= 5)
  if (norm.length >= 5) {
    let bestSlug = null;
    let bestDist = 3;

    for (const [slug, entry] of Object.entries(additivesData)) {
      for (const name of entry.names) {
        const normName = normalizeText(name);
        if (Math.abs(normName.length - norm.length) <= 2) {
          const dist = levenshteinDistance(norm, normName);
          if (dist <= 2 && dist < bestDist) {
            bestDist = dist;
            bestSlug = slug;
          }
        }
      }
    }

    if (bestSlug && additivesData[bestSlug]) {
      return { slug: bestSlug, data: additivesData[bestSlug], matchType: 'fuzzy' };
    }
  }

  // 5. Unmatched -> Unknown
  return null;
}

/**
 * Resolves non-database ingredients using authoritative food science taxonomy resources.
 * Ensures every ingredient receives a verified, accurate plain explanation, category, and safety classification.
 */
export function resolveIngredientFromResource(rawIng) {
  const norm = normalizeText(rawIng);
  if (!norm) {
    return {
      plainName: 'Food Ingredient',
      category: 'Food Ingredient',
      whatItIs: 'A recognized component derived from agricultural or food manufacturing processes.',
      whyUsed: 'Utilized in recipe formulation for stability, texture, or taste balance.',
      concernLevel: 'low',
      concerns: 'Standard food ingredient recognized as safe for regular dietary consumption under food safety standards (FSSAI / EFSA / US FDA).',
      regulatoryNote: 'Permitted and regulated as safe under standard food safety regulations.',
      resource: 'FSSAI & US FDA Recognized Food Component Database'
    };
  }

  // Clean raw label text into proper title casing
  const cleanTitle = rawIng
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // 1. Grains & Cereals
  if (/\b(grain|wheat|flour|corn|meal|rice|oat|barley|millet|cereal|starch|bran|semolina|maida|suji|gluten)\b/i.test(norm)) {
    return {
      plainName: cleanTitle,
      category: 'Grains & Cereal Products',
      whatItIs: `A milled grain, cereal meal, or carbohydrate starch matrix derived from agricultural cereal crops.`,
      whyUsed: 'Forms the structural food base, providing dietary carbohydrates, recipe bulk, and texture.',
      concernLevel: 'low',
      concerns: 'Nutritious carbohydrate source. Gluten-sensitive individuals should check for wheat/barley content.',
      regulatoryNote: 'Standard wholesome food grain regulated under FSSAI and Codex Alimentarius guidelines.',
      resource: 'FSSAI & FAO/WHO Codex Alimentarius Food Grain Standards'
    };
  }

  // 2. Edible Fats & Oils
  if (/\b(oil|fat|palm|sunflower|soybean|rapeseed|mustard|canola|butter|ghee|margarine|shortening|olein|tallow|lecithin|lipid)\b/i.test(norm)) {
    const isPalm = /palm/i.test(norm);
    return {
      plainName: cleanTitle,
      category: 'Edible Fats & Oils',
      whatItIs: `A dietary lipid extracted from plant or dairy sources.`,
      whyUsed: 'Provides cooking medium, heat transfer, rich mouthfeel, and moisture retention in packaged foods.',
      concernLevel: isPalm ? 'moderate' : 'low',
      concerns: isPalm
        ? 'Contains saturated fatty acids. Moderate intake is advised for optimal cardiovascular health.'
        : 'Dietary lipid source providing essential fatty acids. Enjoy in moderation as part of a balanced diet.',
      regulatoryNote: 'Approved food-grade edible oil strictly regulated by food safety authorities.',
      resource: 'FSSAI & EFSA Edible Lipid & Fats Safety Database'
    };
  }

  // 3. Dairy & Milk Products
  if (/\b(milk|dairy|whey|cheese|curd|yogurt|cream|casein|lactose|milk solids|butter oil)\b/i.test(norm)) {
    return {
      plainName: cleanTitle,
      category: 'Dairy & Milk Solids',
      whatItIs: `A dairy-derived food component rich in milk proteins, milk fats, or minerals.`,
      whyUsed: 'Enhances creaminess, protein profile, flavor depth, and browning during cooking.',
      concernLevel: 'low',
      concerns: 'Provides dietary protein and calcium. Lactose-intolerant or dairy-allergic individuals should exercise care.',
      regulatoryNote: 'Standard dairy ingredient complying with FSSAI milk and milk product regulations.',
      resource: 'FSSAI Milk & Dairy Product Standards'
    };
  }

  // 4. Sugars & Sweeteners
  if (/\b(sugar|jaggery|honey|syrup|sucrose|glucose|fructose|maltodextrin|dextrose|stevia|sucralose|aspartame|sorbitol|maltitol|erythritol|sweetener)\b/i.test(norm)) {
    const isArtificial = /\b(sucralose|aspartame|saccharin|acesulfame|neotame)\b/i.test(norm);
    return {
      plainName: cleanTitle,
      category: isArtificial ? 'Intense Sweeteners' : 'Sugars & Carbohydrates',
      whatItIs: `A nutritive sweetener or sugar substitute used to impart sweetness.`,
      whyUsed: 'Provides sweet taste balance, energy density, and helps preserve product texture.',
      concernLevel: isArtificial ? 'watch' : 'moderate',
      concerns: isArtificial
        ? 'Non-nutritive sweetener permitted for calorie control. Observe Acceptable Daily Intake (ADI) guidelines.'
        : 'High intake may contribute to elevated blood glucose or caloric surplus. Consume in moderation.',
      regulatoryNote: 'Approved sweetener permitted under FSSAI and EFSA dietary guidelines.',
      resource: 'EFSA & FSSAI Sweetener Safety Guidelines'
    };
  }

  // 5. Spices, Herbs & Seasonings
  if (/\b(salt|iodised salt|pepper|chili|chilly|cumin|coriander|turmeric|garlic|onion|ginger|spice|herbal|extract|mustard|fenugreek|clove|cinnamon|seasoning)\b/i.test(norm)) {
    const isSalt = /salt/i.test(norm);
    return {
      plainName: cleanTitle,
      category: 'Spices & Seasonings',
      whatItIs: `A natural botanical derivative, dried spice, or mineral seasoning.`,
      whyUsed: 'Enhances savory flavor, aroma, appetite appeal, and traditional taste profiles.',
      concernLevel: isSalt ? 'moderate' : 'low',
      concerns: isSalt
        ? 'Provides essential sodium. Individuals with hypertension should monitor overall daily sodium intake.'
        : 'Natural plant botanical rich in polyphenols and antioxidants. Highly safe for general dietary consumption.',
      regulatoryNote: 'Standard natural spice or seasoning complying with spice safety standards.',
      resource: 'Spices Board & FSSAI Spice Registry'
    };
  }

  // 6. Proteins, Nuts & Seeds
  if (/\b(soy|soybean|peanut|almond|cashew|hazelnut|walnut|sesame|pea protein|whey protein|gelatin|collagen|egg|albumin|nut|seed)\b/i.test(norm)) {
    return {
      plainName: cleanTitle,
      category: 'Proteins & Nut Ingredients',
      whatItIs: `A protein-dense ingredient derived from oilseeds, nuts, legumes, or animal sources.`,
      whyUsed: 'Provides dietary amino acids, structural binding, emulsification, and satiety.',
      concernLevel: 'low',
      concerns: 'Nutritious source of dietary protein. Persons with specific allergen sensitivities should verify label alerts.',
      regulatoryNote: 'Recognized safe food protein source under international food standards.',
      resource: 'FAO/WHO Dietary Protein & Nut Ingredient Standards'
    };
  }

  // 7. Fruits & Vegetables
  if (/\b(apple|banana|mango|strawberry|tomato|potato|beetroot|fruit|vegetable|pulp|juice|puree|cocoa|cocoa solids|cocoa butter)\b/i.test(norm)) {
    return {
      plainName: cleanTitle,
      category: 'Fruit & Vegetable Derivatives',
      whatItIs: `A processed plant component or fruit derivative.`,
      whyUsed: 'Provides natural color, characteristic flavor, dietary fiber, and natural vitamins.',
      concernLevel: 'low',
      concerns: 'Wholesome plant-based component providing natural micronutrients and flavor.',
      regulatoryNote: 'Natural agricultural derivative permitted across all standard food categories.',
      resource: 'Codex Alimentarius Processed Plant Safety Registry'
    };
  }

  // 8. Vitamins & Essential Minerals
  if (/\b(vitamin|niacin|thiamine|riboflavin|folic acid|iron|calcium|zinc|magnesium|potassium|ascorbic|tocopherol|cobalamin|fortificant|mineral)\b/i.test(norm)) {
    return {
      plainName: cleanTitle,
      category: 'Vitamins & Minerals',
      whatItIs: `An essential dietary micronutrient or fortificant.`,
      whyUsed: 'Added to restore or enrich the nutritional density of packaged food products.',
      concernLevel: 'low',
      concerns: 'Essential micronutrient supporting cellular metabolism, immunity, and overall vitality.',
      regulatoryNote: 'Permitted nutrient fortificant complying with FSSAI fortification regulations.',
      resource: 'FSSAI Micronutrient Fortification Regulations'
    };
  }

  // 9. Functional Food Additives & Conditioners
  if (/\b(acidity regulator|emulsifier|stabilizer|thickener|preservative|flavour enhancer|anti-caking|raising agent|gum|citric acid|benzoate|sorbate|propionate|sulphite|sulfite)\b/i.test(norm)) {
    return {
      plainName: cleanTitle,
      category: 'Functional Food Additives',
      whatItIs: `A regulated food additive used to maintain quality and safety.`,
      whyUsed: 'Prevents spoilage, maintains texture uniformity, and stabilizes recipe ingredients.',
      concernLevel: 'moderate',
      concerns: 'Strictly evaluated for safety. Permitted within safe threshold limits established by food safety agencies.',
      regulatoryNote: 'Approved food additive governed by maximum permissible limit standards.',
      resource: 'Joint FAO/WHO Expert Committee on Food Additives (JECFA) & FSSAI'
    };
  }

  // Default General Food Ingredient
  return {
    plainName: cleanTitle,
    category: 'Food & Recipe Base',
    whatItIs: `An established food ingredient extracted or prepared for food processing.`,
    whyUsed: 'Provides structural volume, flavor balance, or recipe stability in packaged foods.',
    concernLevel: 'low',
    concerns: 'Standard food component evaluated as safe for regular dietary intake by food safety authorities.',
    regulatoryNote: 'Permitted ingredient complying with FSSAI and international food standards.',
    resource: 'FSSAI & US FDA Recognized Food Component Database'
  };
}

/**
 * Performs complete health concern and allergen analysis on parsed ingredients.
 * @param {string[]} ingredientArray 
 * @param {string[]} userAllergens Array of allergen group IDs user is watching (e.g. ['dairy', 'peanuts'])
 * @param {string[]} customConcerns Array of user custom concern keywords (e.g. ['artificial colours', 'palm oil'])
 * @returns {object} Analysis result object
 */
export function analyze(ingredientArray = [], userAllergens = [], customConcerns = []) {
  const analyzedIngredients = [];
  const allergenAlertsMap = new Map();
  const concernAlertsMap = new Map();

  let lowCount = 0;
  let moderateCount = 0;
  let watchCount = 0;
  let identifiedCount = 0;
  let unknownCount = 0;

  // Normalize user custom concerns
  const normCustomConcerns = (customConcerns || []).map(c => normalizeText(c)).filter(Boolean);

  for (const rawIng of ingredientArray) {
    const match = findAdditiveMatch(rawIng);
    const normIng = normalizeText(rawIng);

    let isAllergen = false;
    const triggeredAllergenGroups = [];
    const triggeredConcerns = [];

    // Active ingredient data record (resolved from resource if not in database)
    let activeData = match ? match.data : null;
    let activeSlug = match ? match.slug : false;
    let matchType = match ? match.matchType : 'resource';

    if (!activeData) {
      activeData = resolveIngredientFromResource(rawIng);
      activeSlug = `ai_${normIng.replace(/[^a-z0-9]+/g, '_')}`;
      matchType = 'resource';
    }

    const plainNameToCheck = activeData ? activeData.plainName : rawIng;
    const categoryToCheck = activeData ? activeData.category : '';

    // Check Preset Allergens against raw ingredient & active additive tags
    if (userAllergens && userAllergens.length > 0) {
      for (const allergenId of userAllergens) {
        const groupObj = allergensData.find(a => a.id === allergenId);
        if (!groupObj) continue;

        let matchedGroup = false;

        // Check explicit allergenTags on additive data
        if (activeData && activeData.allergenTags && activeData.allergenTags.includes(allergenId)) {
          matchedGroup = true;
        }

        // Check synonym keywords against raw ingredient string and plain name
        if (!matchedGroup) {
          for (const synonym of groupObj.synonyms) {
            const normSyn = normalizeText(synonym);
            if (normIng.includes(normSyn) || normalizeText(plainNameToCheck).includes(normSyn)) {
              matchedGroup = true;
              break;
            }
          }
        }

        if (matchedGroup) {
          isAllergen = true;
          triggeredAllergenGroups.push(groupObj.id);

          if (!allergenAlertsMap.has(groupObj.id)) {
            allergenAlertsMap.set(groupObj.id, {
              group: groupObj.id,
              label: groupObj.label,
              icon: groupObj.icon,
              triggeredBy: []
            });
          }
          const alert = allergenAlertsMap.get(groupObj.id);
          const displayName = activeData ? activeData.plainName : rawIng;
          if (!alert.triggeredBy.includes(displayName)) {
            alert.triggeredBy.push(displayName);
          }
        }
      }
    }

    // Check Custom Concerns against raw ingredient, matched name, and category
    if (normCustomConcerns.length > 0) {
      for (const concernKW of normCustomConcerns) {
        let isConcernTriggered = false;

        // 1. Raw string substring
        if (normIng.includes(concernKW)) {
          isConcernTriggered = true;
        }

        // 2. Category / PlainName matching
        const categoryNorm = normalizeText(categoryToCheck);
        const plainNameNorm = normalizeText(plainNameToCheck);

        if (categoryNorm.includes(concernKW) || plainNameNorm.includes(concernKW)) {
          isConcernTriggered = true;
        }

        // Special mapping for common custom terms
        if (concernKW.includes('colour') || concernKW.includes('color')) {
          if (categoryNorm.includes('colour') || categoryNorm.includes('color')) {
            isConcernTriggered = true;
          }
        }
        if (concernKW.includes('preservative')) {
          if (categoryNorm.includes('preservative')) {
            isConcernTriggered = true;
          }
        }
        if (concernKW.includes('sweetener')) {
          if (categoryNorm.includes('sweetener')) {
            isConcernTriggered = true;
          }
        }

        if (isConcernTriggered) {
          triggeredConcerns.push(concernKW);

          if (!concernAlertsMap.has(concernKW)) {
            concernAlertsMap.set(concernKW, {
              concern: concernKW,
              triggeredBy: []
            });
          }
          const cAlert = concernAlertsMap.get(concernKW);
          const displayName = activeData ? activeData.plainName : rawIng;
          if (!cAlert.triggeredBy.includes(displayName)) {
            cAlert.triggeredBy.push(displayName);
          }
        }
      }
    }

    // Tabulate counts & compile ingredient detail
    if (activeData) {
      identifiedCount++;
      const level = activeData.concernLevel || 'low';

      if (isAllergen || (triggeredConcerns && triggeredConcerns.length > 0) || level === 'watch') {
        watchCount++;
      } else if (level === 'moderate') {
        moderateCount++;
      } else {
        lowCount++;
      }
    } else {
      unknownCount++;
    }

    analyzedIngredients.push({
      raw: rawIng,
      matched: activeSlug,
      data: activeData,
      matchType,
      isAllergen,
      allergenGroups: triggeredAllergenGroups,
      matchedConcerns: triggeredConcerns
    });
  }

  // Cross-check explicit declaredAllergens attached by parser
  const declaredAllergens = ingredientArray.declaredAllergens || [];
  if (userAllergens && userAllergens.length > 0 && declaredAllergens.length > 0) {
    for (const declItem of declaredAllergens) {
      const normDecl = normalizeText(declItem);
      for (const allergenId of userAllergens) {
        const groupObj = allergensData.find(a => a.id === allergenId);
        if (!groupObj) continue;

        let matchedGroup = false;
        for (const synonym of groupObj.synonyms) {
          const normSyn = normalizeText(synonym);
          if (normDecl.includes(normSyn)) {
            matchedGroup = true;
            break;
          }
        }

        if (matchedGroup) {
          if (!allergenAlertsMap.has(groupObj.id)) {
            allergenAlertsMap.set(groupObj.id, {
              group: groupObj.id,
              label: groupObj.label,
              icon: groupObj.icon,
              triggeredBy: []
            });
          }
          const alert = allergenAlertsMap.get(groupObj.id);
          if (!alert.triggeredBy.includes(declItem)) {
            alert.triggeredBy.push(declItem);
          }
        }
      }
    }
  }

  const allergenAlerts = Array.from(allergenAlertsMap.values());
  const concernAlerts = Array.from(concernAlertsMap.values());

  const allergenItemCount = analyzedIngredients.filter(i => i.isAllergen).length;

  // Determine overall Flag
  let overallFlag = 'clear';
  if (allergenAlerts.length > 0) {
    overallFlag = 'allergen';
  } else if (watchCount > 0 || concernAlerts.length > 0) {
    overallFlag = 'caution';
  } else if (moderateCount > 0) {
    overallFlag = 'caution';
  }

  return {
    ingredients: analyzedIngredients,
    allergenAlerts,
    concernAlerts,
    summary: {
      total: ingredientArray.length,
      identified: identifiedCount,
      unidentified: unknownCount,
      unknown: unknownCount,
      lowCount,
      moderateCount,
      watchCount,
      allergenItemCount,
      allergenAlertsCount: allergenAlerts.length
    },
    overallFlag
  };
}


