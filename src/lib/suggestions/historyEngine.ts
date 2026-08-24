import { ItemHistory, Suggestion } from '@/types';
import { categorizeItem, normalizeProductName } from '@/lib/categories';

const HISTORY_KEY = 'vsa_item_history';

// ─── Persistence helpers ──────────────────────────────────────────────────

export function loadHistory(): ItemHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as ItemHistory[]).map((item) => ({
      ...item,
      name: normalizeProductName(item.name),
      category: categorizeItem(item.name),
    }));
  } catch {
    return [];
  }
}

export function recordItemAdded(name: string): void {
  if (typeof window === 'undefined') return;
  const history = loadHistory();
  const normalized = normalizeProductName(name);
  const existing = history.find((h) => h.name === normalized);

  if (existing) {
    existing.addedCount += 1;
    existing.lastAdded = Date.now();
  } else {
    history.push({
      name: normalized,
      category: categorizeItem(normalized),
      addedCount: 1,
      lastAdded: Date.now(),
    });
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Silently fail if storage is full
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

// ─── History-based suggestion engine ─────────────────────────────────────

/**
 * Suggests items the user frequently buys that are NOT currently in their
 * active shopping list.
 */
export function getHistorySuggestions(
  currentItemNames: string[],
  limit = 5
): Suggestion[] {
  const history = loadHistory();
  const currentSet = new Set(currentItemNames.map((n) => n.toLowerCase()));

  return history
    // "Adam" is a known Chromium transcription artifact for "add a".
    .filter((h) => h.name !== 'adam' && !currentSet.has(h.name))
    .sort((a, b) => {
      // Recency + frequency weighted score
      const scoreA = a.addedCount * 0.6 + (Date.now() - a.lastAdded < 7 * 86400_000 ? 2 : 0);
      const scoreB = b.addedCount * 0.6 + (Date.now() - b.lastAdded < 7 * 86400_000 ? 2 : 0);
      return scoreB - scoreA;
    })
    .slice(0, limit)
    .map((h) => ({
      id: `hist_${h.name}`,
      name: h.name,
      reason: `You've added this ${h.addedCount} time${h.addedCount !== 1 ? 's' : ''} before`,
      source: 'history' as const,
      category: h.category,
    }));
}
