import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Github, FileText, Shield, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content - 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.title')}</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/controlBIA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/controlbia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/controlBIA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <Shield className="w-4 h-4" />
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <a
                  href="#cookie-settings"
                  onClick={(e) => {
                    e.preventDefault();
                    // Trigger cookie consent modal (will be implemented in CookieConsent component)
                    localStorage.removeItem('cookieConsent');
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.cookieSettings')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:Contact@controlbia.com"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  {t('footer.contactEmail')}
                </a>
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="text-gray-300">{t('footer.company')}</strong> {t('footer.companyName')}
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="text-gray-300">{t('footer.location')}</strong> {t('footer.locationValue')}
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="text-gray-300">{t('footer.responseTime')}</strong> {t('footer.responseTimeValue')}
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.resources')}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.anthropic.com/claude"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.poweredBy')}
                </a>
              </li>
              <li>
                <a
                  href="https://firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.firebase')}
                </a>
              </li>
              <li>
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.stripe')}
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.vercel')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          {/* Bottom Footer - Copyright & Additional Info */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              &copy; {currentYear} <strong className="text-gray-300">{t('footer.companyName')}</strong>. {t('footer.copyright')}
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span>{t('footer.madeWithAI')}</span>
              <span>•</span>
              <span>{t('footer.gdpr')}</span>
              <span>•</span>
              <span>{t('footer.dataProtected')}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 max-w-3xl mx-auto">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
