"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null)
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/")
    }
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-teal-500 text-white px-4 py-2 rounded-full font-bold text-sm">SwiftEd</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
              Home
            </Link>
            <Link href="/generate" className="text-gray-700 hover:text-teal-500 font-medium text-sm flex items-center gap-1">
              <span className="text-purple-600">✨</span> AI Roadmap
            </Link>
            <Link href="/courses" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
              Courses
            </Link>
            {user && (
              <Link href="/dashboard" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
                Dashboard
              </Link>
            )}
            <Link href="/about" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
              About Us
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Hi, {user.user_metadata?.username || "User"}</span>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 border-2 border-gray-200 text-gray-600 rounded-full font-medium text-sm hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2 border-2 border-teal-500 text-teal-500 rounded-full font-medium text-sm hover:bg-teal-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium text-sm hover:bg-teal-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <Link href="/" className="text-gray-700 hover:text-teal-500 font-medium">
              Home
            </Link>
            <Link href="/generate" className="text-gray-700 hover:text-teal-500 font-medium flex items-center gap-2">
              <span className="text-purple-600">✨</span> AI Roadmap
            </Link>
            <Link href="/courses" className="text-gray-700 hover:text-teal-500 font-medium">
              Courses
            </Link>
            {user && (
              <Link href="/dashboard" className="text-gray-700 hover:text-teal-500 font-medium">
                Dashboard
              </Link>
            )}
            <Link href="/about" className="text-gray-700 hover:text-teal-500 font-medium">
              About Us
            </Link>
            <div className="flex gap-2 pt-2">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-full font-medium text-sm text-center hover:bg-gray-50"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 px-4 py-2 border-2 border-teal-500 text-teal-500 rounded-full font-medium text-sm text-center hover:bg-teal-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-full font-medium text-sm text-center hover:bg-teal-600"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
