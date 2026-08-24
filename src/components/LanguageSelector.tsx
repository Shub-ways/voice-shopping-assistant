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
      <Languages className="w-4 h-4 text-[#607168] flex-shrink-0" />
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
                ? 'bg-[#18352d] text-white shadow-md'
                : 'bg-[#f6f3ec] text-[#607168] hover:bg-[#e8efe5] hover:text-[#18221d]'
            )}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
}
