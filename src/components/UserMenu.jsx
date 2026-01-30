import React, { useState, useRef, useEffect, useContext } from 'react';
import { LogOut, User, ChevronDown, Sparkles, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../AuthContext';
import { getOptimizationStats, getAllTierLimits } from '../optimizationManager';

export default function UserMenu() {
  const { t } = useTranslation('auth');
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const menuRef = useRef(null);

  // Load optimization stats when menu opens
  useEffect(() => {
    if (isOpen && user) {
      getOptimizationStats(user.uid, user.paymentStatus || 'free').then(setStats);
    }
  }, [isOpen, user]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const userEmail = user.email || 'User';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const tierLimits = getAllTierLimits();
  const currentTier = user.paymentStatus || 'free';
  const tierName = currentTier === 'free' ? t('userMenu.freePlan') : currentTier === 'premium_10' ? t('userMenu.premium10') : t('userMenu.premium20');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
      >
        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold">
          {userInitial}
        </div>
        <span className="text-sm truncate max-w-[150px]">{userEmail}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">{t('userMenu.signedInAs')}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
          </div>

          {/* Optimization Stats */}
          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-900">{tierName} {t('userMenu.plan')}</p>
            </div>
            {stats ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('userMenu.optimizations')}</span>
                  <span className="font-semibold text-gray-900">
                    {stats.remaining} {t('userMenu.of')} {stats.max} {t('userMenu.remaining')}
                  </span>
                </div>

                {/* Bonus credits display */}
                {stats.bonusRemaining > 0 && (
                  <div className="flex justify-between text-sm bg-purple-50 px-2 py-1 rounded">
                    <span className="text-purple-700 flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Bonus Credits
                    </span>
                    <span className="font-semibold text-purple-900">
                      +{stats.bonusRemaining}
                    </span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(stats.remaining / stats.max) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {t('userMenu.used')} {stats.used}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">{t('userMenu.loading')}</p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                // Future: navigate to profile page
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              {t('userMenu.profileSettings')}
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              {t('userMenu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}