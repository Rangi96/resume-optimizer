import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-white/80 mt-2">Last Updated: December 31, 2024</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">

          {/* Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              By accessing or using Resume Optimizer ("the Service"), operated by controlBIA LLC ("we," "our," or "us"),
              you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not
              access or use the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These Terms constitute a legally binding agreement between you and controlBIA LLC. Please read them carefully.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Eligibility</h2>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-gray-800">
                <strong>Age Requirement:</strong> You must be at least 18 years old to use Resume Optimizer.
                By using the Service, you represent and warrant that you are 18 years of age or older.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              You also represent that you have the legal authority to enter into these Terms and that you are not
              prohibited from using the Service under any applicable laws.
            </p>
          </section>

          {/* Account Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-3">When you create an account with Resume Optimizer, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Not share your account credentials with others</li>
              <li>Not create multiple accounts to circumvent usage limits or payment requirements</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
            </p>
          </section>

          {/* Acceptable Use Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceptable Use Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree NOT to use Resume Optimizer to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Violate any local, state, national, or international law</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Transmit viruses, malware, or other malicious code</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated scripts or bots to access the Service</li>
              <li>Resell, redistribute, or commercialize the Service without written permission</li>
              <li>Generate false, misleading, or fraudulent resume content</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Violation of this Acceptable Use Policy may result in immediate account suspension or termination without refund.
            </p>
          </section>

          {/* Service Description & AI Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Description & AI Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Resume Optimizer is an AI-powered tool that provides resume optimization suggestions, formatting, and analysis.
              The Service uses Anthropic Claude AI to generate recommendations based on your input.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">AI-Generated Content Disclaimer</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Not Professional Advice:</strong> Suggestions are AI-generated and should not be considered professional career counseling or legal advice</li>
                <li><strong>User Responsibility:</strong> You are solely responsible for reviewing, editing, and verifying all content before use</li>
                <li><strong>Accuracy Not Guaranteed:</strong> While we strive for accuracy, AI-generated content may contain errors or inaccuracies</li>
                <li><strong>No Employment Guarantee:</strong> Use of the Service does not guarantee job interviews, offers, or employment</li>
              </ul>
            </div>
          </section>

          {/* Subscription Plans & Payments */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Subscription Plans & Payments</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Payment Plans</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Resume Optimizer offers the following one-time payment plans:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>10 Exports Package:</strong> $3.00 USD - Includes 10 PDF/HTML/JSON exports</li>
              <li><strong>20 Exports Package:</strong> $5.00 USD - Includes 20 PDF/HTML/JSON exports</li>
            </ul>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">NO REFUNDS POLICY</h4>
              <p className="text-gray-800">
                <strong>All sales are final.</strong> We do not offer refunds, returns, or credits for partial use of purchased exports.
                By completing a purchase, you acknowledge and agree to this no-refunds policy. Please review your selection carefully
                before making a payment.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed">
              All payments are processed securely through Stripe. We do not store your credit card information.
              By providing payment information, you authorize us to charge the selected amount to your payment method.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Content</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              You retain all ownership rights to the content you upload to Resume Optimizer, including your resume text,
              work experience, education, and other personal information.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              By using the Service, you grant controlBIA LLC a limited, non-exclusive, worldwide license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Process your content through AI systems to provide optimization services</li>
              <li>Store your content in our databases for service delivery</li>
              <li>Use anonymized, aggregated data to improve the Service</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              This license terminates when you delete your content or account.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Our Content</h3>
            <p className="text-gray-700 leading-relaxed">
              The Resume Optimizer platform, including its design, code, features, and branding, is owned by controlBIA LLC
              and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute,
              or create derivative works without written permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Limitation of Liability</h2>

            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">"AS IS" Service</h4>
              <p className="text-gray-800">
                Resume Optimizer is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied,
                including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>To the maximum extent permitted by law, controlBIA LLC shall not be liable for:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions, errors, or data loss</li>
              <li>Third-party actions or content (including AI-generated content)</li>
              <li>Unauthorized access to your account or data</li>
              <li>Any damages arising from your use of the Service</li>
            </ul>

            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>In no event shall our total liability to you exceed the amount you paid for the Service in the
              twelve (12) months preceding the claim.</strong>
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Governing Law</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              United States, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Binding Arbitration</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-800 mb-3">
                <strong>Agreement to Arbitrate:</strong> Any dispute, claim, or controversy arising out of or relating to these Terms
                or the Service shall be resolved by binding arbitration administered by the American Arbitration Association (AAA)
                under its Commercial Arbitration Rules.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Location:</strong> Arbitration shall take place in Delaware, USA</li>
                <li><strong>Individual Basis:</strong> No class actions or representative actions are permitted</li>
                <li><strong>Costs:</strong> Each party shall bear its own costs and fees</li>
                <li><strong>Waiver of Jury Trial:</strong> You waive your right to a jury trial</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Exceptions</h3>
            <p className="text-gray-700 leading-relaxed">
              Either party may seek injunctive relief in court for intellectual property infringement or unauthorized access to systems.
            </p>
          </section>

          {/* Service Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Modifications & Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Modify, suspend, or discontinue the Service at any time without notice</li>
              <li>Change pricing for future purchases (existing purchases honored)</li>
              <li>Impose limits on features or usage</li>
              <li>Refuse service to anyone for any reason</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You may terminate your account at any time by contacting us. Termination does not entitle you to a refund.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by posting the new Terms
              on this page and updating the "Last Updated" date. For significant changes, we will email registered users.
              Continued use of Resume Optimizer after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <p className="text-gray-800 mb-3">
                If you have questions about these Terms of Service:
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

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or
              eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
