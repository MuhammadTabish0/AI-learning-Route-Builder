"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SwiftEd</h1>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your Email Address"
                className="w-full px-4 py-3 rounded-full border-2 border-teal-200 focus:outline-none focus:border-teal-500 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">User name</label>
              <input
                type="text"
                placeholder="Enter your User name"
                className="w-full px-4 py-3 rounded-full border-2 border-teal-200 focus:outline-none focus:border-teal-500 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  className="w-full px-4 py-3 rounded-full border-2 border-teal-200 focus:outline-none focus:border-teal-500 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
            >
              Register
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
