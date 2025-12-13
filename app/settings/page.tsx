"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { User, Mail, BookOpen, CreditCard } from "lucide-react"

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-6">
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="text-teal-500" size={20} />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {user.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <BookOpen size={16} />
                  Account Type
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {user.accountType}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <CreditCard size={16} />
                  Subscription Plan
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {user.subscriptionPlan}
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              More settings options coming soon...
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

