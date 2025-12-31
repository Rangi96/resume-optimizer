import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-white/80 mt-2">Last Updated: December 31, 2024</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              controlBIA LLC ("we," "our," or "us") operates Resume Optimizer, an AI-powered resume optimization platform.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              We are committed to protecting your privacy and ensuring GDPR and CCPA compliance.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Email address, name, and profile picture from Google OAuth authentication</li>
              <li><strong>Resume Content:</strong> Resume text, work experience, education, skills, and other career information you provide</li>
              <li><strong>Job Descriptions:</strong> Job posting text you input for tailored optimization</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Optimization history and token usage</li>
              <li>Feature usage patterns (templates selected, exports generated)</li>
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Cookies and Tracking</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Essential Cookies:</strong> Required for authentication, security, and core functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand usage patterns (optional, requires consent)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences (optional)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide resume optimization services using AI technology</li>
              <li>Manage your account and authentication</li>
              <li>Process payments and maintain billing records</li>
              <li>Improve our service and develop new features</li>
              <li>Communicate important updates and respond to support requests</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the following third-party services to operate Resume Optimizer:</p>

            <div className="grid gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Firebase (Google Cloud)</h4>
                <p className="text-sm text-gray-700">
                  <strong>Purpose:</strong> Authentication and database (Firestore)<br/>
                  <strong>Data Shared:</strong> Email, name, user ID, optimization records<br/>
                  <strong>Location:</strong> United States (Google Cloud servers)
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Anthropic Claude API</h4>
                <p className="text-sm text-gray-700">
                  <strong>Purpose:</strong> AI-powered resume optimization and suggestions<br/>
                  <strong>Data Shared:</strong> Resume text and job descriptions (temporarily processed)<br/>
                  <strong>Retention:</strong> Not stored by Anthropic after processing
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Stripe</h4>
                <p className="text-sm text-gray-700">
                  <strong>Purpose:</strong> Payment processing<br/>
                  <strong>Data Shared:</strong> Email, payment details<br/>
                  <strong>Security:</strong> PCI DSS Level 1 compliant
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Vercel</h4>
                <p className="text-sm text-gray-700">
                  <strong>Purpose:</strong> Application hosting and serverless functions<br/>
                  <strong>Data Shared:</strong> Request logs, IP addresses<br/>
                  <strong>Location:</strong> United States
                </p>
              </div>
            </div>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your data is stored securely in Firebase Firestore (Google Cloud) with the following protections:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encrypted in transit using TLS/SSL (HTTPS)</li>
              <li>Encrypted at rest on Google Cloud servers</li>
              <li>Access controls and authentication required</li>
              <li>Regular security audits and updates</li>
            </ul>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4">
              <p className="text-sm text-gray-800">
                <strong>Data Retention:</strong> We retain your data while your account is active. Accounts inactive for 90 days
                may have data deleted. You can request immediate deletion at any time.
              </p>
            </div>
          </section>

          {/* Your Rights (GDPR/CCPA) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Rights (GDPR/CCPA)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under GDPR (for EU residents) and CCPA (for California residents), you have the following rights:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1">Right to Access</h4>
                <p className="text-sm text-gray-700">Request a copy of all personal data we hold about you</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1">Right to Rectification</h4>
                <p className="text-sm text-gray-700">Correct inaccurate or incomplete data</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1">Right to Deletion ("Right to be Forgotten")</h4>
                <p className="text-sm text-gray-700">Request complete deletion of your account and data</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1">Right to Data Portability</h4>
                <p className="text-sm text-gray-700">Receive your data in a structured, machine-readable format (JSON)</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1">Right to Opt-Out</h4>
                <p className="text-sm text-gray-700">Opt-out of analytics and non-essential data processing</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1">Right to Object</h4>
                <p className="text-sm text-gray-700">Object to specific data processing activities</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>To exercise these rights,</strong> contact us at{' '}
              <a href="mailto:jorge.rangel@controlbia.com" className="text-blue-600 hover:underline">
                jorge.rangel@controlbia.com
              </a>.
              We will respond within 30 days as required by law.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Children's Privacy</h2>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-gray-800">
                <strong>Age Requirement:</strong> Resume Optimizer is intended for users 18 years or older.
                We do not knowingly collect information from individuals under 18. If you become aware that a child
                has provided us with personal information, please contact us immediately.
              </p>
            </div>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be processed and stored in the United States. If you are accessing Resume Optimizer
              from outside the United States, please be aware that your information may be transferred to, stored,
              and processed by us and our service providers in the United States. We ensure appropriate safeguards
              are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting the new Privacy Policy on this page and updating the "Last Updated" date. For material changes,
              we will email registered users. Continued use of Resume Optimizer after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <p className="text-gray-800 mb-3">
                If you have questions about this Privacy Policy or wish to exercise your rights:
              </p>
              <p className="text-gray-900">
                <strong>controlBIA LLC</strong><br/>
                Email: <a href="mailto:jorge.rangel@controlbia.com" className="text-blue-600 hover:underline font-semibold">
                  jorge.rangel@controlbia.com
                </a><br/>
                Response Time: Within 30 days
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
