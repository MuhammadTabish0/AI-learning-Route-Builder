"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

export default function GeneratePage() {
    const [topic, setTopic] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!topic.trim()) return

        setLoading(true)
        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic }),
            })

            if (response.ok) {
                const course = await response.json()
                router.push(`/courses/${course.id}`)
            } else {
                console.error("Failed to generate course")
            }
        } catch (error) {
            console.error("Error generating course:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <section className="max-w-4xl mx-auto px-4 py-20 md:py-32 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-8">
                    <Sparkles size={16} />
                    <span>AI Powered Learning</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                    What do you want to <span className="text-purple-600">learn today?</span>
                </h1>

                <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                    Enter any topic, and our AI will instantly generate a personalized learning roadmap, study materials, and quizzes just for you.
                </p>

                <form onSubmit={handleGenerate} className="max-w-xl mx-auto relative">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Advanced Python, Digital Marketing, Quantum Physics..."
                        className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-purple-500 focus:outline-none shadow-sm pr-36"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !topic.trim()}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                Generate
                                <Sparkles size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="p-4 bg-gray-50 rounded-xl">🚀 Instant Roadmap</div>
                    <div className="p-4 bg-gray-50 rounded-xl">📚 Curated Resources</div>
                    <div className="p-4 bg-gray-50 rounded-xl">📝 Practice Quizzes</div>
                    <div className="p-4 bg-gray-50 rounded-xl">🏆 Progress Tracking</div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
