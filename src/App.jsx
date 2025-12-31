import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import MainApp from './pages/MainApp';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';

/**
 * AppContent component handles routing and conditional footer rendering
 * Uses useLocation hook to determine current route
 */
function AppContent() {
  const location = useLocation();

  // Footer should only appear on main app page, not on legal pages
  const isLegalPage = location.pathname === '/privacy' || location.pathname === '/terms';

  return (
    <>
      {/* Main Routes */}
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>

      {/* Footer - Only on main app */}
      {!isLegalPage && <Footer />}

      {/* Cookie Consent - On all pages */}
      <CookieConsent />
    </>
  );
}

/**
 * Main App component
 * Wraps the entire application in BrowserRouter for client-side routing
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
