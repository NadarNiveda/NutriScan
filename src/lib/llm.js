import { DEFAULT_LLM_TIMEOUT_MS } from '../utils/constants.js';
import { getHfApiKey } from './storage.js';


/**
 * Builds a clean, synchronous fallback summary directly from analysis data.
 */
export function buildFallbackSummary(matchedIngredients = [], allergenAlerts = [], concernAlerts = []) {
  const total = matchedIngredients.length;
  const identified = matchedIngredients.filter(i => i.matched).length;
  const watchItems = matchedIngredients.filter(i => i.data && i.data.concernLevel === 'watch');
  const modItems = matchedIngredients.filter(i => i.data && i.data.concernLevel === 'moderate');

  const alertParts = [];

  if (allergenAlerts && allergenAlerts.length > 0) {
    const allergenLabels = allergenAlerts.map(a => `${a.label} (${a.triggeredBy.join(', ')})`).join('; ');
    alertParts.push(`Allergen alert triggered for ${allergenLabels}`);
  }

  if (concernAlerts && concernAlerts.length > 0) {
    const concernLabels = concernAlerts.map(c => `${c.concern} (${c.triggeredBy.join(', ')})`).join('; ');
    alertParts.push(`Flagged custom concern: ${concernLabels}`);
  }

  if (alertParts.length > 0) {
    return `${alertParts.join('. ')}. Out of ${total} ingredients scanned, ${identified} were matched with established food safety records.`;
  }

  if (watchItems.length > 0) {
    const names = watchItems.map(i => i.data.plainName).join(', ');
    return `Contains ${watchItems.length} ingredient(s) under regulatory watch (${names}). We recommend reviewing the item details based on your dietary goals.`;
  }

  if (modItems.length > 0) {
    return `Scanned ${total} ingredients (${identified} identified). Contains ${modItems.length} moderate-concern additive(s) widely permitted in standard food manufacturing.`;
  }

  return `All ${total} scanned ingredients appear clear of identified allergen or high-concern watch flags based on standard food safety databases.`;
}

/**
 * Builds a question-aware Clinical Nutritionist answer tailored to the specific user query.
 */
