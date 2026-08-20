import { Suggestion } from '@/types';
import { categorizeItem } from '@/lib/categories';

// ─── Substitute database ───────────────────────────────────────────────────
// Maps a product to its common substitutes

const SUBSTITUTES_MAP: Record<string, { substitute: string; reason: string }[]> = {
  milk:           [{ substitute: 'almond milk',   reason: 'Dairy-free alternative' },
                   { substitute: 'oat milk',      reason: 'Creamy, great in coffee' },
                   { substitute: 'soy milk',      reason: 'High-protein dairy-free option' }],
  'almond milk':  [{ substitute: 'oat milk',      reason: 'Nut-free alternative' },
                   { substitute: 'coconut milk',  reason: 'Rich and creamy' }],
  sugar:          [{ substitute: 'jaggery',       reason: 'Natural unrefined sweetener' },
                   { substitute: 'honey',         reason: 'Natural liquid sweetener' },
                   { substitute: 'stevia',        reason: 'Zero-calorie substitute' }],
  butter:         [{ substitute: 'ghee',          reason: 'High smoke point, richer flavor' },
                   { substitute: 'coconut oil',   reason: 'Dairy-free substitute' }],
  flour:          [{ substitute: 'almond flour',  reason: 'Gluten-free alternative' },
                   { substitute: 'oat flour',     reason: 'Whole grain option' }],
  pasta:          [{ substitute: 'zucchini noodles', reason: 'Low-carb alternative' },
                   { substitute: 'rice noodles',  reason: 'Gluten-free option' }],
  rice:           [{ substitute: 'quinoa',        reason: 'Higher protein & fiber' },
                   { substitute: 'cauliflower rice', reason: 'Low-carb substitute' }],
  beef:           [{ substitute: 'mushrooms',     reason: 'Umami-rich plant alternative' },
                   { substitute: 'lentils',       reason: 'High-protein plant substitute' }],
  chicken:        [{ substitute: 'tofu',          reason: 'Protein-rich plant option' },
                   { substitute: 'chickpeas',     reason: 'Budget-friendly protein' }],
  eggs:           [{ substitute: 'flax eggs',     reason: 'Vegan baking substitute' },
                   { substitute: 'tofu',          reason: 'Scrambled egg substitute' }],
  cheese:         [{ substitute: 'nutritional yeast', reason: 'Cheesy flavor, dairy-free' },
                   { substitute: 'cashew cheese', reason: 'Creamy vegan alternative' }],
  chocolate:      [{ substitute: 'carob',         reason: 'Caffeine-free alternative' }],
  soda:           [{ substitute: 'sparkling water', reason: 'No sugar, same fizz' },
                   { substitute: 'kombucha',      reason: 'Probiotic fizzy drink' }],
  coffee:         [{ substitute: 'green tea',     reason: 'Lower caffeine, antioxidant-rich' },
                   { substitute: 'matcha',        reason: 'Sustained energy, no jitters' }],
  mayonnaise:     [{ substitute: 'greek yogurt',  reason: 'Lower fat, high protein' },
                   { substitute: 'avocado',       reason: 'Healthy fat alternative' }],
  salt:           [{ substitute: 'low-sodium salt', reason: 'Heart-healthy option' },
                   { substitute: 'herbs',         reason: 'Flavor without sodium' }],
  olive_oil:      [{ substitute: 'avocado oil',   reason: 'Higher smoke point' },
                   { substitute: 'coconut oil',   reason: 'Great for high-heat cooking' }],
  bread:          [{ substitute: 'lettuce wraps', reason: 'Low-carb wrapping' },
                   { substitute: 'rice cakes',    reason: 'Gluten-free snack base' }],
  potato:         [{ substitute: 'sweet potato',  reason: 'More nutrients, lower GI' },
                   { substitute: 'cauliflower',   reason: 'Low-carb mash alternative' }],
};

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Returns substitute suggestions for items currently in the shopping list.
 * Encourages the user to try alternatives.
 */
export function getSubstituteSuggestions(
  currentItemNames: string[],
  limit = 3
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const itemName of currentItemNames) {
    if (suggestions.length >= limit) break;
    const key = itemName.toLowerCase().trim();
    const subs = SUBSTITUTES_MAP[key];
    if (!subs || subs.length === 0) continue;

    const sub = subs[0]; // Pick top substitute
    suggestions.push({
      id: `sub_${key}_${sub.substitute}`,
      name: sub.substitute,
      reason: `💡 Substitute for ${itemName}: ${sub.reason}`,
      source: 'substitute',
      category: categorizeItem(sub.substitute),
    });
  }

  return suggestions;
}

/**
 * Returns all substitutes for a specific item name.
 */
export function getSubstitutesForItem(
  itemName: string
): { substitute: string; reason: string }[] {
  return SUBSTITUTES_MAP[itemName.toLowerCase().trim()] ?? [];
}
