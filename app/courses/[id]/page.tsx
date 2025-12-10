"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useEffect, useState, use } from "react"
import { Loader2, BookOpen, FileText, Book, Video, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import type { CourseRoadmapResponse } from "@/ai/fullCourseGenerator"

// Course mapping - maps course ID to course name
const courseMap: Record<string, string> = {
  "2": "Linear Algebra",
  "3": "Web Engineering",
  "4": "Data Structures & Algorithms",
  "5": "Software Construction",
  "6": "Cloud Computing",
  "7": "Embedded Systems",
  "8": "Database Systems",
  "9": "Computer Networking",
  "10": "Calculus",
  "11": "Multivariable Calculus",
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [courseData, setCourseData] = useState<CourseRoadmapResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'resources'>('roadmap')
  
  const courseName = courseMap[resolvedParams.id]
  const isGeneratableCourse = courseName !== undefined

  useEffect(() => {
    if (isGeneratableCourse && !courseData) {
      generateCourse()
    }
  }, [resolvedParams.id])

  const generateCourse = async () => {
    if (!courseName) return

    setLoading(true)
    try {
      const response = await fetch('/api/generate-full-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate course: ${response.status} ${response.statusText}`)
      }

      // Handle Server-Sent Events stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'progress') {
                // Update course data incrementally as sections complete
                setCourseData((prev) => {
                  // Merge new data with existing data
                  const updated = {
                    ...prev,
                    ...data.data,
                  } as CourseRoadmapResponse
                  
                  // Show toast for completed section
                  if (data.section === 'complete') {
                    toast.success('Course roadmap and resources generated!')
                  }
                  
                  return updated
                })
              } else if (data.type === 'complete') {
                // Final complete course
                setCourseData(data.data)
                setSelectedChapter(0) // Select first chapter by default
                if (data.cached) {
                  toast.success(`Course "${courseName}" loaded from cache!`)
                } else {
                  toast.success(`Course "${courseName}" generated successfully!`)
                }
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      let errorMessage = 'Failed to generate course'
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error: Could not connect to server. Please ensure the development server is running.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      console.error('Error generating course:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentChapterResources = courseData && selectedChapter !== null
    ? courseData.resources[selectedChapter]
    : null

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Course Hero */}
      <section className="bg-teal-500">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-teal-100 mb-4">
                {isGeneratableCourse ? `AI-Generated Course` : 'By Thermodynamics in Inspiration'}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {isGeneratableCourse ? courseName : 'Why Swift UI Should Be on the Radar of Every Mobile Developer'}
              </h1>
              <p className="text-teal-100 mb-8 text-lg">
                {isGeneratableCourse 
                  ? 'Course roadmap with recommended learning resources for each chapter'
                  : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempore incididunt ut labore et dolore tempor sint'
                }
              </p>
              {isGeneratableCourse && !courseData && (
                <button
                  onClick={generateCourse}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-500 rounded-full font-medium hover:bg-teal-50 disabled:bg-teal-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating Course...
                    </>
                  ) : (
                    <>
                      <BookOpen size={20} />
                      Generate Course Content
                    </>
                  )}
                </button>
              )}
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
      {courseData && (
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
                  {currentChapterResources.freeVideosOrLectures.length > 0 && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Video className="text-teal-500" size={28} />
                        Free Videos & Lectures
                      </h3>
                      <div className="space-y-4">
                        {currentChapterResources.freeVideosOrLectures.map((video, idx) => (
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
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Articles */}
                  {currentChapterResources.articlesOrDocs.length > 0 && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="text-teal-500" size={28} />
                        Articles & Documentation
                      </h3>
                      <div className="space-y-4">
                        {currentChapterResources.articlesOrDocs.map((article, idx) => (
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
      )}

      {/* Loading State */}
      {loading && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-teal-500" size={48} />
            <p className="text-gray-600">Generating course content... This may take a minute.</p>
          </div>
        </section>
      )}

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
