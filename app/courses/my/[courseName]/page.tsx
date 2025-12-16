"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useEffect, useState, use } from "react"
import { Loader2, BookOpen, Book, Video, Link as LinkIcon, FileText } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import type { CourseRoadmapResponse } from "@/ai/fullCourseGenerator"
import Link from "next/link"

export default function MyCoursePage({ params }: { params: Promise<{ courseName: string }> }) {
  const resolvedParams = use(params)
  const { user, isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const [courseData, setCourseData] = useState<CourseRoadmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'resources'>('roadmap')
  
  const courseName = decodeURIComponent(resolvedParams.courseName)

  useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated || !user) {
      toast.error("Please sign in to view your courses")
      router.push("/login")
      return
    }

    loadCourse()
  }, [initialized, resolvedParams.courseName, user])

  const loadCourse = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/user-courses?username=${encodeURIComponent(user.username)}`)
      if (!response.ok) {
        throw new Error("Failed to load courses")
      }
      const result = await response.json()
      const course = result.courses.find((c: any) => c.course_name === courseName)
      
      if (!course) {
        toast.error("Course not found")
        router.push("/courses")
        return
      }

      setCourseData(course.course_data)
      setSelectedChapter(0) // Select first chapter by default
    } catch (error) {
      console.error("Error loading course:", error)
      toast.error("Failed to load course")
      router.push("/courses")
    } finally {
      setLoading(false)
    }
  }

  const currentChapterResources = courseData && selectedChapter !== null
    ? courseData.resources[selectedChapter]
    : null

  if (!initialized || !isAuthenticated || loading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-teal-500" size={48} />
            <p className="text-gray-600">Loading course...</p>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (!courseData) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">Course not found</p>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Course Hero */}
      <section className="bg-teal-500">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-teal-100 mb-4">My Generated Course</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {courseName}
              </h1>
              <p className="text-teal-100 mb-8 text-lg">
                Course roadmap with recommended learning resources for each chapter
              </p>
            </div>
            <div className="bg-gray-200 rounded-3xl h-96 flex items-center justify-center">
              <img 
                src="/classroom-students-learning.jpg" 
                alt="Course" 
                className="w-full h-full object-cover rounded-3xl" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'roadmap'
                ? 'text-teal-500 border-b-2 border-teal-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="inline mr-2" size={18} />
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'resources'
                ? 'text-teal-500 border-b-2 border-teal-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Book className="inline mr-2" size={18} />
            Resources
          </button>
        </div>

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Course Roadmap</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseData.roadmap.chapters.map((chapter, idx) => (
                <div
                  key={chapter.chapterNumber}
                  onClick={() => {
                    setSelectedChapter(idx)
                    setActiveTab('resources')
                  }}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                      {chapter.chapterNumber}
                    </div>
                    <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">Click to view learning resources</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Study Resources</h2>
              {courseData.resources.length > 0 && (
                <select
                  value={selectedChapter ?? 0}
                  onChange={(e) => setSelectedChapter(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
                >
                  {courseData.resources.map((resource, idx) => (
                    <option key={idx} value={idx}>
                      Chapter {idx + 1}: {resource.chapterTitle}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {currentChapterResources && (
              <div className="space-y-8">
                {/* Textbooks */}
                {currentChapterResources.textbooks.length > 0 && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Book className="text-teal-500" size={28} />
                      Recommended Textbooks
                    </h3>
                    <div className="space-y-4">
                      {currentChapterResources.textbooks.map((textbook, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{textbook.title}</h4>
                          <p className="text-gray-600 mb-2">by {textbook.author} ({textbook.edition})</p>
                          <p className="text-gray-700 text-sm">{textbook.whyUseful}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {currentChapterResources.freeVideosOrLectures.filter((v) => v.url && v.url.startsWith("http")).length > 0 && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Video className="text-teal-500" size={28} />
                      Free Videos & Lectures
                    </h3>
                    <div className="space-y-4">
                    {currentChapterResources.freeVideosOrLectures
                      .filter((video) => video.url && video.url.startsWith("http"))
                      .map((video, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-1">{video.topic}</p>
                              <p className="text-sm text-gray-600 mb-2">Source: {video.source}</p>
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-500 hover:text-teal-600 flex items-center gap-2 text-sm"
                              >
                                <LinkIcon size={16} />
                                {video.url.startsWith('http') ? 'Watch Video' : video.url}
                              </a>
                              {video.description && (
                                <p className="text-xs text-gray-600 mt-2">
                                  {video.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles */}
                {currentChapterResources.articlesOrDocs.filter((a) => a.url && a.url.startsWith("http")).length > 0 && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <FileText className="text-teal-500" size={28} />
                      Articles & Documentation
                    </h3>
                    <div className="space-y-4">
                    {currentChapterResources.articlesOrDocs
                      .filter((article) => article.url && article.url.startsWith("http"))
                      .map((article, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-500 hover:text-teal-600 flex items-center gap-2 font-semibold"
                          >
                            <LinkIcon size={18} />
                            {article.title}
                          </a>
                          {article.description && (
                            <p className="text-xs text-gray-600 mt-2">
                              {article.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!currentChapterResources && courseData.resources.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No resources available yet.</p>
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

