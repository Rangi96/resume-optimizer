import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const SUPPORTED_LANGUAGES = ['en', 'es'];
const DEFAULT_LANGUAGE = 'en';

i18n
  // Load translation files from /public/locales
  .use(HttpBackend)

  // Detect user language
  .use(LanguageDetector)

  // Pass i18n instance to react-i18next
  .use(initReactI18next)

  .init({
    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES,

    // Fallback language
    fallbackLng: DEFAULT_LANGUAGE,

    // Default namespace
    defaultNS: 'common',

    // Namespaces to load
    ns: ['common', 'templates', 'legal', 'errors', 'auth'],

    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Keys for localStorage
      lookupLocalStorage: 'preferredLanguage',

      // Cache user language choice
      caches: ['localStorage'],
    },

    // Backend options (loading translation files)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React options
    react: {
      useSuspense: true, // Use Suspense for loading translations
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
  });

export default i18n;
