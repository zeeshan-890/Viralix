import Link from 'next/link'
import { Button } from '../src/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">AutoReach AI</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Social Media
            <span className="text-blue-600 block">Automation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, optimize, and schedule content across TikTok, YouTube, Instagram, and LinkedIn
            with the power of AI. Save time and boost engagement with intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg bg-white shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Content Generation</h3>
            <p className="text-gray-600">
              Generate engaging captions, hashtags, and CTAs optimized for each platform using advanced AI.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-white shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-gray-600">
              Schedule posts at optimal times across all platforms with intelligent timing recommendations.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-white shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 002-2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
            <p className="text-gray-600">
              Track performance across platforms with detailed analytics and AI-powered insights.
            </p>
          </div>
        </div>

        {/* Platform Support */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Supports All Major Platforms
          </h2>
          <div className="flex justify-center items-center space-x-8 grayscale opacity-60">
            <div className="text-2xl font-bold">TikTok</div>
            <div className="text-2xl font-bold">YouTube</div>
            <div className="text-2xl font-bold">Instagram</div>
            <div className="text-2xl font-bold">LinkedIn</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Supercharge Your Social Media?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators and businesses using AutoReach AI to grow their audience.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-50">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-4">AutoReach AI</div>
            <p className="text-gray-600 mb-4">
              AI-powered social media management for the modern creator.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-700">Terms of Service</Link>
              <Link href="/support" className="hover:text-gray-700">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
