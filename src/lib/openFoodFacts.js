/**
 * Fetches product information and ingredient list from Open Food Facts API by barcode.
 * @param {string} barcode 
 * @returns {Promise<{success: boolean, rawText?: string, title?: string, brand?: string, image?: string, categoriesTags?: string[], errorReason?: string}>}
 */
export async function lookupBarcode(barcode) {
  if (!barcode || !/^\d{8,14}$/.test(barcode.trim())) {
    return {
      success: false,
      errorReason: 'Invalid barcode format. Please check the number and try scanning again.'
    };
  }

  const cleanCode = barcode.trim();
  const url = `https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NutriScan - Mobile Health App - Version 1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        errorReason: 'Could not connect to Open Food Facts database. Please check your internet connection.'
      };
    }

    const data = await res.json();

    if (data.status === 0 || !data.product) {
      return {
        success: false,
        errorReason: `Product with barcode ${cleanCode} was not found in the database. You can photograph or type the ingredient label instead.`
      };
    }

    const product = data.product;
    const ingredientsText = product.ingredients_text || product.ingredients_text_en || product.ingredients_text_in || '';

    if (!ingredientsText.trim()) {
      return {
        success: false,
        title: product.product_name || 'Scanned Item',
        brand: product.brands || '',
        errorReason: `Product "${product.product_name || 'Item'}" was found, but its ingredient list is not recorded in the database yet. Please scan the label directly with your camera.`
      };
    }

    return {
      success: true,
      rawText: ingredientsText,
      title: product.product_name || `Barcode ${cleanCode}`,
      brand: product.brands || 'Unknown Brand',
      image: product.image_url || product.image_small_url || '',
      categoriesTags: product.categories_tags || [],
      barcode: cleanCode
    };
  } catch (err) {
    console.error('Barcode lookup error:', err);
    return {
      success: false,
      errorReason: 'Network timeout while searching for barcode. Please try scanning the label photo instead.'
    };
  }
}
