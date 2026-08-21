import { ItemCategory, ShoppingItem } from '@/types';

// ─── Category keyword map ────────────────────────────────────────────────

const CATEGORY_MAP: Record<ItemCategory, string[]> = {
  dairy: [
    'milk', 'cheese', 'butter', 'yogurt', 'cream', 'curd', 'paneer',
    'ghee', 'almond milk', 'oat milk', 'soy milk', 'whey',
  ],
  produce: [
    'apple', 'banana', 'orange', 'tomato', 'potato', 'onion', 'garlic',
    'ginger', 'lemon', 'lime', 'spinach', 'lettuce', 'carrot', 'broccoli',
    'cauliflower', 'mango', 'grape', 'strawberry', 'blueberry', 'avocado',
    'cucumber', 'pepper', 'capsicum', 'mushroom', 'peas', 'corn', 'pear',
    'peach', 'watermelon', 'kiwi', 'papaya', 'pomegranate',
  ],
  bakery: [
    'bread', 'bun', 'roll', 'cake', 'muffin', 'croissant', 'bagel',
    'pita', 'tortilla', 'roti', 'naan', 'biscuit', 'cookie', 'pastry',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'prawn',
    'salmon', 'tuna', 'turkey', 'mutton', 'egg', 'eggs',
  ],
  frozen: [
    'frozen', 'ice cream', 'gelato', 'sorbet', 'frozen pizza',
    'frozen vegetables', 'frozen fruit',
  ],
  beverages: [
    'water', 'juice', 'soda', 'cola', 'tea', 'coffee', 'beer', 'wine',
    'whiskey', 'vodka', 'kombucha', 'lemonade', 'energy drink', 'protein shake',
  ],
  snacks: [
    'chips', 'popcorn', 'nuts', 'almonds', 'cashews', 'peanuts', 'candy',
    'chocolate', 'granola', 'protein bar', 'crackers', 'pretzels',
  ],
  household: [
    'soap', 'shampoo', 'detergent', 'cleaner', 'toilet paper', 'tissue',
    'trash bag', 'sponge', 'brush', 'bleach', 'disinfectant', 'towel',
    'paper towel', 'foil', 'plastic wrap', 'zip lock', 'candle',
  ],
  personal_care: [
    'toothpaste', 'toothbrush', 'deodorant', 'razor', 'shaving cream',
    'lotion', 'moisturizer', 'sunscreen', 'conditioner', 'face wash',
    'lip balm', 'perfume', 'cologne', 'makeup', 'nail polish',
  ],
  grains: [
    'rice', 'pasta', 'noodles', 'oats', 'flour', 'wheat', 'quinoa',
    'barley', 'couscous', 'lentil', 'dal', 'chickpea', 'beans',
    'kidney beans', 'spaghetti', 'macaroni',
  ],
  condiments: [
    'salt', 'pepper', 'sugar', 'ketchup', 'mustard', 'mayonnaise',
    'olive oil', 'oil', 'vinegar', 'soy sauce', 'hot sauce', 'honey',
    'jam', 'peanut butter', 'nutella', 'maple syrup', 'sriracha',
    'curry powder', 'turmeric', 'cumin', 'coriander', 'chili powder',
  ],
  other: [],
};

// ─── Public API ───────────────────────────────────────────────────────────

export function categorizeItem(itemName: string): ItemCategory {
  const lower = itemName.toLowerCase().trim();
  const words = lower.split(/\s+/);

  for (const [category, keywords] of Object.entries(CATEGORY_MAP) as [ItemCategory, string[]][]) {
    if (category === 'other') continue;
    for (const kw of keywords) {
      // 1. Exact match
      if (lower === kw) return category;

      // 2. Multi-word keyword (e.g. "almond milk" in "unsweetened almond milk")
      if (kw.includes(' ') && lower.includes(kw)) return category;

      // 3. Whole-word match or plural/stem match (e.g. "apples" -> "apple")
      if (words.some((w) => w === kw || (w.startsWith(kw) && kw.length >= 3) || (kw.startsWith(w) && w.length >= 4))) {
        return category;
      }
    }
  }

  return 'other';
}

/**
 * Returns a display label for a category.
 */
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  dairy:         '🥛 Dairy',
  produce:       '🥦 Produce',
  bakery:        '🍞 Bakery',
  meat:          '🥩 Meat & Seafood',
  frozen:        '🧊 Frozen',
  beverages:     '🧃 Beverages',
  snacks:        '🍿 Snacks',
  household:     '🧹 Household',
  personal_care: '🧴 Personal Care',
  grains:        '🌾 Grains & Legumes',
  condiments:    '🫙 Condiments & Spices',
  other:         '📦 Other',
};

/**
 * Returns an emoji icon for a category.
 */
export const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  dairy:         '🥛',
  produce:       '🥦',
  bakery:        '🍞',
  meat:          '🥩',
  frozen:        '🧊',
  beverages:     '🧃',
  snacks:        '🍿',
  household:     '🧹',
  personal_care: '🧴',
  grains:        '🌾',
  condiments:    '🫙',
  other:         '📦',
};

/**
 * Groups shopping items by category, returning a sorted map.
 */
export function groupByCategory(items: ShoppingItem[]): Map<ItemCategory, ShoppingItem[]> {
  const map = new Map<ItemCategory, ShoppingItem[]>();

  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }

  return map;
}
