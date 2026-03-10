import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, FileText, CheckCircle, Zap, Target, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
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
            Tailor your resume to any job in minutes, using only skills you actually have.
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            AI tools make things up. This one only uses experience you have actually lived.
          </p>
        </div>

        {/* Section 2: Tool Preview */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Job Description Input */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">Job Description</label>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Paste the full job description here...
                </p>
                <div className="mt-3 space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-purple-600" />
                <label className="text-sm font-medium text-gray-700">Your Resume</label>
              </div>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 h-48 flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 font-medium">Click to upload PDF, Word, or Text file</p>
                <p className="text-xs text-gray-500 mt-2">Supported: .pdf, .doc, .docx, .txt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Output Mockup */}
        <div className="mb-20">
          <div className="bg-white rounded-xl shadow-md p-8 md:p-12 relative overflow-hidden">
            {/* Mockup container */}
            <div className="relative">
              {/* Before/After Resume Mockup */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Before */}
                <div className="relative">
                  <div className="absolute -top-2 -left-2 bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium">Before</div>
                  <div className="bg-gray-100 rounded-lg p-6 h-64 border border-gray-200">
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="relative">
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">After</div>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 h-64 border-2 border-blue-200 relative">
                    <div className="space-y-3">
                      <div className="h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded w-2/3"></div>
                      <div className="h-2 bg-blue-300 rounded w-1/2"></div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 bg-blue-200 rounded"></div>
                        <div className="h-2 bg-purple-200 rounded"></div>
                        <div className="h-2 bg-blue-200 rounded w-4/5"></div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 bg-purple-200 rounded"></div>
                        <div className="h-2 bg-blue-200 rounded w-3/4"></div>
                      </div>
                    </div>

                    {/* Annotation Labels */}
                    <div className="absolute -right-4 top-8 hidden md:flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-blue-400"></div>
                      <div className="bg-white border border-blue-300 px-3 py-1 rounded-full text-xs font-medium text-blue-700 shadow-sm whitespace-nowrap">
                        ATS Optimized
                      </div>
                    </div>
                    <div className="absolute -right-4 top-20 hidden md:flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-purple-400"></div>
                      <div className="bg-white border border-purple-300 px-3 py-1 rounded-full text-xs font-medium text-purple-700 shadow-sm whitespace-nowrap">
                        Verified Skills Only
                      </div>
                    </div>
                    <div className="absolute -right-4 top-32 hidden md:flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-blue-400"></div>
                      <div className="bg-white border border-blue-300 px-3 py-1 rounded-full text-xs font-medium text-blue-700 shadow-sm whitespace-nowrap">
                        Job Description Match
                      </div>
                    </div>
                    <div className="absolute -right-4 bottom-8 hidden md:flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-purple-400"></div>
                      <div className="bg-white border border-purple-300 px-3 py-1 rounded-full text-xs font-medium text-purple-700 shadow-sm whitespace-nowrap">
                        Instant Format
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile annotation labels */}
              <div className="md:hidden grid grid-cols-2 gap-3 mt-6">
                <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-xs font-medium text-blue-700 text-center">
                  ATS Optimized
                </div>
                <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg text-xs font-medium text-purple-700 text-center">
                  Verified Skills Only
                </div>
                <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-xs font-medium text-blue-700 text-center">
                  Job Description Match
                </div>
                <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg text-xs font-medium text-purple-700 text-center">
                  Instant Format
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: CTA Block */}
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-6">
            Unlock Your Tailored Resume
          </h2>

          <div className="max-w-md mx-auto mb-8 space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-left">ATS compatible format</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-left">Only your real skills and experience</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-left">Ready to download in minutes</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/app')}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Pay $9 to Tailor my Resume
          </button>
        </div>

        {/* Trust Icons Row */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>ATS Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
