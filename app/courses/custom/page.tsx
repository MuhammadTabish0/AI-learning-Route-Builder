"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"
import { Loader2, BookOpen, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { CourseRoadmapResponse } from "@/ai/fullCourseGenerator"

export default function CustomCoursePage() {
  const router = useRouter()
  const { user, isAuthenticated, initialized } = useAuth()
  const [courseName, setCourseName] = useState<string>("")
  const [questions, setQuestions] = useState<Array<{questionId: number; question: string; type: 'single' | 'multiple'; options: string[]}>>([])
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [courseData, setCourseData] = useState<CourseRoadmapResponse | null>(null)

  useEffect(() => {
    // Wait until auth state has been initialized from storage
    if (!initialized) {
      return
    }

    if (!isAuthenticated) {
      toast.error("Please sign in to generate custom courses")
      router.push("/login")
      return
    }

    // Get course name from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('customCourseName')
      if (stored) {
        setCourseName(stored)
        fetchQuestions(stored)
      } else {
        toast.error("No course selected")
        router.push("/courses")
      }
    }
  }, [initialized, isAuthenticated, router])

  const fetchQuestions = async (name: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName: name }),
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
      router.push("/courses")
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
      generateCustomCourse()
    }
  }

  const generateCustomCourse = async () => {
    if (!courseName || !user) return

    setLoading(true)
    try {
      const response = await fetch('/api/generate-custom-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName, responses: answers }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate course: ${response.status}`)
      }

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
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'progress') {
                if (data.message) {
                  toast.info(data.message)
                }
              } else if (data.type === 'complete') {
                setCourseData(data.data)
                
                // Save to Supabase
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
                  toast.success(`Personalized course "${courseName}" generated and saved!`)
                  // Clear sessionStorage
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('customCourseName')
                  }
                  // Redirect to my courses
                  setTimeout(() => {
                    router.push("/courses?tab=my")
                  }, 2000)
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate custom course'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!initialized || !isAuthenticated || !courseName) {
    return null
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/courses")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Courses
        </button>

        {loading && !questions.length && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4 text-teal-500" size={48} />
            <p className="text-gray-600">Generating questions...</p>
          </div>
        )}

        {questions.length > 0 && !courseData && (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{courseName}</h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
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
                        router.push("/courses")
                      }
                    }}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50"
                  >
                    {currentQuestionIndex > 0 ? 'Previous' : 'Cancel'}
                  </button>
                  
                  <button
                    onClick={handleNextQuestion}
                    disabled={!answers[questions[currentQuestionIndex].questionId] || loading}
                    className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Generate Course'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {courseData && (
          <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-8 text-center">
            <BookOpen className="mx-auto mb-4 text-teal-500" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Generated!</h2>
            <p className="text-gray-600">Redirecting to your courses...</p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}

