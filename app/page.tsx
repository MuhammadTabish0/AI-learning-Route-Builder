"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { BookOpen, Zap, Users } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with Cyan Background */}
      <section className="relative bg-teal-500 px-4 py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="text-orange-400">SwiftEd</span> Online is now
                <br />
                much easier
              </h1>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-teal-700 text-white rounded-full font-medium hover:bg-teal-800 transition"
                >
                  Join for free
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-teal-500 rounded-full font-medium hover:bg-gray-100 transition gap-2"
                >
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">▶</span>
                  </div>
                  Watch how it works
                </Link>
              </div>
            </div>

            {/* Right Floating Cards */}
            <div className="relative h-80 hidden md:block">
              {/* Card 1: 250k Students */}
              <div className="absolute top-0 right-0 bg-white rounded-xl p-4 shadow-lg w-48">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">📚</div>
                  <div>
                    <p className="text-xs text-gray-600">250k</p>
                    <p className="text-sm font-semibold text-gray-900">Assisted Students</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Congratulations */}
              <div className="absolute top-24 right-24 bg-white rounded-xl p-4 shadow-lg w-48">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">🎉</div>
                  <div>
                    <p className="text-xs text-gray-600">Congratulations</p>
                    <p className="text-sm font-semibold text-gray-900">Your Custom Roadmap is Ready</p>
                  </div>
                </div>
              </div>

              {/* Card 3: AI Driven */}
              <div className="absolute bottom-0 left-0 bg-white rounded-xl p-4 shadow-lg w-56">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/placeholder.svg" alt="AI" className="w-8 h-8 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-xs text-gray-600">AI Driven</p>
                    <p className="text-sm font-semibold text-gray-900">Latest AI Models</p>
                  </div>
                </div>
                <Link href="/signup" className="block mt-3 px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 w-full text-center">
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,40 Q300,0 600,40 T1200,40 L1200,120 L0,120 Z" fill="white" />
        </svg>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            All-In-One <span className="text-teal-500">Cloud Software.</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This is one powerful online software suite that combines all the tools needed successfully master a skill
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Study Roadmaps</h3>
            <p className="text-gray-600 text-sm">
              Follow personalized study plans that guide you through topics and chapters step-by-step, Never lose track
              of what to learn next.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Generated Summaries & Quizzes</h3>
            <p className="text-gray-600 text-sm">
              Get instant chapter summaries, practice questions, and concept explanations powered by AI to help you
              master topics faster.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking & Insights</h3>
            <p className="text-gray-600 text-sm">
              Visualize your learning journey with detailed progress charts, analytics, and stay motivated with detailed
              progress insights.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What is SwiftEd?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The main purpose of this website is to provide students with a personalized learning assistant and roadmap
              generator for academic subjects. Instead of struggling with unstructured study materials, learners will
              receive an organized roadmap, AI-generated summaries, practice questions, progress tracking, and curated
              external resources.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center mt-1">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Everything you need to study smarter, you can do with StudyPath
                  </h3>
                  <p className="text-gray-600 text-sm">
                    StudyPath helps students learn efficiently with personalized study roadmaps, AI-generated chapter
                    summaries, quizzes, and progress tracking – all in one simple, cloud-based platform.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/about" className="inline-block mt-6 text-teal-500 font-medium text-sm hover:text-teal-600">
              Learn more →
            </Link>
          </div>

          {/* Right Animated Section */}
          <div className="relative h-96">
            <style>{`
              @keyframes float-up-down {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
              }
              @keyframes rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes pulse-scale {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
              }
              .animate-float { animation: float-up-down 3s ease-in-out infinite; }
              .animate-float-delay-1 { animation: float-up-down 3s ease-in-out infinite 0.5s; }
              .animate-float-delay-2 { animation: float-up-down 3s ease-in-out infinite 1s; }
              .animate-rotate { animation: rotate 20s linear infinite; }
              .animate-pulse-slow { animation: pulse-scale 2s ease-in-out infinite; }
            `}</style>

            <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* Background glow */}
              <circle cx="200" cy="200" r="150" fill="url(#grad)" opacity="0.1" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Central Book - Animated */}
              <g className="animate-float" style={{ transformOrigin: "200px 200px" }}>
                <rect x="170" y="150" width="60" height="100" fill="#14b8a6" rx="4" />
                <line x1="200" y1="150" x2="200" y2="250" stroke="#06b6d4" strokeWidth="2" />
                <rect x="175" y="160" width="50" height="8" fill="#ffffff" opacity="0.3" rx="2" />
                <rect x="175" y="175" width="50" height="6" fill="#ffffff" opacity="0.2" rx="1" />
                <rect x="175" y="187" width="50" height="6" fill="#ffffff" opacity="0.2" rx="1" />
              </g>

              {/* Lightbulb - Top Right */}
              <g className="animate-float-delay-1" style={{ transformOrigin: "320px 100px" }}>
                <circle cx="320" cy="100" r="20" fill="#fbbf24" opacity="0.9" />
                <rect x="310" y="115" width="20" height="15" fill="#f59e0b" rx="2" />
                <line x1="312" y1="130" x2="328" y2="130" stroke="#f59e0b" strokeWidth="2" />
              </g>

              {/* Rocket - Top Left */}
              <g className="animate-float-delay-2" style={{ transformOrigin: "80px 120px" }}>
                <path d="M 80 80 L 85 120 L 80 125 L 75 120 Z" fill="#ef4444" />
                <circle cx="80" cy="70" r="12" fill="#3b82f6" />
                <ellipse cx="70" cy="130" rx="6" ry="10" fill="#f59e0b" opacity="0.7" />
                <ellipse cx="90" cy="130" rx="6" ry="10" fill="#f59e0b" opacity="0.7" />
              </g>

              {/* Brain Icon - Bottom Right */}
              <g className="animate-pulse-slow" style={{ transformOrigin: "300px 300px" }}>
                <circle cx="300" cy="300" r="18" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.5" />
                <path
                  d="M 290 295 Q 285 290 290 285 Q 295 290 300 285 Q 305 290 310 285 Q 315 290 310 295"
                  fill="#06b6d4"
                  opacity="0.7"
                />
                <line x1="295" y1="305" x2="295" y2="315" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
                <line x1="305" y1="305" x2="305" y2="315" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              </g>

              {/* Checkmark - Bottom Left */}
              <g className="animate-float" style={{ transformOrigin: "100px 300px", animationDelay: "1.5s" }}>
                <circle cx="100" cy="300" r="20" fill="#10b981" opacity="0.8" />
                <path
                  d="M 90 300 L 97 310 L 115 290"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Decorative dots */}
              <g className="animate-rotate" style={{ transformOrigin: "200px 200px" }}>
                <circle cx="200" cy="80" r="3" fill="#14b8a6" opacity="0.6" />
                <circle cx="320" cy="200" r="3" fill="#06b6d4" opacity="0.6" />
                <circle cx="200" cy="320" r="3" fill="#14b8a6" opacity="0.6" />
                <circle cx="80" cy="200" r="3" fill="#06b6d4" opacity="0.6" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block bg-teal-500 rounded-full px-4 py-2 mb-6">
            <span className="text-white text-sm font-medium">Learn With AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Master Any Subject?</h2>
          <p className="text-gray-300 mb-8">
            Subscribe to our newsletter and get exclusive updates, study tips, and new features delivered to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your Email"
              className="flex-1 px-4 py-3 rounded-full bg-slate-800 text-white placeholder-gray-400 border border-slate-700 focus:outline-none focus:border-teal-500"
            />
            <button className="px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
