'use client';

import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import { ShoppingItem } from '@/types';
import { CATEGORY_EMOJI } from '@/lib/categories';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
}

export function ShoppingItemCard({
  item,
  onToggle,
  onRemove,
  onQuantityChange,
}: ShoppingItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={clsx(
        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
        item.checked
          ? 'bg-white/5 border-white/5 opacity-60'
          : 'bg-white/10 border-white/10 hover:bg-white/15'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
        className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        {item.checked ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* Category emoji */}
      <span className="text-lg flex-shrink-0" role="img" aria-label={item.category}>
        {CATEGORY_EMOJI[item.category]}
      </span>

      {/* Item name + note */}
      <div className="flex-1 min-w-0">
        <p
          className={clsx('text-sm font-medium capitalize truncate', {
            'line-through text-slate-500': item.checked,
            'text-slate-100': !item.checked,
          })}
        >
          {item.name}
        </p>
        {item.note && (
          <p className="text-xs text-slate-500 truncate">{item.note}</p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-mono text-slate-200 w-8 text-center">
          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
        </span>
        <button
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all"
          aria-label="Increase quantity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
