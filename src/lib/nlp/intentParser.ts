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

// ─── Known compound items (do not split these into separate words) ─────────

const KNOWN_COMPOUNDS = new Set([
  'ice cream', 'sweet potato', 'almond milk', 'oat milk', 'soy milk', 'coconut milk',
  'peanut butter', 'paper towel', 'toilet paper', 'trash bag', 'plastic wrap', 'zip lock',
  'kidney beans', 'energy drink', 'protein shake', 'protein bar', 'face wash', 'lip balm',
  'olive oil', 'coconut oil', 'avocado oil', 'soy sauce', 'hot sauce', 'maple syrup',
  'curry powder', 'turmeric powder', 'chili powder', 'green tea', 'black tea',
  'shaving cream', 'nail polish', 'whole grain', 'greek yogurt', 'cottage cheese',
  'cream cheese', 'sour cream', 'body wash', 'hand soap', 'dish soap', 'baking powder',
  'baking soda', 'brown sugar', 'frozen pizza', 'frozen vegetables', 'frozen fruit',
]);

// Adjectives that modify the following noun (e.g. "organic apples" -> 1 item)
const ADJECTIVE_MODIFIERS = new Set([
  'organic', 'fresh', 'frozen', 'canned', 'dry', 'dried', 'salted', 'unsalted',
  'raw', 'ripe', 'sweet', 'sour', 'spicy', 'hot', 'cold', 'large', 'small',
  'medium', 'big', 'mini', 'whole', 'dark', 'white', 'red', 'green', 'black',
  'brown', 'yellow', 'vegan', 'diet', 'low', 'fat', 'gluten-free', 'sugar-free',
  'dairy-free', 'extra', 'pure', 'good', 'bad',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[!?:]/g, '')
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
 * For multi-item commands, use parseVoiceCommands instead.
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
  const cleanTokens = stripped.replace(/[.,;]/g, ' ').split(' ').filter(Boolean);
  const { quantity, unit, remainingTokens } = extractQuantityAndUnit(cleanTokens);
  const itemName = extractItemName(remainingTokens);

  return {
    intent,
    item: itemName || undefined,
    quantity,
    unit,
    raw,
  };
}

/**
 * Splits a list of word tokens into separate items, recognizing compound terms
 * (e.g. "ice cream", "sweet potato") and adjective modifiers (e.g. "organic apples").
 */
function splitUnpunctuatedItems(tokens: string[]): string[] {
  const items: string[] = [];
  let currentGroup: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Check 2-word compound match (e.g. "ice cream", "almond milk")
    if (i + 1 < tokens.length) {
      const twoWords = `${token} ${tokens[i + 1]}`;
      if (KNOWN_COMPOUNDS.has(twoWords)) {
        if (currentGroup.length > 0) {
          items.push(currentGroup.join(' '));
          currentGroup = [];
        }
        items.push(twoWords);
        i += 2;
        continue;
      }
    }

    // Check if token is an adjective modifier (e.g. "organic", "fresh")
    if (ADJECTIVE_MODIFIERS.has(token)) {
      currentGroup.push(token);
      i++;
      continue;
    }

    // Check if token is a quantity or unit
    const num = parseFloat(token);
    if (!isNaN(num) || NUMBER_WORDS[token] !== undefined || UNIT_ALIASES[token]) {
      if (currentGroup.length > 0) {
        items.push(currentGroup.join(' '));
        currentGroup = [];
      }
      currentGroup.push(token);
      i++;
      continue;
    }

    // Regular noun word (e.g. "table", "book", "mango", "banana")
    currentGroup.push(token);
    // If we have completed an item (modifiers + noun), push it
    items.push(currentGroup.join(' '));
    currentGroup = [];
    i++;
  }

  if (currentGroup.length > 0) {
    items.push(currentGroup.join(' '));
  }

  return items.filter(Boolean);
}

/**
 * Parses a voice transcript that may contain multiple items separated by
 * commas, "and", "or", or unpunctuated spoken lists (e.g. "add table book and chair").
 *
 * Returns one ParsedCommand per detected item so each is added separately.
 */
export function parseVoiceCommands(
  raw: string,
  language: SupportedLanguage = 'en-US'
): ParsedCommand[] {
  const normalized = normalizeText(raw);
  const intent = detectIntent(normalized, language);

  // CLEAR and SEARCH don't have multi-item variants — return single command
  if (intent === 'CLEAR' || intent === 'SEARCH') {
    return [parseVoiceCommand(raw, language)];
  }

  // Strip intent phrases (e.g. "add", "please put on my list")
  const stripped = stripIntentPhrases(normalized, language);

  // Step 1: Split on explicit delimiters: commas, semicolons, conjunctions
  const rawParts = stripped
    .split(/[,;\.]+|\s+(?:and|&|also|plus|with|then|और|तथा|एवं|व|y|e|et|und)\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);

  // Step 2: For each part, check if it contains multiple unpunctuated words (e.g. "table book")
  const subItems: string[] = [];
  for (const part of rawParts) {
    const cleanTokens = part.split(' ').map((t) => t.trim()).filter(Boolean);
    
    // If single word or already a known compound, keep as-is
    if (cleanTokens.length <= 1 || KNOWN_COMPOUNDS.has(part)) {
      subItems.push(part);
    } else {
      // Intelligently segment unpunctuated tokens
      const segmented = splitUnpunctuatedItems(cleanTokens);
      if (segmented.length > 0) {
        subItems.push(...segmented);
      } else {
        subItems.push(part);
      }
    }
  }

  // If only 1 item resulted, return single parse
  if (subItems.length <= 1) {
    return [parseVoiceCommand(raw, language)];
  }

  // Build a ParsedCommand for each individual item
  return subItems
    .map((itemStr) => {
      const tokens = itemStr.split(' ').filter(Boolean);
      const { quantity, unit, remainingTokens } = extractQuantityAndUnit(tokens);
      const itemName = extractItemName(remainingTokens);
      return {
        intent,
        item: itemName || itemStr,
        quantity,
        unit,
        raw: itemStr,
      };
    })
    .filter((cmd) => Boolean(cmd.item && cmd.item.trim().length > 0));
}

