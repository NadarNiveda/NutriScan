import { normalizeText } from '../utils/normalize.js';

/**
 * Evaluates edibility & safety status across 4 age groups based on scanned ingredient analysis.
 * @param {object} analysis Scanned analysis object containing ingredients, allergenAlerts, concernAlerts
 * @returns {object} Age group edibility matrix assessment
 */
export function evaluateAgeGroupEdibility(analysis = {}) {
  const ingredients = analysis.ingredients || [];
  const allergenAlerts = analysis.allergenAlerts || [];

  const hasAllergens = allergenAlerts.length > 0;

  // Key ingredient flags
  const hasFlavorEnhancers = ingredients.some(i => {
    const raw = (i.raw || '').toLowerCase();
    const cat = (i.data?.category || '').toLowerCase();
    return raw.includes('627') || raw.includes('631') || raw.includes('621') || cat.includes('flavour enhancer') || cat.includes('flavor enhancer');
  });

  const hasHighSodium = ingredients.some(i => {
    const raw = (i.raw || '').toLowerCase();
    return raw.includes('salt') || raw.includes('sodium') || raw.includes('potassium chloride');
  });

  const hasPalmOil = ingredients.some(i => {
    const raw = (i.raw || '').toLowerCase();
    return raw.includes('palm') || raw.includes('palmolein');
  });

  const hasAddedSugar = ingredients.some(i => {
    const raw = (i.raw || '').toLowerCase();
    const cat = (i.data?.category || '').toLowerCase();
    return raw.includes('sugar') || raw.includes('syrup') || cat.includes('sweetener');
  });

  const hasArtificialColors = ingredients.some(i => {
    const cat = (i.data?.category || '').toLowerCase();
    return cat.includes('colour') || cat.includes('color') || cat.includes('synthetic');
  });

  const watchCount = ingredients.filter(i => i.data?.concernLevel === 'watch' || i.isAllergen).length;
  const modCount = ingredients.filter(i => i.data?.concernLevel === 'moderate').length;

  // 1. Infants & Toddlers (0-3 Yrs)
  let toddlerStatus = 'safe';
  const toddlerReasons = [];

  if (hasAllergens) {
    toddlerStatus = 'unsafe';
    toddlerReasons.push('Contains triggered dietary allergens.');
  }
  if (hasFlavorEnhancers || hasArtificialColors) {
    toddlerStatus = 'unsafe';
    toddlerReasons.push('Contains synthetic flavor enhancers (INS 627/631) or dyes unsuitable for developing digestive systems.');
  }
  if (hasHighSodium || hasAddedSugar) {
    if (toddlerStatus !== 'unsafe') toddlerStatus = 'unsafe';
    toddlerReasons.push('Contains added sodium/sugar exceeding recommended daily limits for infants.');
  }
  if (hasPalmOil && toddlerStatus !== 'unsafe') {
    toddlerStatus = 'caution';
    toddlerReasons.push('Contains saturated palm olein fat.');
  }
  if (toddlerReasons.length === 0) {
    toddlerReasons.push('Simple, clean ingredient profile suitable for early childhood nutrition.');
  }

  // 2. Children & Kids (4-12 Yrs)
  let kidsStatus = 'safe';
  const kidsReasons = [];

  if (hasAllergens) {
    kidsStatus = 'unsafe';
    kidsReasons.push('Contains user-flagged allergens.');
  } else if (hasFlavorEnhancers || hasArtificialColors || (hasAddedSugar && hasPalmOil)) {
    kidsStatus = 'caution';
    kidsReasons.push('Ultra-processed formulation with flavor enhancers (INS 627/631) and saturated fats; limit intake frequency.');
  } else if (watchCount > 0 || modCount >= 3) {
    kidsStatus = 'caution';
    kidsReasons.push('Contains multiple processed food additives; consume in moderation.');
  } else {
    kidsReasons.push('Acceptable ingredient profile for growing children within balanced meal plans.');
  }

  // 3. Adults (13-64 Yrs)
  let adultStatus = 'safe';
  const adultReasons = [];

  if (hasAllergens) {
    adultStatus = 'unsafe';
    adultReasons.push('Triggers user allergen warnings.');
  } else if (watchCount > 0 || modCount >= 4 || (hasPalmOil && hasHighSodium)) {
    adultStatus = 'caution';
    adultReasons.push('Contains moderate-concern additives (Palm Olein, INS 627/631, high sodium); consume mindfully.');
  } else {
    adultReasons.push('Standard food formulation generally safe for general adult consumption.');
  }

  // 4. Seniors & Elderly (65+ Yrs)
  let seniorStatus = 'safe';
  const seniorReasons = [];

  if (hasAllergens) {
    seniorStatus = 'unsafe';
    seniorReasons.push('Triggers user allergen warnings.');
  }
  if (hasHighSodium || ingredients.some(i => (i.raw || '').toLowerCase().includes('potassium chloride'))) {
    if (seniorStatus !== 'unsafe') seniorStatus = 'caution';
    seniorReasons.push('Contains elevated sodium/potassium mineral salts; monitor if managing blood pressure or renal health.');
  }
  if (hasPalmOil || modCount >= 3) {
    if (seniorStatus !== 'unsafe') seniorStatus = 'caution';
    seniorReasons.push('Saturated lipid profile (Palm Olein) and processed acidifiers may impact digestive comfort.');
  }
  if (seniorReasons.length === 0) {
    seniorReasons.push('Clean nutrient profile suitable for senior dietary guidelines.');
  }

  // Overall Edibility Summary Verdict
  let overallVerdict = 'SAFE FOR GENERAL CONSUMPTION';
  let overallBadgeColor = 'emerald';
  let overallSummaryText = 'This product has a clean ingredient composition and is generally suitable for standard adult dietary consumption.';

  if (hasAllergens) {
    overallVerdict = 'ALLERGEN RISK — NOT RECOMMENDED';
    overallBadgeColor = 'red';
    overallSummaryText = `Triggered allergen warnings for ${allergenAlerts.map(a => a.label).join(', ')}. Not recommended if sensitive or allergic.`;
  } else if (toddlerStatus === 'unsafe' || toddlerStatus === 'not_recommended' || kidsStatus === 'caution' || adultStatus === 'caution') {
    overallVerdict = 'CAUTION / CONSUME IN MODERATION';
    overallBadgeColor = 'amber';
    overallSummaryText = `Not recommended for infants and toddlers (0–3 yrs) due to processed food additives or elevated sodium/fat levels. Permitted for adults in controlled portions.`;
  }

  return {
    overallVerdict,
    overallBadgeColor,
    overallSummaryText,
    groups: [
      {
        id: 'infants',
        title: 'Infants & Toddlers',
        age: '0 – 3 Years',
        icon: '👶',
        status: toddlerStatus,
        reasons: toddlerReasons
      },
      {
        id: 'kids',
        title: 'Children & Kids',
        age: '4 – 12 Years',
        icon: '👧',
        status: kidsStatus,
        reasons: kidsReasons
      },
      {
        id: 'adults',
        title: 'Adolescents & Adults',
        age: '13 – 64 Years',
        icon: '🧑',
        status: adultStatus,
        reasons: adultReasons
      },
      {
        id: 'seniors',
        title: 'Seniors & Elderly',
        age: '65+ Years',
        icon: '👵',
        status: seniorStatus,
        reasons: seniorReasons
      }
    ]
  };
}
