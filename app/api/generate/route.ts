import { NextResponse } from "next/server";
import { createCourse } from "@/lib/data";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { topic } = body;

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        // Mock AI Generation Logic
        // In a real app, this would call OpenAI API
        const newCourse = await createCourse({
            title: `Mastering ${topic}`,
            category: "AI Generated",
            progress: 0,
            total: 10,
            image: "/placeholder.svg",
            instructor: "AI Tutor",
            description: `A comprehensive guide to mastering ${topic}. Generated specifically for you.`,
            modules: [
                {
                    title: "Getting Started",
                    lessons: [`Introduction to ${topic}`, "Key Concepts", "Setting up your environment"]
                },
                {
                    title: "Core Fundamentals",
                    lessons: ["Basic Principles", "Common Patterns", "Best Practices"]
                },
                {
                    title: "Advanced Topics",
                    lessons: ["Complex Scenarios", "Optimization", "Real-world Applications"]
                }
            ]
        });

        return NextResponse.json(newCourse);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to generate course" },
            { status: 500 }
        );
    }
}
