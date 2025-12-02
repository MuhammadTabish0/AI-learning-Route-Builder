import { NextResponse } from "next/server";
import { getCourseById, updateCourseProgress } from "@/lib/data";

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const id = parseInt(params.id);
    const course = await getCourseById(id);

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const body = await request.json();

        if (typeof body.progress !== "number") {
            return NextResponse.json(
                { error: "Progress must be a number" },
                { status: 400 }
            );
        }

        const updatedCourse = await updateCourseProgress(id, body.progress);

        if (!updatedCourse) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json(updatedCourse);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update course" },
            { status: 500 }
        );
    }
}
