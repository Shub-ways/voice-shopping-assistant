// ─── Shopping Item Types ───────────────────────────────────────────────────

export type ItemCategory =
  | 'dairy'
  | 'produce'
  | 'bakery'
  | 'meat'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'household'
  | 'personal_care'
  | 'grains'
  | 'condiments'
  | 'other';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: ItemCategory;
  checked: boolean;
  addedAt: number;
  note?: string;
}

// ─── NLP / Voice Types ────────────────────────────────────────────────────

export type VoiceIntent =
  | 'ADD'
  | 'REMOVE'
  | 'CHECK'
  | 'UNCHECK'
  | 'SEARCH'
  | 'CLEAR'
  | 'UNKNOWN';

export interface ParsedCommand {
  intent: VoiceIntent;
  item?: string;
  quantity?: number;
  unit?: string;
  searchQuery?: string;
  maxPrice?: number;
  filters?: string[];
  raw: string;
}

// ─── Suggestions ──────────────────────────────────────────────────────────

export type SuggestionSource = 'history' | 'seasonal' | 'substitute';

export interface Suggestion {
  id: string;
  name: string;
  reason: string;
  source: SuggestionSource;
  category: ItemCategory;
}

// ─── Language Support ─────────────────────────────────────────────────────

export type SupportedLanguage = 'en-US' | 'hi-IN' | 'es-ES' | 'fr-FR' | 'de-DE';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// ─── Voice Recognition State ──────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceRecognitionState {
  voiceState: VoiceState;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// ─── Shopping List Actions ────────────────────────────────────────────────

export type ShoppingListAction =
  | { type: 'ADD_ITEM'; payload: Omit<ShoppingItem, 'id' | 'addedAt' | 'checked'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'TOGGLE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CHECKED' }
  | { type: 'CLEAR_ALL' }
  | { type: 'LOAD_ITEMS'; payload: ShoppingItem[] };

// ─── History / Analytics ─────────────────────────────────────────────────

export interface ItemHistory {
  name: string;
  category: ItemCategory;
  addedCount: number;
  lastAdded: number;
}
