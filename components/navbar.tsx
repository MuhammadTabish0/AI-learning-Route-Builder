"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Menu, X, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    router.push("/")
    setIsDropdownOpen(false)
  }

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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
            <Link href="/courses" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
              Courses
            </Link>
            <Link href="/membership" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
              Membership
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-teal-500 font-medium text-sm">
              About Us
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {getInitials(user.username)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                )}
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
            <Link href="/courses" className="text-gray-700 hover:text-teal-500 font-medium">
              Courses
            </Link>
            <Link href="/membership" className="text-gray-700 hover:text-teal-500 font-medium">
              Membership
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-teal-500 font-medium">
              About Us
            </Link>
            {isAuthenticated && user ? (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {getInitials(user.username)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
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
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
