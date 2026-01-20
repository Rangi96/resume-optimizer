import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CookieConsent() {
  const { t } = useTranslation('common');
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,    // Always enabled, cannot be disabled
    analytics: false,   // Optional
    preferences: false  // Optional
  });

  // Check for existing consent on mount
  useEffect(() => {
    // Delay showing banner by 1 second for better UX
    const timer = setTimeout(() => {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowBanner(true);
      } else {
        // Load saved preferences
        try {
          const saved = JSON.parse(consent);
          setPreferences(saved.preferences || preferences);
        } catch (e) {
          console.error('Error parsing cookie consent:', e);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Listen for storage events (e.g., when user clicks "Cookie Settings" in footer)
  useEffect(() => {
    const handleStorageChange = () => {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowBanner(true);
        setShowSettings(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save consent to localStorage with 365-day expiry
  const saveConsent = (prefs) => {
    const consent = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 365 days
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
    setShowSettings(false);

    // Apply analytics based on preferences
    if (prefs.analytics) {
      // Enable analytics (placeholder - implement your analytics here)
      console.log('Analytics enabled');
    } else {
      // Disable analytics
      console.log('Analytics disabled');
    }
  };

  // Handle Accept All
  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      analytics: true,
      preferences: true
    };
    setPreferences(allEnabled);
    saveConsent(allEnabled);
  };

  // Handle Reject All (only essential)
  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      preferences: false
    };
    setPreferences(onlyEssential);
    saveConsent(onlyEssential);
  };

  // Handle Customize (open settings panel)
  const handleCustomize = () => {
    setShowSettings(true);
  };

  // Handle Save Custom Preferences
  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  // Toggle preference
  const togglePreference = (key) => {
    if (key === 'essential') return; // Cannot disable essential cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Don't render anything if banner shouldn't be shown
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Settings Panel (overlays banner) */}
      {showSettings && (
        <div className="bg-white border-t-2 border-blue-500 shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">{t('cookies.settings.title')}</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('cookies.settings.closeSettings')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cookie Types */}
            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="cookie-essential"
                  checked={preferences.essential}
                  disabled
                  className="mt-1 w-4 h-4 text-blue-600 rounded cursor-not-allowed opacity-50"
                />
                <div className="flex-1">
                  <label htmlFor="cookie-essential" className="font-semibold text-gray-800 cursor-not-allowed">
                    {t('cookies.types.essential.title')} <span className="text-xs text-gray-500">({t('cookies.required')})</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookies.types.essential.description')}
                  </p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="cookie-analytics"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="cookie-analytics" className="font-semibold text-gray-800 cursor-pointer">
                    {t('cookies.types.analytics.title')} <span className="text-xs text-gray-500">({t('cookies.optional')})</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookies.types.analytics.description')}
                  </p>
                </div>
              </div>

              {/* Preference Cookies */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="cookie-preferences"
                  checked={preferences.preferences}
                  onChange={() => togglePreference('preferences')}
                  className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="cookie-preferences" className="font-semibold text-gray-800 cursor-pointer">
                    {t('cookies.types.preference.title')} <span className="text-xs text-gray-500">({t('cookies.optional')})</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookies.types.preference.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCustom}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('cookies.buttons.savePreferences')}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                {t('cookies.buttons.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Banner (shows when settings panel is closed) */}
      {!showSettings && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-2xl border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon & Message */}
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-1">{t('cookies.banner.title')}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {t('cookies.banner.message')}{' '}
                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                      {t('cookies.banner.privacyPolicy')}
                    </Link>
                    {' '}{t('cookies.banner.forDetails')}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  {t('cookies.buttons.rejectAll')}
                </button>
                <button
                  onClick={handleCustomize}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {t('cookies.buttons.customize')}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t('cookies.buttons.acceptAll')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
