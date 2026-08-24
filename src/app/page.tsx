'use client';

import { useState, useCallback, useMemo, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Mic2, History, Trash2, Search, Plus, CircleCheck } from 'lucide-react';
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
import { parseVoiceCommand } from '@/lib/nlp/intentParser';
import { decodeUtf8Base64 } from '@/lib/share';

export default function Home() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [commandLog, setCommandLog] = useState<{ id: string; text: string; ts: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'log'>('list');
  const [typedCommand, setTypedCommand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState<number | undefined>(undefined);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState('Ready when you are');
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);

  const {
    items,
    uncheckedItems,
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
    if (!mounted) return [];
    const currentNames = items.map((i) => i.name);
    const all: Suggestion[] = [
      ...getHistorySuggestions(currentNames, 4),
      ...getSeasonalSuggestions(currentNames, 3),
      ...getSubstituteSuggestions(currentNames, 2),
    ];
    return all.filter((s) => !dismissedSuggestions.has(s.id)).slice(0, 6);
  }, [items, dismissedSuggestions, mounted]);

  // ── List filter: name query + estimated price ceiling + attribute tags ────

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      if (query && !item.name.includes(query)) return false;
      if (searchMaxPrice !== undefined && item.price > searchMaxPrice) return false;
      if (searchTags.length > 0 && !searchTags.every((tag) => item.name.includes(tag))) return false;
      return true;
    });
  }, [items, searchQuery, searchMaxPrice, searchTags]);

  // ── Voice command handler ─────────────────────────────────────────────────

  const handleCommand = useCallback(
    (command: ParsedCommand) => {
      // Log the command with unique id
      setCommandLog((prev) =>
        [
          {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            text: command.raw,
            ts: Date.now(),
          },
          ...prev,
        ].slice(0, 20)
      );

      if (
        command.item &&
        (command.intent === 'UNKNOWN' || (command.confidence !== undefined && command.confidence < 0.72))
      ) {
        setPendingCommand(command);
        setLastAction(`I heard “${command.item}” — please confirm`);
        return;
      }

      switch (command.intent) {
        case 'ADD':
          if (command.item) {
            addItem(command.item, command.quantity ?? 1, command.unit);
            setLastAction(`Added ${command.quantity && command.quantity > 1 ? `${command.quantity} ` : ''}${command.item}`);
          }
          break;

        case 'REMOVE':
          if (command.item) {
            removeItemByName(command.item, command.quantity ?? 1);
            setLastAction(`Removed ${command.quantity && command.quantity > 1 ? `${command.quantity} ` : ''}${command.item}`);
          }
          break;

        case 'CHECK': {
          if (command.item) {
            const found = items.find((i) =>
              i.name.toLowerCase().includes(command.item!.toLowerCase())
            );
            if (found) {
              toggleItem(found.id);
              setLastAction(`Checked off ${found.name}`);
            }
          }
          break;
        }

        case 'CLEAR':
          clearAll();
          setLastAction('List cleared');
          break;

        case 'SEARCH': {
          setSearchQuery(command.searchQuery ?? '');
          setSearchMaxPrice(command.maxPrice);
          setSearchTags(command.filters ?? []);
          setActiveTab('list');
          const priceNote = command.maxPrice !== undefined ? ` under $${command.maxPrice}` : '';
          const tagNote = command.filters?.length ? ` (${command.filters.join(', ')})` : '';
          setLastAction(`Searching for ${command.searchQuery || 'items'}${priceNote}${tagNote}`);
          break;
        }

        default:
          // UNKNOWN — try treating as ADD if item name detected
          if (command.item) {
            addItem(command.item, 1);
            setLastAction(`Added ${command.item}`);
          }
          break;
      }
    },
    [addItem, removeItemByName, toggleItem, clearAll, items]
  );

  const confirmPendingCommand = useCallback(() => {
    if (!pendingCommand?.item) return;
    addItem(pendingCommand.item, pendingCommand.quantity ?? 1, pendingCommand.unit);
    setLastAction(`Added ${pendingCommand.item}`);
    setPendingCommand(null);
  }, [addItem, pendingCommand]);

  const cancelPendingCommand = useCallback(() => {
    setPendingCommand(null);
    setLastAction('Command ignored');
  }, []);

  const submitTypedCommand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!typedCommand.trim()) return;
    handleCommand(parseVoiceCommand(typedCommand, language));
    setTypedCommand('');
  };

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
      const decoded = decodeUtf8Base64(decodeURIComponent(encoded));
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
    <main className="min-h-screen bg-[#f6f3ec] text-[#18221d]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8 min-h-screen">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#ff7043] rounded-2xl shadow-[4px_4px_0_#18221d]">
              <ShoppingCart className="w-5 h-5 text-[#18221d]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">
                Say<span className="text-[#ff7043]">Cart</span>
              </h1>
              <p className="text-xs text-[#607168]">
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
                className="p-2 rounded-xl text-[#607168] hover:text-red-600 hover:bg-red-100 transition-all"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ── Language selector ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          <section className="bg-[#18352d] text-[#f6f3ec] rounded-[2rem] p-6 sm:p-10 min-h-[390px] flex flex-col justify-between overflow-hidden relative shadow-[8px_8px_0_#c8d7c6]" aria-label="Voice input">
            <div className="relative z-10 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[#a6c9a5] font-bold">Hands-free grocery run</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight max-w-md">What should we pick up?</h2>
              <p className="text-[#c8d7c6] max-w-sm">Speak naturally. Say a quantity, remove an item, or ask me to find something on your list.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3 pt-8">
              <VoiceInput language={language} onCommand={handleCommand} />
              <p className="text-sm text-[#a6c9a5]">{lastAction}</p>
            </div>
            <div className="absolute -right-20 -bottom-24 w-64 h-64 rounded-full border-[34px] border-[#ff7043]/80" />
          </section>

          <section className="bg-white rounded-[2rem] border border-[#d7dfd4] p-6 sm:p-8 shadow-[0_12px_30px_rgba(24,34,29,0.06)]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#607168] font-bold">Quick add</p>
                <h2 className="text-2xl font-black tracking-tight">Type it your way</h2>
              </div>
              <Plus className="text-[#ff7043]" />
            </div>
            <form onSubmit={submitTypedCommand} className="flex gap-2">
              <input value={typedCommand} onChange={(event) => setTypedCommand(event.target.value)} placeholder="e.g. add 2 bottles of water" className="min-w-0 flex-1 rounded-xl border border-[#d7dfd4] bg-[#f6f3ec] px-4 py-3 text-sm outline-none focus:border-[#ff7043] focus:ring-2 focus:ring-[#ff7043]/20" aria-label="Type a shopping command" />
              <button type="submit" className="rounded-xl bg-[#ff7043] px-4 font-bold hover:bg-[#f25b31] transition-colors" aria-label="Add typed command">Go</button>
            </form>
            <div className="flex flex-wrap gap-2 mt-5">
              {['Add oat milk', 'Buy 3 apples', 'Find organic items'].map((hint) => (
                <button key={hint} onClick={() => setTypedCommand(hint)} className="rounded-full border border-[#d7dfd4] px-3 py-1.5 text-xs text-[#607168] hover:border-[#ff7043] hover:text-[#18221d] transition-colors">{hint}</button>
              ))}
            </div>
            <div className="mt-8 pt-5 border-t border-[#edf0e9]">
              <LanguageSelector current={language} onChange={setLanguage} />
            </div>
          </section>
        </div>

        <AnimatePresence>
          {pendingCommand?.item && (
            <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#f1c48e] bg-[#fff7e8] px-5 py-4"
              aria-label="Confirm voice command"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.16em] font-bold text-[#a25c16]">Needs a quick check</p>
                <p className="font-bold text-[#18352d]">
                  Add {pendingCommand.quantity && pendingCommand.quantity > 1 ? `${pendingCommand.quantity} ` : ''}{pendingCommand.item}?
                </p>
                <p className="text-xs text-[#607168] mt-1">The phrase was unclear, so nothing has been added yet.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={cancelPendingCommand} className="rounded-xl border border-[#d7dfd4] bg-white px-4 py-2 text-sm font-bold text-[#607168] hover:text-[#18352d]">Try again</button>
                <button onClick={confirmPendingCommand} className="rounded-xl bg-[#18352d] px-4 py-2 text-sm font-bold text-white hover:bg-[#245344]">Add it</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

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
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex gap-1 bg-white rounded-xl border border-[#d7dfd4] p-1 flex-1">
          {(['list', 'log'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-[#18352d] text-white shadow'
                  : 'text-[#607168] hover:text-[#18221d]'
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
          <label className="relative sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#607168]" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchMaxPrice(undefined);
                setSearchTags([]);
              }}
              placeholder="Filter your list"
              className="w-full rounded-xl border border-[#d7dfd4] bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#ff7043]"
              aria-label="Filter shopping list"
            />
          </label>
        </div>

        {/* ── Active price/attribute filters ───────────────────────────── */}
        {(searchMaxPrice !== undefined || searchTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 -mt-4">
            {searchMaxPrice !== undefined && (
              <span className="rounded-full bg-[#e8f3e7] border border-[#c8dfc6] text-[#39734a] text-xs font-bold px-3 py-1">
                Under ${searchMaxPrice}
              </span>
            )}
            {searchTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#e8f3e7] border border-[#c8dfc6] text-[#39734a] text-xs font-bold px-3 py-1 capitalize">
                {tag}
              </span>
            ))}
            <button
              onClick={() => { setSearchMaxPrice(undefined); setSearchTags([]); }}
              className="text-xs font-bold text-[#607168] hover:text-[#18221d] underline"
            >
              Clear filters
            </button>
          </div>
        )}

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
                  items={filteredItems}
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
                    <History className="w-10 h-10 text-[#a9b5a3]" />
                    <p className="text-[#607168] text-sm">No commands yet</p>
                  </div>
                ) : (
                  commandLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-[#d7dfd4]"
                    >
                      <Mic2 className="w-3.5 h-3.5 text-[#7c5cff] flex-shrink-0" />
                      <p className="text-sm text-[#18221d] italic flex-1">&ldquo;{entry.text}&rdquo;</p>
                      <span className="text-xs text-[#607168] flex-shrink-0">
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
        <footer className="flex items-center justify-center gap-2 text-xs text-[#607168] pb-2">
          <CircleCheck className="w-4 h-4 text-[#5a9b68]" /> Saved locally · AI assist when online
        </footer>
      </div>
    </main>
  );
}
