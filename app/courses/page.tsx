"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Plus, Loader2, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import type { CourseRoadmapResponse } from "@/ai/fullCourseGenerator"

export default function CoursesPage() {
  const recentCourses = [
    { id: 2, title: "Linear Algebra", image: "/classroom-students-learning.jpg" },
    { id: 3, title: "Web Engineering", image: "/aws-architecture.jpg" },
    { id: 4, title: "Data Structures & Algorithms", image: "/mobile-development-workspace.jpg" },
    { id: 5, title: "Software Construction", image: "/aws-architecture.jpg" },
    { id: 6, title: "Cloud Computing", image: "/aws-architecture.jpg" },
    { id: 7, title: "Embedded Systems", image: "/students-studying-together-in-classroom.jpg" },
    { id: 8, title: "Database Systems", image: "/classroom-students-learning.jpg" },
    { id: 9, title: "Computer Networking", image: "/aws-architecture.jpg" },
    { id: 10, title: "Calculus", image: "/students-studying-together-in-classroom.jpg" },
    { id: 11, title: "Multivariable Calculus", image: "/classroom-students-learning.jpg" },
  ]

  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<"all" | "my">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [myCourses, setMyCourses] = useState<Array<{ id: string; title: string; image?: string; data: CourseRoadmapResponse; generatedAt: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingCourseName, setGeneratingCourseName] = useState<string | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [generationMode, setGenerationMode] = useState<'select' | 'general' | 'custom' | null>(null)
  const [selectedCourseForGeneration, setSelectedCourseForGeneration] = useState<string | null>(null)

  // Load saved courses from Supabase when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCourses()
    } else {
      setMyCourses([])
    }
  }, [isAuthenticated, user])

  const loadUserCourses = async () => {
    if (!user) return
    setLoadingCourses(true)
    try {
      const response = await fetch(`/api/user-courses?username=${encodeURIComponent(user.username)}`)
      if (!response.ok) {
        throw new Error("Failed to load courses")
      }
      const result = await response.json()
      const formattedCourses = result.courses.map((c: any) => ({
        id: c.id,
        title: c.course_name,
        image: c.image,
        data: c.course_data,
        generatedAt: c.created_at,
      }))
      setMyCourses(formattedCourses)
    } catch (error) {
      console.error("Failed to load user courses", error)
      toast.error("Failed to load your courses")
    } finally {
      setLoadingCourses(false)
    }
  }

  const filteredRecent = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return recentCourses.filter((c) => c.title.toLowerCase().includes(term))
  }, [recentCourses, searchTerm])

  const filteredMyCourses = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return myCourses.filter((c) => c.title.toLowerCase().includes(term))
  }, [myCourses, searchTerm])

  const handleGenerateMode = (courseName: string, mode: 'general' | 'custom') => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to generate courses")
      setTimeout(() => {
        window.location.href = "/login"
      }, 1500)
      return
    }

    if (mode === 'custom') {
      // For custom, we'll need to create a temporary course entry or use a special route
      // For now, redirect to a custom course generation page
      // We'll create a special route for this
      toast.info("Redirecting to custom course generator...")
      // Store the course name in sessionStorage for the custom page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('customCourseName', courseName)
        window.location.href = `/courses/custom`
      }
      return
    }

    // General course generation
    handleGenerateGeneral(courseName)
  }

  const handleGenerateGeneral = async (courseName: string) => {
    setIsGenerating(true)
    setGeneratingCourseName(courseName)
    setGenerationMode('general')
    try {
      const response = await fetch("/api/generate-full-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseName }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate course: ${response.status} ${response.statusText}`)
      }

      // Simple JSON parse (the endpoint streams SSE; for simplicity we'll buffer)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let finalCourse: CourseRoadmapResponse | null = null

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = JSON.parse(line.slice(6))
            if (payload.type === "complete") {
              finalCourse = payload.data as CourseRoadmapResponse
            }
          }
        }
      }

      if (!finalCourse) {
        throw new Error("Generation completed without course data")
      }

      // Save to Supabase
      const saveResponse = await fetch("/api/user-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          courseName,
          courseData: finalCourse,
          image: "/placeholder.jpg",
        }),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save course")
      }

      toast.success("Course generated and saved!")
      await loadUserCourses() // Reload courses
      setActiveTab("my")
      setSearchTerm("") // reset search
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate course"
      toast.error(msg)
    } finally {
      setIsGenerating(false)
      setGeneratingCourseName(null)
    }
  }

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
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, ready for your next lesson?</h1>
            <Link href="#" className="text-teal-500 hover:text-teal-600 font-medium text-sm">
              View history
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-3 py-2 rounded-full border-2 border-gray-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === "all" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                All Courses
              </button>
              <button
                onClick={() => setActiveTab("my")}
                className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === "my" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                My Courses
              </button>
            </div>
          </div>
        </div>

        {/* All Courses / My Courses */}
        {activeTab === "all" && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {filteredRecent.length > 0 ? (
              filteredRecent.map((course) => (
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
                      <p className="text-xs text-gray-600 mb-2">Click to generate roadmap and resources</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 bg-white border-2 border-gray-200 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">No courses found.</p>
                  {searchTerm && (
                    <p className="text-sm text-gray-600 mt-1">
                      Generate a course for "<span className="font-medium">{searchTerm}</span>"
                    </p>
                  )}
                </div>
                {generationMode === 'select' && selectedCourseForGeneration === searchTerm ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleGenerateMode(searchTerm || "Untitled Course", 'general')}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      <Plus size={16} />
                      Generate General Course
                    </button>
                    <button
                      onClick={() => handleGenerateMode(searchTerm || "Untitled Course", 'custom')}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-full font-medium hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      <Plus size={16} />
                      Generate Custom Course
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Please sign in to generate courses")
                        setTimeout(() => {
                          window.location.href = "/login"
                        }, 1500)
                      } else {
                        setGenerationMode('select')
                        setSelectedCourseForGeneration(searchTerm || "Untitled Course")
                      }
                    }}
                    disabled={!searchTerm || isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    {isGenerating && generatingCourseName === searchTerm ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Generate this course
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "my" && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {!isAuthenticated ? (
              <div className="col-span-3 bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
                <p className="font-semibold text-gray-900 mb-2">Please sign in to view your courses</p>
                <p className="text-sm text-gray-600 mb-4">Sign in to generate and save courses</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
                >
                  Sign In
                </Link>
              </div>
            ) : loadingCourses ? (
              <div className="col-span-3 bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
                <Loader2 className="animate-spin mx-auto mb-2 text-teal-500" size={24} />
                <p className="text-sm text-gray-600">Loading your courses...</p>
              </div>
            ) : filteredMyCourses.length > 0 ? (
              filteredMyCourses.map((course) => (
                <Link key={course.id} href={`/courses/my/${encodeURIComponent(course.title)}`} className="group">
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
                      <p className="text-xs text-gray-600 mb-2">Chapters: {course.data.roadmap.chapters.length}</p>
                      <p className="text-xs text-gray-500">Saved: {new Date(course.generatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 bg-white border-2 border-gray-200 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">No saved courses yet.</p>
                  <p className="text-sm text-gray-600 mt-1">Search a course and generate it to save here.</p>
                </div>
              </div>
            )}
          </div>
        )}


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
