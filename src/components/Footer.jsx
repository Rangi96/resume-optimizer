import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, FileText, Shield, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content - 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Resume Optimizer</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              AI-powered resume optimization platform by controlBIA LLC. Transform your resume with intelligent suggestions and professional templates.
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
            <h3 className="text-lg font-bold mb-4 text-white">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Terms of Service
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
                  Cookie Settings
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:jorge.rangel@controlbia.com"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  jorge.rangel@controlbia.com
                </a>
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="text-gray-300">Company:</strong> controlBIA LLC
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="text-gray-300">Location:</strong> United States
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="text-gray-300">Response Time:</strong> Within 30 days
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.anthropic.com/claude"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Powered by Anthropic Claude
                </a>
              </li>
              <li>
                <a
                  href="https://firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Firebase by Google
                </a>
              </li>
              <li>
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Payments by Stripe
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Hosted on Vercel
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
              &copy; {currentYear} <strong className="text-gray-300">controlBIA LLC</strong>. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span>Made with AI</span>
              <span>•</span>
              <span>GDPR & CCPA Compliant</span>
              <span>•</span>
              <span>Data Protected</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 max-w-3xl mx-auto">
              Resume Optimizer provides AI-generated suggestions. Review all content before use.
              We do not guarantee employment outcomes. See{' '}
              <Link to="/terms" className="text-gray-400 hover:text-white underline">
                Terms of Service
              </Link>
              {' '}for details.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
