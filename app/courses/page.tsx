"use client"

import { useState, useEffect } from "react"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ChevronRight, ChevronLeft } from "lucide-react"

export default function CoursesPage() {
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (response.ok) {
          const data = await response.json();
          setRecentCourses(data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = [
    { name: "Design", icon: "✏️", color: "bg-emerald-100" },
    { name: "Development", icon: "💻", color: "bg-purple-100" },
    { name: "Development", icon: "📱", color: "bg-blue-100" },
    { name: "Business", icon: "💼", color: "bg-teal-100" },
    { name: "Marketing", icon: "📊", color: "bg-yellow-100" },
    { name: "Photography", icon: "📷", color: "bg-red-100" },
    { name: "Acting", icon: "🎬", color: "bg-gray-100" },
    { name: "Business", icon: "💼", color: "bg-teal-100" },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <Navbar />

      {/* Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, ready for your next lesson?</h1>
          <Link href="#" className="text-teal-500 hover:text-teal-600 font-medium text-sm">
            View history
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {recentCourses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-200 relative overflow-hidden">
                  <img
                    src={course.image || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{course.title}</h3>
                  <p className="text-xs text-gray-600 mb-4 flex items-center gap-2">
                    <img src="/diverse-avatars.png" alt="instructor" className="w-4 h-4 rounded-full" />
                    <span>{course.instructor}</span>
                  </p>
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full"
                      style={{ width: `${(course.progress / course.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Lesson {course.progress} of {course.total}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Choice favourite course from top category</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-teal-500 text-white hover:bg-teal-600">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 rounded-full bg-teal-500 text-white hover:bg-teal-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className={`${category.color} rounded-2xl p-8 text-center hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-600 mt-2">
                Unlock your potential in {category.name.toLowerCase()} with comprehensive courses and hands-on learning
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white px-4 py-16 mt-16">
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
