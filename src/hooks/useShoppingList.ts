'use client';

import { useCallback, useEffect, useReducer } from 'react';
import {
  ShoppingItem,
  ShoppingListAction,
  ItemCategory,
} from '@/types';
import { categorizeItem } from '@/lib/categories';
import { recordItemAdded } from '@/lib/suggestions/historyEngine';

// ─── Persistence key ───────────────────────────────────────────────────────

const STORAGE_KEY = 'vsa_shopping_list';

// ─── Reducer ───────────────────────────────────────────────────────────────

function shoppingListReducer(
  state: ShoppingItem[],
  action: ShoppingListAction
): ShoppingItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { name, quantity, unit, category, note } = action.payload;
      const normalizedName = name.toLowerCase().trim();

      // If item already exists, increase quantity instead of duplicating
      const existingIndex = state.findIndex(
        (i) => i.name.toLowerCase() === normalizedName
      );

      if (existingIndex !== -1) {
        return state.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      const newItem: ShoppingItem = {
        id:       `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name:     normalizedName,
        quantity,
        unit,
        category: category ?? categorizeItem(normalizedName),
        checked:  false,
        addedAt:  Date.now(),
        note,
      };

      return [...state, newItem];
    }

    case 'REMOVE_ITEM':
      return state.filter((item) => item.id !== action.payload.id);

    case 'TOGGLE_ITEM':
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, checked: !item.checked }
          : item
      );

    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );

    case 'CLEAR_CHECKED':
      return state.filter((item) => !item.checked);

    case 'CLEAR_ALL':
      return [];

    default:
      return state;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useShoppingList() {
  const [items, dispatch] = useReducer(shoppingListReducer, [], (): ShoppingItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ShoppingItem[]) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Silently handle storage quota errors
    }
  }, [items]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const addItem = useCallback(
    (
      name: string,
      quantity = 1,
      unit?: string,
      category?: ItemCategory,
      note?: string
    ) => {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          name,
          quantity,
          unit,
          category: category ?? categorizeItem(name),
          note,
        },
      });
      recordItemAdded(name); // update suggestion history
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const removeItemByName = useCallback(
    (name: string) => {
      const normalized = name.toLowerCase().trim();
      const item = items.find((i) => i.name.toLowerCase().includes(normalized));
      if (item) dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } });
    },
    [items]
  );

  const toggleItem = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_ITEM', payload: { id } });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearChecked = useCallback(() => {
    dispatch({ type: 'CLEAR_CHECKED' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  // ── Shareable URL ─────────────────────────────────────────────────────────

  const getShareableUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const payload = items.map((i) => `${i.name}:${i.quantity}`).join(',');
    const encoded = encodeURIComponent(btoa(payload));
    return `${window.location.origin}?list=${encoded}`;
  }, [items]);

  return {
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
  };
}
