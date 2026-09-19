import { normalizeText } from '../utils/normalize';

/**
 * Searches Open Food Facts for alternative products in the same category that do not contain flagged ingredients.
 * @param {object} scannedProduct Product object with category/categoriesTags
 * @param {string[]} flaggedIngredientNames Array of ingredient names user is avoiding
 * @returns {Promise<Array<{name: string, brand: string, image: string}>>}
 */
export async function findAlternatives(scannedProduct, flaggedIngredientNames = []) {
  if (!scannedProduct || !scannedProduct.categoriesTags || !scannedProduct.categoriesTags.length) {
    return [];
  }

  if (!flaggedIngredientNames || flaggedIngredientNames.length === 0) {
    return [];
  }

  try {
    // Pick the most specific category tag
    const categoryTag = scannedProduct.categoriesTags[scannedProduct.categoriesTags.length - 1];
    if (!categoryTag) return [];

    const url = `https://world.openfoodfacts.org/category/${encodeURIComponent(categoryTag)}.json?fields=product_name,brands,image_small_url,ingredients_text,code&page_size=20`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    const currentBarcode = scannedProduct.barcode || scannedProduct.code;
    const normFlagged = flaggedIngredientNames.map(f => normalizeText(f));

    const suitable = [];

    for (const prod of data.products) {
      if (prod.code === currentBarcode) continue;
      if (!prod.product_name || !prod.ingredients_text) continue;

      const ingTextNorm = normalizeText(prod.ingredients_text);

      // Check if any flagged ingredient appears in this product's ingredients text
      const hasFlagged = normFlagged.some(flag => ingTextNorm.includes(flag));

      if (!hasFlagged) {
        suitable.push({
          code: prod.code,
          name: prod.product_name,
          brand: prod.brands || 'Unknown Brand',
          image: prod.image_small_url || 'https://images.openfoodfacts.org/images/icons/dist/packaging.svg'
        });
      }

      if (suitable.length >= 3) break;
    }

    return suitable;
  } catch (err) {
    console.warn('Error finding product alternatives:', err);
    return [];
  }
}
