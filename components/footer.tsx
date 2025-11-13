"use client"

import Link from "next/link"
import { useState } from "react"

export function Footer() {
  const [email, setEmail] = useState("")

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="bg-teal-500 text-white px-4 py-2 rounded-full font-bold text-sm inline-block mb-4">
              SwiftEd
            </div>
            <p className="text-gray-400 text-sm">Learn With AI</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-300 text-sm mb-4">Subscribe to get our Newsletter</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 text-sm"
              />
              <button className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium text-sm hover:bg-teal-600">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <div className="flex gap-6 mb-4 md:mb-0">
            <Link href="#" className="hover:text-white">
              Careers
            </Link>
            <Link href="#" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms & Conditions
            </Link>
          </div>
          <p>© 2025 Class Technologies Inc.</p>
        </div>
      </div>
    </footer>
  )
}
