'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart, Trash, CheckCheck } from 'lucide-react';
import { ShoppingItem } from '@/types';
import { ShoppingItemCard } from '@/components/ShoppingItemCard';
import { groupByCategory, CATEGORY_LABELS } from '@/lib/categories';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onClearChecked: () => void;
  checkedCount: number;
}

export function ShoppingList({
  items,
  onToggle,
  onRemove,
  onQuantityChange,
  onClearChecked,
  checkedCount,
}: ShoppingListProps) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 py-16 text-center"
      >
        <ShoppingCart className="w-16 h-16 text-slate-700" />
        <div>
          <p className="text-slate-400 font-medium">Your list is empty</p>
          <p className="text-slate-600 text-sm mt-1">
            Tap the mic and say &ldquo;Add milk&rdquo; to get started
          </p>
        </div>
      </motion.div>
    );
  }

  const grouped = groupByCategory(items);

  return (
    <div className="flex flex-col gap-5">
      {/* Clear checked button */}
      <AnimatePresence>
        {checkedCount > 0 && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onClick={onClearChecked}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Remove {checkedCount} checked item{checkedCount !== 1 ? 's' : ''}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Grouped list */}
      {Array.from(grouped.entries()).map(([category, categoryItems]) => (
        <div key={category} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">{categoryItems.length}</span>
          </div>

          <AnimatePresence mode="popLayout">
            {categoryItems.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                onToggle={onToggle}
                onRemove={onRemove}
                onQuantityChange={onQuantityChange}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
