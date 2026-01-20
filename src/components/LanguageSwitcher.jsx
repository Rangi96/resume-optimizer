import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = langCode;
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">
          {LANGUAGES.find(l => l.code === i18n.language)?.flag || '🌐'}
        </span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-50">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
              i18n.language === lang.code ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
