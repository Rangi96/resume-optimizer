import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const PAGE_METADATA = {
  en: {
    title: 'AI Resume Optimizer - Optimal Resume',
    description: 'AI-powered resume optimization tool with gap analysis and formatting'
  },
  es: {
    title: 'Optimizador de Currículum con IA - Optimal Resume',
    description: 'Herramienta de optimización de currículum con IA con análisis de brechas y formato'
  }
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Update page metadata when language changes
  useEffect(() => {
    const metadata = PAGE_METADATA[i18n.language] || PAGE_METADATA.en;
    document.title = metadata.title;
    document.documentElement.lang = i18n.language;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', metadata.description);
    }
  }, [i18n.language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">
          {LANGUAGES.find(l => l.code === i18n.language)?.flag || '🌐'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                i18n.language === lang.code
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-800 hover:text-gray-900'
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
      )}
    </div>
  );
}
