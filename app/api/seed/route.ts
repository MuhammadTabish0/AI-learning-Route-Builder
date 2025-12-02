import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const initialCourses = [
    {
        title: "Introduction to Python Programming",
        progress: 0,
        total: 15,
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
        instructor: "Dr. Angela Yu",
        category: "Development",
        description: "Learn Python from scratch. Master the basics of programming, variables, loops, and functions.",
        modules: [
            {
                title: "Basics",
                lessons: [
                    {
                        title: "Variables & Types",
                        resources: [
                            { title: "Python Variables Guide", type: "article", url: "https://docs.python.org/3/tutorial/introduction.html" },
                            { title: "Video Tutorial", type: "video", url: "https://youtube.com/watch?v=example" }
                        ]
                    },
                    { title: "Control Flow", resources: [] },
                    { title: "Functions", resources: [] }
                ]
            },
            {
                title: "Data Structures",
                lessons: [
                    { title: "Lists", resources: [] },
                    { title: "Dictionaries", resources: [] },
                    { title: "Tuples", resources: [] }
                ]
            },
            {
                title: "OOP",
                lessons: [
                    { title: "Classes", resources: [] },
                    { title: "Inheritance", resources: [] },
                    { title: "Polymorphism", resources: [] }
                ]
            }
        ]
    },
    {
        title: "Full Stack Web Development Bootcamp",
        progress: 0,
        total: 40,
        image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80",
        instructor: "Colt Steele",
        category: "Development",
        description: "The only course you need to learn web development - HTML, CSS, JS, Node, and more!",
        modules: [
            { title: "Frontend", lessons: [{ title: "HTML5" }, { title: "CSS3" }, { title: "JavaScript Basics" }] },
            { title: "Backend", lessons: [{ title: "Node.js" }, { title: "Express" }, { title: "MongoDB" }] }
        ]
    },
    // ... (Other courses would be similar, keeping it brief for the seed script to avoid huge file)
];

// Add a helper to add random resources to lessons that don't have them
const addRandomResources = (courses: any[]) => {
    return courses.map(course => ({
        ...course,
        modules: course.modules.map((module: any) => ({
            ...module,
            lessons: module.lessons.map((lesson: any) => ({
                ...lesson,
                resources: lesson.resources || [
                    { title: "Official Documentation", type: "article", url: "https://docs.google.com" },
                    { title: "Video Explanation", type: "video", url: "https://youtube.com" },
                    { title: "Cheat Sheet", type: "pdf", url: "https://example.com/sheet.pdf" }
                ]
            }))
        }))
    }));
};

export async function GET() {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    try {
        const coursesToSeed = addRandomResources(initialCourses);
        let count = 0;

        for (const course of coursesToSeed) {
            // 1. Insert Course
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .insert({
                    title: course.title,
                    description: course.description,
                    image: course.image,
                    instructor: course.instructor,
                    category: course.category,
                    total: course.total,
                    progress: course.progress
                })
                .select()
                .single();

            if (courseError) {
                console.error("Error inserting course:", courseError);
                continue;
            }

            if (courseData) {
                count++;
                // 2. Insert Modules & Lessons
                for (const module of course.modules) {
                    const { data: moduleData } = await supabase
                        .from("modules")
                        .insert({
                            course_id: courseData.id,
                            title: module.title
                        })
                        .select()
                        .single();

                    if (moduleData && module.lessons) {
                        for (const lesson of module.lessons) {
                            const { data: lessonData } = await supabase
                                .from("lessons")
                                .insert({
                                    module_id: moduleData.id,
                                    title: lesson.title
                                })
                                .select()
                                .single();

                            if (lessonData && lesson.resources) {
                                const resourcesToInsert = lesson.resources.map((res: any) => ({
                                    lesson_id: lessonData.id,
                                    title: res.title,
                                    type: res.type,
                                    url: res.url
                                }));
                                await supabase.from("resources").insert(resourcesToInsert);
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ message: `Successfully seeded ${count} courses with resources` });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
    }
}
