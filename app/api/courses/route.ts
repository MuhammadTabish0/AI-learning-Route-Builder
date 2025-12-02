import { NextResponse } from "next/server";
import { getCourses, createCourse } from "@/lib/data";

export async function GET() {
    const courses = await getCourses();
    return NextResponse.json(courses);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Basic validation
        if (!body.title || !body.category) {
            return NextResponse.json(
                { error: "Title and category are required" },
                { status: 400 }
            );
        }

        const newCourse = await createCourse({
            title: body.title,
            category: body.category,
            progress: 0,
            total: 10, // Default total lessons
            image: "/placeholder.svg",
            instructor: "AI Instructor",
            description: body.description || "Generated course description",
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create course" },
            { status: 500 }
        );
    }
}
