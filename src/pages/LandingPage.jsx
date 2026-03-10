import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 flex items-center justify-center px-4 py-12">
      {/* Frosted Glass Card Container */}
      <div className="max-w-3xl w-full">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 md:p-16">

          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Content Container with Gradient Background Accent */}
          <div className="relative">
            {/* Subtle gradient wash behind content */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-100/30 via-transparent to-blue-100/30 rounded-2xl -z-10 blur-2xl"></div>

            <div className="space-y-8 text-center">
              {/* Headline */}
              <h1 className="text-2xl md:text-4xl font-medium text-gray-900 leading-relaxed max-w-2xl mx-auto">
                Tailor your resume to any job in minutes, using only skills you actually have.
              </h1>

              {/* Differentiator */}
              <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
                AI tools make things up. This one only uses experience you've actually lived.
              </p>

              {/* CTA Button */}
              <div className="pt-4">
                <button
                  onClick={() => navigate('/app')}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5"
                >
                  Tailor my resume for $9
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
