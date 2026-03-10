import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Tailor your resume to any job in minutes — using only skills you actually have.
        </h1>

        {/* Differentiator */}
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
          AI tools make things up. This one only uses experience you've actually lived.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/app')}
          className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl md:text-2xl font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
        >
          Tailor my resume — $9
        </button>
      </div>
    </div>
  );
}
