import { ParsedCommand, VoiceIntent, SupportedLanguage } from '@/types';
import { LANGUAGE_INTENT_KEYWORDS } from '@/lib/i18n/languages';

// ─── Unit normalization ────────────────────────────────────────────────────

const UNIT_ALIASES: Record<string, string> = {
  // volume
  liter: 'L', liters: 'L', litre: 'L', litres: 'L', l: 'L',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  // weight
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  g: 'g', gram: 'g', grams: 'g',
  lb: 'lb', pound: 'lb', pounds: 'lb',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  // count
  piece: 'pcs', pieces: 'pcs', pc: 'pcs', pcs: 'pcs',
  pack: 'pack', packet: 'pack', packets: 'pack', packs: 'pack',
  bottle: 'bottle', bottles: 'bottle',
  can: 'can', cans: 'can',
  box: 'box', boxes: 'box',
  bag: 'bag', bags: 'bag',
  dozen: 'dozen',
  loaf: 'loaf', loaves: 'loaf',
};

// ─── Number word map ───────────────────────────────────────────────────────

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, a: 1, an: 1, half: 0.5,
};

// ─── Noise words to strip from item names ─────────────────────────────────

const NOISE_WORDS = new Set([
  'please', 'now', 'quickly', 'the', 'some', 'my', 'our', 'a', 'an',
  'list', 'cart', 'items', 'item', 'grocery',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"""'']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractQuantityAndUnit(tokens: string[]): {
  quantity: number;
  unit?: string;
  remainingTokens: string[];
} {
  let quantity = 1;
  let unit: string | undefined;
  const remaining: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Numeric digit
    const numericVal = parseFloat(token);
    if (!isNaN(numericVal)) {
      quantity = numericVal;
      // peek for unit
      if (i + 1 < tokens.length && UNIT_ALIASES[tokens[i + 1]]) {
        unit = UNIT_ALIASES[tokens[i + 1]];
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Number word
    if (NUMBER_WORDS[token] !== undefined) {
      quantity = NUMBER_WORDS[token];
      if (i + 1 < tokens.length && UNIT_ALIASES[tokens[i + 1]]) {
        unit = UNIT_ALIASES[tokens[i + 1]];
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Unit word without preceding number (e.g. "bottles of water")
    if (UNIT_ALIASES[token]) {
      unit = UNIT_ALIASES[token];
      // skip "of" connector
      if (i + 1 < tokens.length && tokens[i + 1] === 'of') {
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    remaining.push(token);
    i++;
  }

  return { quantity, unit, remainingTokens: remaining };
}

function extractItemName(tokens: string[]): string {
  return tokens
    .filter((t) => !NOISE_WORDS.has(t) && t !== 'of')
    .join(' ')
    .trim();
}

function detectIntent(
  text: string,
  language: SupportedLanguage
): VoiceIntent {
  const keywords = LANGUAGE_INTENT_KEYWORDS[language];

  if (keywords.clear.some((k) => text.includes(k)))  return 'CLEAR';
  if (keywords.remove.some((k) => text.includes(k))) return 'REMOVE';
  if (keywords.check.some((k) => text.includes(k)))  return 'CHECK';
  if (keywords.search.some((k) => text.includes(k))) return 'SEARCH';
  if (keywords.add.some((k) => text.includes(k)))    return 'ADD';

  // Default heuristic: if the sentence is very short, treat as ADD
  const wordCount = text.split(' ').length;
  if (wordCount <= 4) return 'ADD';

  return 'UNKNOWN';
}

function extractPriceLimit(text: string): number | undefined {
  // "under $5", "less than 200 rupees", "below 50"
  const match = text.match(/(?:under|below|less than|max|within)\s*[\$₹€£]?\s*(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : undefined;
}

function extractSearchFilters(text: string): string[] {
  const filters: string[] = [];
  const filterWords = ['organic', 'fresh', 'frozen', 'vegan', 'gluten-free', 'sugar-free', 'low-fat', 'whole grain', 'natural', 'raw'];
  for (const fw of filterWords) {
    if (text.includes(fw)) filters.push(fw);
  }
  return filters;
}

function stripIntentPhrases(text: string, language: SupportedLanguage): string {
  const keywords = LANGUAGE_INTENT_KEYWORDS[language];
  const allIntentWords = [
    ...keywords.add,
    ...keywords.remove,
    ...keywords.check,
    ...keywords.search,
    ...keywords.clear,
    'to my', 'from my', 'to the', 'from the', 'i want to buy',
    'i need to buy', 'i want', 'i need', 'can you', 'please',
    'to list', 'in my list',
  ];

  let result = text;
  // Sort by length desc so longer phrases match first
  allIntentWords
    .sort((a, b) => b.length - a.length)
    .forEach((phrase) => {
      result = result.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), '').trim();
    });

  return result.replace(/\s+/g, ' ').trim();
}

// ─── Main export ──────────────────────────────────────────────────────────

/**
 * Parses a raw voice transcript into a structured command.
 *
 * @param raw - The raw transcript string from the speech recognizer.
 * @param language - The active language code.
 * @returns A ParsedCommand object describing the user's intent.
 */
export function parseVoiceCommand(
  raw: string,
  language: SupportedLanguage = 'en-US'
): ParsedCommand {
  const normalized = normalizeText(raw);
  const intent = detectIntent(normalized, language);

  if (intent === 'CLEAR') {
    return { intent: 'CLEAR', raw };
  }

  if (intent === 'SEARCH') {
    const maxPrice = extractPriceLimit(normalized);
    const filters = extractSearchFilters(normalized);
    const stripped = stripIntentPhrases(normalized, language);
    const cleanQuery = stripped.replace(/under .+/i, '').replace(/below .+/i, '').trim();
    return { intent: 'SEARCH', searchQuery: cleanQuery || normalized, maxPrice, filters, raw };
  }

  // For ADD / REMOVE / CHECK / UNCHECK / UNKNOWN
  const stripped = stripIntentPhrases(normalized, language);
  const tokens = stripped.split(' ').filter(Boolean);
  const { quantity, unit, remainingTokens } = extractQuantityAndUnit(tokens);
  const itemName = extractItemName(remainingTokens);

  return {
    intent,
    item: itemName || undefined,
    quantity,
    unit,
    raw,
  };
}
