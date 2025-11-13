"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function CoursePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Course Hero */}
      <section className="bg-teal-500">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-teal-100 mb-4">By Thermodynamics in Inspiration</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Swift UI Should Be on the Radar of Every Mobile Developer
              </h1>
              <p className="text-teal-100 mb-8 text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempore incididunt ut labore et
                dolore tempor sint
              </p>
              <Link
                href="#"
                className="inline-block px-8 py-3 bg-white text-teal-500 rounded-full font-medium hover:bg-teal-50"
              >
                Start learning now
              </Link>
            </div>
            <div className="bg-gray-200 rounded-3xl h-96 flex items-center justify-center">
              <img src="/mobile-development-workspace.jpg" alt="Course" className="w-full h-full object-cover rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 md:p-16 text-center">
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
