import { ItemCategory } from '@/types';

// ─── Estimated prices (USD) ─────────────────────────────────────────────────
// No product catalog/backend exists, so prices are estimated locally — common
// items get a realistic fixed price, everything else falls back to a
// deterministic, category-scoped estimate so "under $5" style filters and
// substitute suggestions have real numbers to work against.

const KNOWN_PRICES: Record<string, number> = {
  milk: 3.49, bread: 2.99, eggs: 4.29, butter: 4.99, cheese: 5.49,
  yogurt: 3.99, apple: 0.79, banana: 0.35, orange: 0.89, tomato: 0.69,
  potato: 0.59, onion: 0.55, rice: 6.99, pasta: 2.49, chicken: 7.99,
  water: 4.99, coffee: 8.99, tea: 4.49, toothpaste: 3.29, toothbrush: 2.49,
  shampoo: 6.49, soap: 1.99, 'toilet paper': 7.99,
};

const CATEGORY_PRICE_RANGE: Record<ItemCategory, [number, number]> = {
  dairy: [2, 6],
  produce: [0.5, 3],
  bakery: [2, 6],
  meat: [5, 15],
  frozen: [3, 9],
  beverages: [2, 10],
  snacks: [2, 7],
  household: [3, 12],
  personal_care: [2, 10],
  grains: [2, 8],
  condiments: [1.5, 6],
  other: [1, 8],
};

function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Deterministic estimated price for an item — same name always yields the
 * same price so filtering and display stay stable across sessions.
 */
export function estimatePrice(name: string, category: ItemCategory): number {
  const lower = name.toLowerCase().trim();
  if (KNOWN_PRICES[lower] !== undefined) return KNOWN_PRICES[lower];

  const [min, max] = CATEGORY_PRICE_RANGE[category];
  const fraction = (hashString(lower) % 100) / 100;
  return Math.round((min + fraction * (max - min)) * 100) / 100;
}
