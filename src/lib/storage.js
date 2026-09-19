import { STORAGE_KEYS } from '../utils/constants.js';


/**
 * Safely fetches item from localStorage.
 */
function safeGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : fallback;
  } catch (err) {
    console.warn(`LocalStorage read error for key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely sets item in localStorage.
 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`LocalStorage write error for key "${key}":`, err);
    return false;
  }
}

export function getAllergens() {
  return safeGet(STORAGE_KEYS.ALLERGENS, []);
}

export function setAllergens(allergensArray) {
  return safeSet(STORAGE_KEYS.ALLERGENS, Array.isArray(allergensArray) ? allergensArray : []);
}

export function getCustomConcerns() {
  return safeGet(STORAGE_KEYS.CUSTOM_CONCERNS, []);
}

export function setCustomConcerns(concernsArray) {
  return safeSet(STORAGE_KEYS.CUSTOM_CONCERNS, Array.isArray(concernsArray) ? concernsArray : []);
}

export function hasOnboarded() {
  return safeGet(STORAGE_KEYS.HAS_ONBOARDED, false);
}

export function setOnboarded(status = true) {
  return safeSet(STORAGE_KEYS.HAS_ONBOARDED, Boolean(status));
}

export function getHistory() {
  return safeGet(STORAGE_KEYS.HISTORY, []);
}

export function addToHistory(scanResult) {
  try {
    const current = getHistory();
    const newEntry = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      title: scanResult.title || 'Scanned Package',
      rawText: scanResult.rawText || '',
      analysis: scanResult.analysis || null,
      summary: scanResult.summary || ''
    };

    // Prepend and cap at 50 entries max
    const updated = [newEntry, ...current].slice(0, 50);
    safeSet(STORAGE_KEYS.HISTORY, updated);
    return newEntry;
  } catch (err) {
    console.warn('Error adding to scan history:', err);
    return null;
  }
}

export function clearHistory() {
  return safeSet(STORAGE_KEYS.HISTORY, []);
}

export function deleteHistoryItem(id) {
  try {
    const current = getHistory();
    const updated = current.filter(item => item.id !== id);
    return safeSet(STORAGE_KEYS.HISTORY, updated);
  } catch (err) {
    console.warn('Error deleting history item:', err);
    return false;
  }
}

export function getHfApiKey() {
  return safeGet(STORAGE_KEYS.HF_API_KEY, '');
}

export function setHfApiKey(key) {
  return safeSet(STORAGE_KEYS.HF_API_KEY, key || '');
}
