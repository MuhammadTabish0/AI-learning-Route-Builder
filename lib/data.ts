
export interface Resource {
  title: string;
  type: 'video' | 'article' | 'pdf' | 'tool';
  url: string;
}

export interface Lesson {
  title: string;
  resources?: Resource[];
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: number;
  title: string;
  progress: number;
  total: number;
  image: string;
  instructor: string;
  category: string;
  description?: string;
  modules?: Module[];
}

export interface User {
  id: string;
  email: string;
  name: string;
}

// Initial mock data
let courses: Course[] = [
  {
    id: 1,
    title: "Introduction to Python Programming",
    progress: 0,
    total: 15,
    image: "/placeholder.svg",
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
    id: 2,
    title: "Full Stack Web Development Bootcamp",
    progress: 0,
    total: 40,
    image: "/placeholder.svg",
    instructor: "Colt Steele",
    category: "Development",
    description: "The only course you need to learn web development - HTML, CSS, JS, Node, and more!",
    modules: [
      { title: "Frontend", lessons: [{ title: "HTML5" }, { title: "CSS3" }, { title: "JavaScript Basics" }] },
      { title: "Backend", lessons: [{ title: "Node.js" }, { title: "Express" }, { title: "MongoDB" }] }
    ]
  },
  {
    id: 3,
    title: "Data Structures & Algorithms",
    progress: 0,
    total: 25,
    image: "/placeholder.svg",
    instructor: "Abdul Bari",
    category: "Computer Science",
    description: "Master the fundamental building blocks of computer science and ace your coding interviews.",
    modules: [
      { title: "Sorting", lessons: [{ title: "Bubble Sort" }, { title: "Merge Sort" }, { title: "Quick Sort" }] },
      { title: "Trees", lessons: [{ title: "Binary Trees" }, { title: "AVL Trees" }, { title: "Heaps" }] }
    ]
  },
  {
    id: 4,
    title: "React.js - The Complete Guide",
    progress: 0,
    total: 30,
    image: "/placeholder.svg",
    instructor: "Maximilian Schwarzmüller",
    category: "Development",
    description: "Dive in and learn React.js from scratch! Learn Reactjs, Hooks, Redux, React Routing, Animations, Next.js and way more!",
    modules: [
      { title: "Basics", lessons: [{ title: "Components" }, { title: "Props" }, { title: "State" }] },
      { title: "Advanced", lessons: [{ title: "Hooks" }, { title: "Context API" }, { title: "Redux" }] }
    ]
  },
  {
    id: 5,
    title: "Node.js, Express, MongoDB & More",
    progress: 0,
    total: 20,
    image: "/placeholder.svg",
    instructor: "Jonas Schmedtmann",
    category: "Development",
    description: "Master Node by building a real-world RESTful API and web app (with authentication, Node.js security, payments & more)",
    modules: [
      { title: "Fundamentals", lessons: [{ title: "Event Loop" }, { title: "Modules" }, { title: "HTTP" }] },
      { title: "Express", lessons: [{ title: "Routing" }, { title: "Middleware" }, { title: "Error Handling" }] }
    ]
  },
  {
    id: 6,
    title: "Machine Learning A-Z",
    progress: 0,
    total: 35,
    image: "/placeholder.svg",
    instructor: "Kirill Eremenko",
    category: "Data Science",
    description: "Learn to create Machine Learning Algorithms in Python and R from two Data Science experts.",
    modules: [
      { title: "Preprocessing", lessons: [{ title: "Data Cleaning" }, { title: "Feature Scaling" }] },
      { title: "Regression", lessons: [{ title: "Linear Regression" }, { title: "Polynomial Regression" }] }
    ]
  },
  {
    id: 7,
    title: "Cyber Security: Go from Zero to Hero",
    progress: 0,
    total: 18,
    image: "/placeholder.svg",
    instructor: "Nathan House",
    category: "Security",
    description: "Learn Cyber Security concepts such as Ethical Hacking, Network Security, and more.",
    modules: [
      { title: "Network Security", lessons: [{ title: "Firewalls" }, { title: "VPNs" }, { title: "Encryption" }] },
      { title: "Threats", lessons: [{ title: "Malware" }, { title: "Phishing" }, { title: "Social Engineering" }] }
    ]
  },
  {
    id: 8,
    title: "AWS Certified Solutions Architect",
    progress: 0,
    total: 50,
    image: "/aws-architecture.jpg",
    instructor: "Stephane Maarek",
    category: "Cloud Computing",
    description: "Master AWS and pass the Solutions Architect Associate exam.",
    modules: [
      { title: "IAM", lessons: [{ title: "Users & Groups" }, { title: "Policies" }, { title: "MFA" }] },
      { title: "EC2", lessons: [{ title: "Instances" }, { title: "Security Groups" }, { title: "Load Balancing" }] }
    ]
  },
  {
    id: 9,
    title: "DevOps Beginners to Advanced",
    progress: 0,
    total: 22,
    image: "/placeholder.svg",
    instructor: "Mumshad Mannambeth",
    category: "DevOps",
    description: "Deciphering DevOps with Docker, Kubernetes, Jenkins, Terraform, Ansible and more.",
    modules: [
      { title: "Containers", lessons: [{ title: "Docker Basics" }, { title: "Docker Compose" }] },
      { title: "Orchestration", lessons: [{ title: "Kubernetes Architecture" }, { title: "Pods & Services" }] }
    ]
  },
  {
    id: 10,
    title: "The Complete SQL Bootcamp",
    progress: 0,
    total: 12,
    image: "/placeholder.svg",
    instructor: "Jose Portilla",
    category: "Data Science",
    description: "Become an expert at SQL and PostgreSQL!",
    modules: [
      { title: "Basics", lessons: [{ title: "SELECT" }, { title: "WHERE" }, { title: "ORDER BY" }] },
      { title: "Joins", lessons: [{ title: "INNER JOIN" }, { title: "LEFT JOIN" }, { title: "RIGHT JOIN" }] }
    ]
  },
];

const users: User[] = [
  {
    id: "user_1",
    email: "test@example.com",
    name: "Test User",
  }
];

import { supabase } from "./supabase";

export const getCourses = async () => {
  if (supabase) {
    const { data, error } = await supabase
      .from("courses")
      .select("*, modules(*, lessons(*, resources(*)))");

    if (!error && data) {
      // Transform data to match Course interface if needed
      // Supabase returns modules as an array of objects, which matches our interface
      return data as unknown as Course[];
    }
  }
  return courses;
};

export const getCourseById = async (id: number) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("courses")
      .select("*, modules(*, lessons(*, resources(*)))")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as unknown as Course;
    }
  }
  return courses.find((c) => c.id === id);
};

export const createCourse = async (course: Omit<Course, "id">) => {
  if (supabase) {
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

    if (!courseError && courseData) {
      // 2. Insert Modules & Lessons if present
      if (course.modules && course.modules.length > 0) {
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
                  title: typeof lesson === 'string' ? lesson : lesson.title
                })
                .select()
                .single();

              if (lessonData && typeof lesson !== 'string' && lesson.resources) {
                const resourcesToInsert = lesson.resources.map(res => ({
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
      return courseData as Course;
    }
  }

  // Fallback to mock
  const newCourse = { ...course, id: courses.length + 1 };
  courses.push(newCourse);
  return newCourse;
};

export const updateCourseProgress = async (id: number, progress: number) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("courses")
      .update({ progress })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      return data as Course;
    }
  }

  // Fallback to mock
  const course = courses.find((c) => c.id === id);
  if (course) {
    course.progress = progress;
    return course;
  }
  return null;
};
