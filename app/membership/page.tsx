"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Check } from "lucide-react"
import Link from "next/link"

export default function MembershipPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "Forever",
      features: ["Compatible on web & iOS system", "Sami-boosting landing page", "Awesome Feather icons pack"],
      cta: "Try for free",
      highlighted: false,
    },
    {
      name: "Individual",
      price: "$24",
      period: "per month",
      features: [
        "Compatible on web & iOS system",
        "Sami-boosting landing page",
        "Themed trio 2 different styles",
        "Themed trio 2 different styles",
        "API help to learn Figma",
      ],
      cta: "Regular License",
      highlighted: true,
    },
    {
      name: "Corporate",
      price: "$12",
      period: "per month",
      features: [
        "Compatible on web & iOS system",
        "Sami-boosting landing page",
        "Themed trio 2 different styles",
        "Themed trio 2 different styles",
        "API help to learn Figma",
      ],
      cta: "Extended License",
      highlighted: false,
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-teal-500 mb-4">Affordable pricing</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-teal-50 to-teal-100 border-2 border-teal-500"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600 text-sm ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-full font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-teal-500 text-white hover:bg-teal-600"
                    : "border-2 border-teal-500 text-teal-500 hover:bg-teal-50"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
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
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
            >
              Start learning now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