export function buildFallbackAnswer(matchedIngredient, userQuestion = '') {
  if (!matchedIngredient || !matchedIngredient.data) {
    return "I can only answer questions about specific scanned product ingredients.";
  }

  const data = matchedIngredient.data;
  const plainName = data.plainName || matchedIngredient.raw || 'This ingredient';
  const whatItIs = data.whatItIs || 'a food processing component';
  const whyUsed = data.whyUsed || 'added for formula balance and texture';
  const concerns = data.concerns || 'Evaluated as safe for regular dietary consumption.';
  const category = data.category || 'Food Component';
  const concernLevel = data.concernLevel || 'low';

  const qLower = (userQuestion || '').toLowerCase().trim();
  let answerText = '';

  // 1. Age Groups / Toddlers / Children / Babies / Pregnancy / Specific Demographics
  if (/\b(2 year|3 year|4 year|5 year|year old|years old|child|children|kid|kids|toddler|toddlers|baby|babies|infant|infants|pregnant|pregnancy|age)\b/i.test(qLower)) {
    if (/\b(sugar|sweetener|syrup|fructose|glucose|sucrose|jaggery)\b/i.test(category) || concernLevel === 'watch' || concernLevel === 'moderate') {
      answerText = `For young children and toddlers, ${plainName} should be strictly limited or avoided. Pediatric and dietary guidelines advise restricting concentrated added sugars for children under 2–5 years old to protect dental health and prevent developing high sweet preferences.`;
    } else {
      answerText = `${plainName} is generally safe for young children and toddlers as part of a balanced, age-appropriate diet. ${concerns}`;
    }
  }
  // 2. Side Effects / Symptoms / Reactions / Tooth Decay / Blood Sugar
  else if (/\b(side effect|side effects|symptom|symptoms|reaction|reactions|diarrhea|stomach|cavity|cavities|decay|spike|bloating|gout|diabetes)\b/i.test(qLower)) {
    if (/\b(sugar|sweetener|syrup)\b/i.test(category)) {
      answerText = `Potential side effects of ${plainName} include rapid blood sugar spikes, increased risk of dental cavities, energy crashes, and excess caloric intake over time. ${concerns}`;
    } else if (concernLevel === 'watch' || concernLevel === 'moderate') {
      answerText = `Consuming ${plainName} in high quantities may cause gastrointestinal discomfort or mild dietary sensitivities in sensitive individuals. ${concerns}`;
    } else {
      answerText = `${plainName} is well-tolerated by most individuals with no significant adverse side effects when consumed in normal dietary amounts.`;
    }
  }
  // 3. Safety / Daily Consumption / Daily Intake / Eating Guidelines
  else if (/\b(safe|daily|intake|limit|consumption|eat|every day|how much)\b/i.test(qLower)) {
    if (concernLevel === 'watch') {
      answerText = `${plainName} requires careful dietary monitoring. Regular daily intake is not recommended for individuals with specific health sensitivities. ${concerns}`;
    } else if (concernLevel === 'moderate') {
      answerText = `${plainName} is safe in moderation, but daily intake should be kept within recommended dietary sugar/sodium limits. ${concerns}`;
    } else {
      answerText = `${plainName} is considered safe for standard daily consumption as part of a balanced diet. ${concerns}`;
    }
  }
  // 4. Why Used / Function / Purpose / Manufacturer Reason
  else if (/\b(why|use|used|add|added|purpose|function|manufacturer|reason|recipe)\b/i.test(qLower)) {
    const cleanWhy = whyUsed.toLowerCase().startsWith('used') || whyUsed.toLowerCase().startsWith('added') || whyUsed.toLowerCase().startsWith('provides') || whyUsed.toLowerCase().startsWith('forms') || whyUsed.toLowerCase().startsWith('prevents')
      ? whyUsed.charAt(0).toLowerCase() + whyUsed.slice(1)
      : `it ${whyUsed.charAt(0).toLowerCase() + whyUsed.slice(1)}`;

    answerText = `${plainName} is used in this product because ${cleanWhy}`;
  }
  // 5. Alternatives / Healthier Substitutes
  else if (/\b(alternative|alternatives|substitute|substitutes|replace|instead|avoid|healthier)\b/i.test(qLower)) {
    if (/\b(sugar|sweetener|syrup)\b/i.test(category)) {
      answerText = `Healthier natural alternatives to ${plainName} include fresh whole fruits, unrefined date paste, pure maple syrup, or raw honey in moderation.`;
    } else {
      answerText = `For ${plainName}, healthier dietary choices include whole unprocessed foods, natural whole grains, or recipes prepared without refined additives.`;
    }
  }
  // 6. What It Is / Origin / Definition
  else if (/\b(what|origin|derived|source|definition|is it|type|nature)\b/i.test(qLower)) {
    const isClean = whatItIs.toLowerCase().startsWith('a ') || whatItIs.toLowerCase().startsWith('an ');
    answerText = `${plainName} is ${isClean ? whatItIs : `a ${whatItIs.charAt(0).toLowerCase() + whatItIs.slice(1)}`}. ${whyUsed}`;
  }
  // 7. General / Default response
  else {
    answerText = `${plainName} (${category}): ${whatItIs} ${whyUsed} Health context: ${concerns}`;
  }

  return answerText.replace(/\.+$/, '') + '.';
}

/**
 * Calls DeepSeek via Hugging Face free Inference API to generate an expert Clinical Nutritionist summary.
 * Silently falls back to local template on network error or timeout.
 */
export async function generateSummary(matchedIngredients = [], allergenAlerts = [], concernAlerts = []) {
  const fallback = buildFallbackSummary(matchedIngredients, allergenAlerts, concernAlerts);

  try {
    const contextData = matchedIngredients.map(i => {
      if (!i.data) return `${i.raw}: Scanned food ingredient`;
      return `${i.data.plainName} (${i.data.category}, concern level: ${i.data.concernLevel}): ${i.data.whatItIs}`;
    }).join('\n');

    const prompt = `You are NutriScan AI, an expert Clinical Nutritionist and Food Safety Specialist.

CRITICAL INSTRUCTION:
Base your response STRICTLY AND ONLY on the provided list of scanned product ingredients below. Do NOT assume, invent, or speculate about unmentioned ingredients.

Scanned Product Ingredients List:
${contextData}

User Allergen Alerts: ${JSON.stringify(allergenAlerts)}
User Custom Health Concerns: ${JSON.stringify(concernAlerts)}

TASK:
Write a genuine, authoritative 2-sentence Clinical Nutritionist summary of this product. Highlight key dietary considerations, flag any triggered allergens or additives of concern first, and provide practical evidence-based advice for the consumer based strictly on these ingredients.`;

    const responseText = await callLlmApi(prompt);
    return responseText ? responseText.trim() : fallback;
  } catch (err) {
    console.warn('LLM summary call failed or timed out, using fallback:', err);
    return fallback;
  }
}

