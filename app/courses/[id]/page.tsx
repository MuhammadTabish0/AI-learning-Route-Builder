"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function CoursePage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCourse(data);
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <Link href="/courses" className="text-teal-500 hover:text-teal-600">
            Back to courses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Course Hero */}
      <section className="bg-teal-500">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-teal-100 mb-4">By {course.instructor}</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {course.title}
              </h1>
              <p className="text-teal-100 mb-8 text-lg">
                {course.description}
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-8 py-3 bg-white text-teal-500 rounded-full font-medium hover:bg-teal-50"
              >
                Start learning now
              </Link>
            </div>
            <div className="bg-gray-200 rounded-3xl h-96 flex items-center justify-center overflow-hidden">
              <img src={course.image || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Course Content / Syllabus */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Course Content</h2>
        <div className="space-y-6">
          {course.modules?.map((module: any, idx: number) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {module.lessons.map((lesson: any, lIdx: number) => (
                  <div key={lIdx} className="group">
                    <div className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-medium">
                        {lIdx + 1}
                      </div>
                      <span className="text-gray-600 text-sm font-medium">
                        {typeof lesson === 'object' ? lesson.title : lesson}
                      </span>
                    </div>

                    {/* Resources Section */}
                    {typeof lesson === 'object' && lesson.resources && lesson.resources.length > 0 && (
                      <div className="px-6 pb-4 pl-12 space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resources</p>
                        <div className="grid gap-2">
                          {lesson.resources.map((res: any, rIdx: number) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100"
                            >
                              <span className="text-lg">
                                {res.type === 'video' ? '🎥' : res.type === 'pdf' ? '📄' : res.type === 'tool' ? '🛠️' : '🔗'}
                              </span>
                              <span>{res.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!course.modules && (
            <p className="text-gray-500 italic">No content details available for this course yet.</p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 md:p-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Learn Smarter, Anywhere</h2>
            <p className="text-gray-300 text-base mb-8">
              SwiftEd brings personalized roadmaps, AI summaries, and quizzes to your screen – making online learning
              focused and engaging
            </p>
            <Link href="/signup" className="px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 inline-block">
              Start learning now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
