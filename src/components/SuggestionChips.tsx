'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Suggestion } from '@/types';
import { CATEGORY_EMOJI } from '@/lib/categories';

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (id: string) => void;
}

const SOURCE_COLORS = {
  history:   'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20',
  seasonal:  'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20',
  substitute:'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20',
};

const SOURCE_BADGE = {
  history:   { label: 'Often bought', color: 'text-[#7652a8]' },
  seasonal:  { label: 'Seasonal',     color: 'text-[#39734a]' },
  substitute:{ label: 'Substitute',   color: 'text-[#a25c16]' },
};

export function SuggestionChips({
  suggestions,
  onAccept,
  onDismiss,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Smart Suggestions
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`
                flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-full border text-sm
                transition-colors cursor-pointer select-none group
                ${SOURCE_COLORS[suggestion.source]}
              `}
              title={suggestion.reason}
            >
              <span className="text-base" role="img" aria-label={suggestion.category}>
                {CATEGORY_EMOJI[suggestion.category]}
              </span>

              {/* Item name — clicking it adds to list */}
              <button
                onClick={() => onAccept(suggestion)}
                className="text-[#18352d] font-semibold capitalize hover:text-[#ff7043] transition-colors"
              >
                {suggestion.name}
              </button>

              {/* Source badge */}
              <span className={`text-xs ${SOURCE_BADGE[suggestion.source].color} hidden sm:inline`}>
                · {SOURCE_BADGE[suggestion.source].label}
              </span>

              {/* Dismiss */}
              <button
                onClick={() => onDismiss(suggestion.id)}
                aria-label="Dismiss suggestion"
                className="p-0.5 rounded-full text-[#607168] hover:text-[#18352d] hover:bg-black/5 transition-all ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
