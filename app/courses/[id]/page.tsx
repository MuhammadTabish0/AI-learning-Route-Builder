"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useEffect, useState, use } from "react"
import { Loader2, BookOpen, FileText, Book, Video, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import type { CourseRoadmapResponse } from "@/ai/fullCourseGenerator"
import Link from "next/link"

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
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [courseData, setCourseData] = useState<CourseRoadmapResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'resources'>('roadmap')
  const [generationMode, setGenerationMode] = useState<'select' | 'general' | 'custom' | 'questions' | 'generating'>('select')
  const [questions, setQuestions] = useState<Array<{questionId: number; question: string; type: 'single' | 'multiple'; options: string[]}>>([])
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  const courseName = courseMap[resolvedParams.id]
  const isGeneratableCourse = courseName !== undefined

  useEffect(() => {
    // Don't auto-generate, wait for user to choose mode
  }, [resolvedParams.id])

  const fetchQuestions = async () => {
    if (!courseName) return
    
    // Check authentication for custom course
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to generate custom courses")
      setTimeout(() => {
        router.push("/login")
      }, 1500)
      return
    }
    
    setLoading(true)
    setGenerationMode('questions')
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status}`)
      }

      const result = await response.json()
      setQuestions(result.questions)
      setCurrentQuestionIndex(0)
      setAnswers({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions'
      toast.error(errorMessage)
      setGenerationMode('select')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // All questions answered, generate custom course
      generateCustomCourse()
    }
  }

  const generateCustomCourse = async () => {
    if (!courseName) return

    setLoading(true)
    setGenerationMode('generating')
    try {
      const response = await fetch('/api/generate-custom-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName, responses: answers }),
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
                // Show progress message
                if (data.message) {
                  toast.info(data.message)
                }
              } else if (data.type === 'complete') {
                // Final complete course
                setCourseData(data.data)
                setSelectedChapter(0) // Select first chapter by default
                setGenerationMode('select')
                
                // Save custom course to Supabase if user is authenticated
                if (isAuthenticated && user) {
                  try {
                    const saveResponse = await fetch("/api/user-courses", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        username: user.username,
                        courseName,
                        courseData: data.data,
                        image: "/placeholder.jpg",
                      }),
                    })

                    if (saveResponse.ok) {
                      toast.success(`Personalized course "${courseName}" generated and saved to My Courses!`)
                    } else {
                      console.error('Failed to save custom course')
                      toast.success(`Personalized course "${courseName}" generated successfully!`)
                    }
                  } catch (saveError) {
                    console.error('Error saving custom course:', saveError)
                    toast.success(`Personalized course "${courseName}" generated successfully!`)
                  }
                } else {
                  toast.success(`Personalized course "${courseName}" generated successfully!`)
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
      let errorMessage = 'Failed to generate custom course'
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error: Could not connect to server.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      setGenerationMode('select')
    } finally {
      setLoading(false)
    }
  }

  const generateCourse = async () => {
    if (!courseName) return

    setLoading(true)
    setGenerationMode('generating')
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
                setGenerationMode('select')
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
      setGenerationMode('select')
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
              {isGeneratableCourse && !courseData && generationMode === 'select' && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setGenerationMode('general')
                      generateCourse()
                    }}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-teal-500 rounded-full font-medium hover:bg-teal-50 disabled:bg-teal-200 disabled:cursor-not-allowed"
                  >
                    <BookOpen size={20} />
                    Generate General Course
                  </button>
                  <button
                    onClick={fetchQuestions}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-full font-medium hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed"
                  >
                    <BookOpen size={20} />
                    Generate Custom Course
                  </button>
                </div>
              )}
              
              {isGeneratableCourse && generationMode === 'generating' && (
                <div className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-500 rounded-full font-medium">
                  <Loader2 className="animate-spin" size={20} />
                  Generating Course...
                </div>
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

      {/* Questions Section */}
      {isGeneratableCourse && generationMode === 'questions' && questions.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Customize Your Course
              </h2>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            {questions[currentQuestionIndex] && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {questions[currentQuestionIndex].question}
                  </h3>
                  
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option, idx) => {
                      const questionId = questions[currentQuestionIndex].questionId
                      const isSelected = answers[questionId] === option
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(questionId, option)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50 text-teal-900'
                              : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-teal-500 bg-teal-500'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-gray-900">{option}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prev => prev - 1)
                      } else {
                        setGenerationMode('select')
                        setQuestions([])
                        setAnswers({})
                      }
                    }}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50"
                  >
                    {currentQuestionIndex > 0 ? 'Previous' : 'Cancel'}
                  </button>
                  
                  <button
                    onClick={handleNextQuestion}
                    disabled={!answers[questions[currentQuestionIndex].questionId]}
                    className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Generate Course'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
