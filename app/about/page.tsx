"use client"

import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What is SwiftEd?</h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            The main purpose of this website is to provide students with a personalized learning assistant and roadmap
            generator for academic subjects. Instead of struggling with unstructured study materials, learners will
            receive an organized roadmap, AI-generated summaries, practice questions, progress tracking, and curated
            external resources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="bg-green-100 rounded-3xl p-8 mb-6 inline-block">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                ✓
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Everything you need to study smarter, you can do with StudyPath
            </h2>
            <p className="text-gray-600 mb-6">
              StudyPath helps students learn efficiently with personalized study roadmaps, AI-generated chapter
              summaries, practice questions, quizzes, and progress tracking – all in one simple, cloud-based platform.
            </p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
            >
              Learn more
            </Link>
          </div>
          <div className="bg-gray-200 rounded-3xl h-96 flex items-center justify-center overflow-hidden">
            <img src="/classroom-students-learning.jpg" alt="Students learning" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Learn Smarter, Anywhere</h2>
            <p className="text-gray-300 text-base mb-8">
              SwiftEd brings personalized roadmaps, AI summaries, and quizzes to your screen – making online learning
              focused and engaging
            </p>
            <button className="px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600">
              Start learning now
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
