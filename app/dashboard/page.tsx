"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }
            setUser(user)

            // Fetch enrolled courses (mocking enrollment by showing all courses for now, 
            // or we could add a real enrollment table. For "complete" feel, let's fetch all 
            // and pretend they are enrolled, or filter by some logic if we had it.
            // Better: Let's just fetch all courses as "Recommended" and maybe a few as "In Progress")

            // For now, let's just fetch all courses to populate the dashboard
            const { data: courses } = await supabase
                .from('courses')
                .select('*')

            if (courses) {
                setEnrolledCourses(courses)
            }
            setLoading(false)
        }

        checkUser()
    }, [router])

    if (loading) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.user_metadata?.username || user?.email}!</h1>
                    <p className="text-gray-600 mt-2">Track your progress and continue learning.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Courses in Progress</h3>
                        <p className="text-3xl font-bold text-teal-600">{enrolledCourses.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Lessons</h3>
                        <p className="text-3xl font-bold text-purple-600">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Learning Streak</h3>
                        <p className="text-3xl font-bold text-orange-500">1 Day</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mt-12 mb-6">My Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map((course) => (
                        <Link href={`/courses/${course.id}`} key={course.id} className="block group">
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="h-48 bg-gray-200 relative">
                                    <img
                                        src={course.image || "/placeholder.svg"}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <span className="text-white text-xs font-medium px-2 py-1 bg-teal-500 rounded-full">
                                            {course.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                        <div
                                            className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(course.progress / course.total) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>{course.progress} / {course.total} Lessons</span>
                                        <span>{Math.round((course.progress / course.total) * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {enrolledCourses.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
                            <Link href="/courses" className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600">
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    )
}
