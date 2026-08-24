import { SupportedLanguage, LanguageConfig } from '@/types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi-IN', name: 'Hindi',   nativeName: 'हिन्दी',  flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French',  nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German',  nativeName: 'Deutsch', flag: '🇩🇪' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en-US';

/**
 * Keyword maps per language for basic intent detection.
 * The NLP parser falls back to English for unsupported phrases.
 */
export const LANGUAGE_INTENT_KEYWORDS: Record<SupportedLanguage, {
  add: string[];
  remove: string[];
  check: string[];
  search: string[];
  clear: string[];
}> = {
  'en-US': {
    add:    ['add', 'adding', 'buy', 'buying', 'get', 'getting', 'need', 'want', 'put', 'include', 'pick up'],
    remove: ['remove', 'delete', 'take off', 'drop', 'cancel', 'dont need', "don't need"],
    check:  ['check', 'done', 'got', 'have', 'checked'],
    search: ['find', 'search', 'look for', 'show me', 'where is'],
    clear:  ['clear', 'empty', 'reset', 'start over'],
  },
  'hi-IN': {
    add:    ['जोड़ो', 'खरीदो', 'चाहिए', 'लाओ', 'डालो'],
    remove: ['हटाओ', 'निकालो', 'नहीं चाहिए'],
    check:  ['हो गया', 'मिल गया', 'चेक'],
    search: ['खोजो', 'ढूंढो', 'दिखाओ'],
    clear:  ['साफ करो', 'मिटाओ', 'खाली करो'],
  },
  'es-ES': {
    add:    ['añadir', 'agregar', 'comprar', 'necesito', 'quiero', 'poner'],
    remove: ['quitar', 'eliminar', 'borrar', 'sacar'],
    check:  ['marcar', 'listo', 'tengo'],
    search: ['buscar', 'encontrar', 'mostrar'],
    clear:  ['limpiar', 'vaciar', 'reiniciar'],
  },
  'fr-FR': {
    add:    ['ajouter', 'acheter', 'besoin', 'veux', 'mettre'],
    remove: ['enlever', 'supprimer', 'retirer', 'effacer'],
    check:  ['cocher', 'fait', 'obtenu'],
    search: ['chercher', 'trouver', 'montrer'],
    clear:  ['vider', 'effacer', 'réinitialiser'],
  },
  'de-DE': {
    add:    ['hinzufügen', 'kaufen', 'brauche', 'will', 'holen'],
    remove: ['entfernen', 'löschen', 'streichen'],
    check:  ['abhaken', 'erledigt', 'habe'],
    search: ['suchen', 'finden', 'zeige'],
    clear:  ['leeren', 'löschen', 'zurücksetzen'],
  },
};
