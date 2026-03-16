import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, FileText, CheckCircle, Zap, Target, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../AuthContext';
import LoginModal from '../components/LoginModal';
import UserMenu from '../components/UserMenu';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const { t } = useTranslation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Capture referral codes from URL before auth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get('ref');
    if (referralCode) {
      localStorage.setItem('pending_referral', referralCode);
      console.log('🔗 Referral code stored:', referralCode);
    }
  }, []);

  // Handle navigation after login when user data is fully loaded
  useEffect(() => {
    console.log('🔍 Landing navigation check:', {
      justLoggedIn,
      loading,
      hasUser: !!user,
      paymentStatus: user?.paymentStatus
    });

    if (justLoggedIn && !loading && user && user.paymentStatus) {
      console.log('✅ Navigating after login, payment status:', user.paymentStatus);
      setJustLoggedIn(false);

      if (user.paymentStatus === 'premium_10' || user.paymentStatus === 'premium_20') {
        // User already paid, go straight to app
        console.log('✅ Premium user - navigating to /app');
        localStorage.removeItem('payment_intent');
        navigate('/app');
      } else {
        // User needs to pay
        console.log('⚠️ Non-premium user - navigating to /app?payment_required=true');
        navigate('/app?payment_required=true');
      }
    }
  }, [user, justLoggedIn, loading, navigate]);

  const handleCTAClick = () => {
    if (!user) {
      // Set payment intent before login
      localStorage.setItem('payment_intent', 'true');
      setShowLoginModal(true);
    } else if (user.paymentStatus === 'premium_10' || user.paymentStatus === 'premium_20') {
      // User already paid, go straight to app
      navigate('/app');
    } else {
      // User logged in but hasn't paid
      navigate('/app?payment_required=true');
    }
  };

  const handleLoginSuccess = () => {
    // Close modal and set flag - navigation will happen in useEffect when user data loads
    console.log('🔓 handleLoginSuccess called - setting justLoggedIn to true');
    setShowLoginModal(false);
    setJustLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7" />
              <div>
                <h1 className="text-2xl font-bold">{t('app.title')}</h1>
                <p className="text-sm text-blue-100">{t('app.tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('landing.signIn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">

        {/* Section 1: Hero */}
        <div className="text-center mb-20">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-medium text-gray-900 leading-relaxed max-w-4xl mx-auto mb-6">
            {t('landing.hero.headline')}
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            {t('landing.hero.subtext')}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleCTAClick}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {t('landing.hero.cta')}
          </button>
        </div>

        {/* Section 2: Tool Preview */}
        <div className="mb-16">
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Job Description Input */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-medium text-gray-700">{t('landing.toolPreview.jobDescription.label')}</label>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 h-24">
                <p className="text-xs text-gray-500">
                  {t('landing.toolPreview.jobDescription.placeholder')}
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-3/5"></div>
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-purple-600" />
                <label className="text-xs font-medium text-gray-700">{t('landing.toolPreview.resume.label')}</label>
              </div>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-3 h-24 flex flex-col items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-xs text-gray-600 font-medium">{t('landing.toolPreview.resume.uploadButton')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('landing.toolPreview.resume.formats')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Output Mockup */}
        <div className="mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-medium text-gray-900 text-center mb-8">
              {t('landing.difference.title')}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-4 text-center">{t('landing.difference.before')}</div>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-full mt-4"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-full mt-3"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-1.5 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>

              {/* After */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border-2 border-blue-200 relative">
                <div className="text-xs font-medium text-blue-700 mb-4 text-center">{t('landing.difference.after')}</div>
                <div className="space-y-3">
                  <div className="h-2 bg-blue-400 rounded w-3/4"></div>
                  <div className="h-2 bg-purple-400 rounded w-1/2"></div>
                  <div className="h-1.5 bg-blue-300 rounded w-full mt-4"></div>
                  <div className="h-1.5 bg-purple-300 rounded w-5/6"></div>
                  <div className="h-1.5 bg-blue-300 rounded w-4/5"></div>
                  <div className="h-1.5 bg-purple-300 rounded w-full mt-3"></div>
                  <div className="h-1.5 bg-blue-300 rounded w-3/4"></div>
                  <div className="h-1.5 bg-purple-300 rounded w-5/6"></div>
                </div>
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Key features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              <div className="bg-white border border-blue-200 px-3 py-2 rounded-lg text-xs font-medium text-blue-700 text-center">
                {t('landing.difference.features.atsOptimized')}
              </div>
              <div className="bg-white border border-purple-200 px-3 py-2 rounded-lg text-xs font-medium text-purple-700 text-center">
                {t('landing.difference.features.verifiedSkills')}
              </div>
              <div className="bg-white border border-blue-200 px-3 py-2 rounded-lg text-xs font-medium text-blue-700 text-center">
                {t('landing.difference.features.jobMatch')}
              </div>
              <div className="bg-white border border-purple-200 px-3 py-2 rounded-lg text-xs font-medium text-purple-700 text-center">
                {t('landing.difference.features.instantFormat')}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: CTA Block */}
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-6">
            {t('landing.cta.title')}
          </h2>

          <div className="max-w-md mx-auto mb-8 space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-left">{t('landing.cta.benefits.atsFormat')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-left">{t('landing.cta.benefits.realSkills')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-left">{t('landing.cta.benefits.readyDownload')}</span>
            </div>
          </div>

          <button
            onClick={handleCTAClick}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {t('landing.cta.button')}
          </button>
        </div>

        {/* Trust Icons Row */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>{t('landing.trust.securePayment')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{t('landing.trust.instantAccess')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{t('landing.trust.atsOptimized')}</span>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
