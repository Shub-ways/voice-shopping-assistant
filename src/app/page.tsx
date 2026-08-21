'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Mic2, History, Trash2 } from 'lucide-react';
import { useShoppingList } from '@/hooks/useShoppingList';
import { VoiceInput } from '@/components/VoiceInput';
import { ShoppingList } from '@/components/ShoppingList';
import { SuggestionChips } from '@/components/SuggestionChips';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ShareButton } from '@/components/ShareButton';
import { getHistorySuggestions } from '@/lib/suggestions/historyEngine';
import { getSeasonalSuggestions } from '@/lib/suggestions/seasonalEngine';
import { getSubstituteSuggestions } from '@/lib/suggestions/substitutesDB';
import { ParsedCommand, SupportedLanguage, Suggestion } from '@/types';
import { DEFAULT_LANGUAGE } from '@/lib/i18n/languages';

export default function Home() {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [commandLog, setCommandLog] = useState<{ text: string; ts: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'log'>('list');

  const {
    items,
    uncheckedItems,
    checkedItems,
    totalItems,
    checkedCount,
    addItem,
    removeItem,
    removeItemByName,
    toggleItem,
    updateQuantity,
    clearChecked,
    clearAll,
    getShareableUrl,
  } = useShoppingList();

  // ── Smart suggestions ────────────────────────────────────────────────────

  const suggestions = useMemo(() => {
    const currentNames = items.map((i) => i.name);
    const all: Suggestion[] = [
      ...getHistorySuggestions(currentNames, 4),
      ...getSeasonalSuggestions(currentNames, 3),
      ...getSubstituteSuggestions(currentNames, 2),
    ];
    return all.filter((s) => !dismissedSuggestions.has(s.id)).slice(0, 6);
  }, [items, dismissedSuggestions]);

  // ── Voice command handler ─────────────────────────────────────────────────

  const handleCommand = useCallback(
    (command: ParsedCommand) => {
      // Log the command
      setCommandLog((prev) =>
        [{ text: command.raw, ts: Date.now() }, ...prev].slice(0, 20)
      );

      switch (command.intent) {
        case 'ADD':
          if (command.item) {
            addItem(command.item, command.quantity ?? 1, command.unit);
          }
          break;

        case 'REMOVE':
          if (command.item) removeItemByName(command.item);
          break;

        case 'CHECK': {
          if (command.item) {
            const found = items.find((i) =>
              i.name.toLowerCase().includes(command.item!.toLowerCase())
            );
            if (found) toggleItem(found.id);
          }
          break;
        }

        case 'CLEAR':
          clearAll();
          break;

        case 'SEARCH':
          // Surface a toast or highlight matching items
          break;

        default:
          // UNKNOWN — try treating as ADD if item name detected
          if (command.item) addItem(command.item, 1);
          break;
      }
    },
    [addItem, removeItemByName, toggleItem, clearAll, items]
  );

  // ── Accept a suggestion ───────────────────────────────────────────────────

  const handleAcceptSuggestion = useCallback(
    (suggestion: Suggestion) => {
      addItem(suggestion.name, 1, undefined, suggestion.category);
      setDismissedSuggestions((prev) => new Set([...prev, suggestion.id]));
    },
    [addItem]
  );

  const handleDismissSuggestion = useCallback((id: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, id]));
  }, []);

  // ── Load shared list from URL ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('list');
    if (!encoded) return;

    try {
      const decoded = atob(decodeURIComponent(encoded));
      const entries = decoded.split(',');
      entries.forEach((entry) => {
        const [name, qty] = entry.split(':');
        if (name) addItem(name, parseInt(qty || '1', 10));
      });
      // Clear the URL param after loading
      window.history.replaceState({}, '', window.location.pathname);
    } catch { /* Malformed URL */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6 min-h-screen">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-tight">
                Voice Shopping
              </h1>
              <p className="text-xs text-slate-500">
                {totalItems === 0
                  ? 'No items yet'
                  : `${uncheckedItems.length} item${uncheckedItems.length !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton getUrl={getShareableUrl} itemCount={totalItems} />
            {totalItems > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ── Language selector ─────────────────────────────────────────── */}
        <LanguageSelector current={language} onChange={setLanguage} />

        {/* ── Voice input ───────────────────────────────────────────────── */}
        <section
          aria-label="Voice input"
          className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2"
        >
          <VoiceInput language={language} onCommand={handleCommand} />

          {/* Quick hint phrases */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {['"Add milk"', '"Remove bread"', '"I need 3 apples"', '"Clear list"'].map((hint) => (
              <span
                key={hint}
                className="text-xs text-slate-600 bg-white/5 rounded-full px-2.5 py-1"
              >
                {hint}
              </span>
            ))}
          </div>
        </section>

        {/* ── Smart suggestions ─────────────────────────────────────────── */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.section
              key="suggestions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              aria-label="Smart suggestions"
            >
              <SuggestionChips
                suggestions={suggestions}
                onAccept={handleAcceptSuggestion}
                onDismiss={handleDismissSuggestion}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Tabs: List / Command Log ──────────────────────────────────── */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['list', 'log'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white/10 text-slate-100 shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'list' ? (
                <><ShoppingCart className="w-3.5 h-3.5" /> Shopping List</>
              ) : (
                <><Mic2 className="w-3.5 h-3.5" /> Voice Log</>
              )}
            </button>
          ))}
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <section className="flex-1" aria-label={activeTab === 'list' ? 'Shopping list' : 'Voice command log'}>
          <AnimatePresence mode="wait">
            {activeTab === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <ShoppingList
                  items={items}
                  onToggle={toggleItem}
                  onRemove={removeItem}
                  onQuantityChange={updateQuantity}
                  onClearChecked={clearChecked}
                  checkedCount={checkedCount}
                />
              </motion.div>
            ) : (
              <motion.div
                key="log"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-2"
              >
                {commandLog.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <History className="w-10 h-10 text-slate-700" />
                    <p className="text-slate-500 text-sm">No commands yet</p>
                  </div>
                ) : (
                  commandLog.map((entry) => (
                    <div
                      key={entry.ts}
                      className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/5"
                    >
                      <Mic2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <p className="text-sm text-slate-300 italic flex-1">&ldquo;{entry.text}&rdquo;</p>
                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="text-center text-xs text-slate-700 pb-2">
          Voice Shopping Assistant · Built with Next.js
        </footer>
      </div>
    </main>
  );
}
