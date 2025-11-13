"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SwiftEd</h1>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-full font-medium text-sm transition-colors ${
                isLogin ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-full font-medium text-sm transition-colors ${
                !isLogin ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your Email Address"
                  className="w-full px-4 py-3 rounded-full border-2 border-teal-200 focus:outline-none focus:border-teal-500 placeholder-gray-400"
                />
              </div>
            )}

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

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-gray-700">Remember me</span>
                </label>
                <Link href="#" className="text-gray-700 hover:text-teal-500">
                  Forgot Password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
