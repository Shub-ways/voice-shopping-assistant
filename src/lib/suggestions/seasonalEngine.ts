import { Suggestion } from '@/types';
import { categorizeItem } from '@/lib/categories';

// ─── Seasonal item database ────────────────────────────────────────────────
// Indexed by month (0 = Jan, 11 = Dec)

const SEASONAL_ITEMS: Record<number, { name: string; reason: string }[]> = {
  0:  [{ name: 'oranges', reason: 'Peak citrus season in January' }, { name: 'kale', reason: 'Winter greens at their best' }, { name: 'pomegranate', reason: 'In season now' }],
  1:  [{ name: 'grapefruit', reason: 'February citrus peak' }, { name: 'broccoli', reason: 'Cool-weather broccoli is sweeter now' }],
  2:  [{ name: 'artichoke', reason: 'Spring harvest starting' }, { name: 'asparagus', reason: 'March marks asparagus season' }, { name: 'strawberries', reason: 'Early spring strawberries' }],
  3:  [{ name: 'peas', reason: 'Spring peas are fresh now' }, { name: 'spinach', reason: 'Spring spinach season' }, { name: 'radish', reason: 'Great in April' }],
  4:  [{ name: 'cherries', reason: 'Cherry season starts in May' }, { name: 'lettuce', reason: 'Spring lettuce at peak' }],
  5:  [{ name: 'blueberries', reason: 'Summer berry season begins' }, { name: 'peaches', reason: 'Early summer peaches' }, { name: 'tomatoes', reason: 'Summer tomatoes are best now' }],
  6:  [{ name: 'watermelon', reason: "It's peak watermelon season!" }, { name: 'corn', reason: 'Sweet corn at its best' }, { name: 'zucchini', reason: 'July zucchini harvest' }],
  7:  [{ name: 'figs', reason: 'Late summer figs' }, { name: 'eggplant', reason: 'August harvest peak' }, { name: 'mangoes', reason: 'Mango season in full swing' }],
  8:  [{ name: 'apples', reason: 'Apple picking season — September' }, { name: 'pears', reason: 'Fall pear harvest' }, { name: 'grapes', reason: 'September grape harvest' }],
  9:  [{ name: 'pumpkin', reason: 'October pumpkin season' }, { name: 'sweet potato', reason: 'Fall harvest' }, { name: 'cranberries', reason: 'Holiday prep starts now' }],
  10: [{ name: 'pomegranate', reason: 'November pomegranate season' }, { name: 'butternut squash', reason: 'Winter squash at peak' }],
  11: [{ name: 'clementines', reason: 'December citrus peak' }, { name: 'Brussels sprouts', reason: 'Winter greens best in cold' }],
};

// ─── Holiday-based items ───────────────────────────────────────────────────

const HOLIDAY_ITEMS: { month: number; day: number; items: string[]; occasion: string }[] = [
  { month: 11, day: 25, items: ['turkey', 'cranberry sauce', 'stuffing', 'eggnog'], occasion: 'Christmas' },
  { month: 9,  day: 31, items: ['pumpkin', 'candy', 'caramel apples'],              occasion: 'Halloween' },
  { month: 10, day: 25, items: ['turkey', 'cranberries', 'pumpkin pie'],             occasion: 'Thanksgiving' },
];

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Returns seasonal and holiday-themed suggestions for the current date.
 */
export function getSeasonalSuggestions(
  currentItemNames: string[],
  limit = 4
): Suggestion[] {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const currentSet = new Set(currentItemNames.map((n) => n.toLowerCase()));

  const suggestions: Suggestion[] = [];

  // Check holiday proximity (within 7 days)
  for (const holiday of HOLIDAY_ITEMS) {
    if (holiday.month === month && Math.abs(holiday.day - day) <= 7) {
      for (const item of holiday.items) {
        if (!currentSet.has(item) && suggestions.length < limit) {
          suggestions.push({
            id: `seasonal_holiday_${item}`,
            name: item,
            reason: `🎉 ${holiday.occasion} is coming up!`,
            source: 'seasonal',
            category: categorizeItem(item),
          });
        }
      }
    }
  }

  // Fill remaining slots with monthly seasonal items
  const monthlyItems = SEASONAL_ITEMS[month] ?? [];
  for (const seasonal of monthlyItems) {
    if (suggestions.length >= limit) break;
    if (!currentSet.has(seasonal.name)) {
      suggestions.push({
        id: `seasonal_${seasonal.name}`,
        name: seasonal.name,
        reason: seasonal.reason,
        source: 'seasonal',
        category: categorizeItem(seasonal.name),
      });
    }
  }

  return suggestions;
}
