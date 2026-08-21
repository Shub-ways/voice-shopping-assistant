'use client';

import { Languages } from 'lucide-react';
import clsx from 'clsx';
import { SupportedLanguage } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';

interface LanguageSelectorProps {
  current: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({ current, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="flex gap-1 flex-wrap">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            title={`${lang.nativeName} (${lang.name})`}
            aria-label={`Switch to ${lang.name}`}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              current === lang.code
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            )}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
}