/**
 * Calls AI LLM API as a Clinical Nutritionist to answer user questions about any ingredient.
 * Enforces strict boundary rules prohibiting out-of-the-box speculation or off-topic responses.
 */
export async function answerQuestion(matchedIngredient, userQuestion) {
  // Quick local off-topic guardrail check
  const qLower = (userQuestion || '').toLowerCase();
  const offTopicRegex = /\b(capital of|who won|weather|python|java|code|movie|actor|president|football|cricket|game|score|lyrics|song|car|joke|math|equation|calculate)\b/i;
  
  if (offTopicRegex.test(qLower) && !/\b(ingredient|health|safe|eat|nutrition|food|digest|side effect|allergy)\b/i.test(qLower)) {
    return "I can only answer questions about the specific ingredients extracted from this product's label.";
  }

  if (!matchedIngredient || !matchedIngredient.data) {
    return "I can only answer questions about the specific ingredients extracted from this product's label.";
  }

  const fallback = buildFallbackAnswer(matchedIngredient, userQuestion);

  try {
    const context = `Ingredient Name: ${matchedIngredient.data.plainName}
Category: ${matchedIngredient.data.category}
What it is: ${matchedIngredient.data.whatItIs}
Why used: ${matchedIngredient.data.whyUsed}
Health Context: ${matchedIngredient.data.concerns}
Regulatory status: ${matchedIngredient.data.regulatoryNote}`;

    const prompt = `You are NutriScan AI, an expert Clinical Nutritionist.

STRICT BOUNDARY RULES:
1. You MUST answer using ONLY the provided target ingredient information and food safety context below.
2. Do NOT invent unmentioned facts, make assumptions beyond the text, or answer general off-topic questions.
3. If the user question is unrelated to this ingredient or food safety, YOU MUST RESPOND EXACTLY: "I can only answer questions about the specific ingredients extracted from this product's label."

Target Ingredient Information:
${context}

User Question: ${userQuestion}

INSTRUCTIONS:
Answer the user's specific question directly with expert Clinical Nutritionist knowledge based strictly on this ingredient in 2 clear, informative sentences.`;

    const responseText = await callLlmApi(prompt);

    if (responseText && (responseText.includes("I can only answer questions") || responseText.length > 5)) {
      return responseText.trim();
    }

    return fallback;
  } catch (err) {
    console.warn('LLM Q&A call failed or timed out, using fallback:', err);
    return fallback;
  }
}

/**
 * Helper to call Pollinations AI free text endpoint or Hugging Face Inference API with a 6-second timeout.
 */
async function callLlmApi(prompt) {
  // 1. Try Pollinations AI free fast endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_LLM_TIMEOUT_MS);

    const polUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
    const res = await fetch(polUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (
        text &&
        text.trim().length > 10 &&
        !text.includes("doesn't have enough credits") &&
        !text.includes("pollinations.ai") &&
        !text.includes("top-up") &&
        !text.includes("API key") &&
        !text.toLowerCase().includes("rate limit")
      ) {
        return text.trim();
      }
    }
  } catch (e) {
    // Silent fallback to HF / Local
  }

  // 2. Try Hugging Face model endpoints
  const apiKey = getHfApiKey() || (import.meta.env && import.meta.env.VITE_HF_API_KEY) || '';
  const modelEndpoints = [
    'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct'
  ];

  for (const MODEL_URL of modelEndpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_LLM_TIMEOUT_MS);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(MODEL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 150, temperature: 0.2, return_full_text: false }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0] && data[0].generated_text) {
          return data[0].generated_text;
        } else if (data && data.generated_text) {
          return data.generated_text;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
  }

  return null;
}
