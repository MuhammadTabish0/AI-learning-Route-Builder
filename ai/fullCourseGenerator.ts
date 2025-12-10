import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ChapterRoadmap {
  chapterNumber: number;
  title: string;
}

export interface CourseRoadmap {
  course: string;
  chapters: ChapterRoadmap[];
}

export interface TheoryOrRule {
  name: string;
  statement: string;
}

export interface WorkedExample {
  exampleNumber: number;
  problem: string;
  stepByStepSolution: string;
}

export interface ChapterContent {
  chapterTitle: string;
  learningObjectives: string[];
  summary: string;
  definitions: string[];
  keyConcepts: string[];
  theoriesOrRules: TheoryOrRule[];
  workedExamples: WorkedExample[];
  commonMistakes: string[];
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ShortQuestion {
  question: string;
  modelAnswer: string;
}

export interface NumericalProblem {
  problem: string;
  solution: string;
}

export interface ChapterAssessment {
  chapterTitle: string;
  mcqs: MCQ[];
  shortQuestions: ShortQuestion[];
  numericalProblems: NumericalProblem[];
}

export interface Textbook {
  title: string;
  author: string;
  edition: string;
  whyUseful: string;
}

export interface VideoOrLecture {
  source: string;
  topic: string;
  url: string;
}

export interface ArticleOrDoc {
  title: string;
  url: string;
}

export interface CourseResources {
  textbooks: Textbook[];
  freeVideosOrLectures: VideoOrLecture[];
  articlesOrDocs: ArticleOrDoc[];
}

export interface FinalExamQuestion {
  question: string;
  type: 'MCQ' | 'Short' | 'Problem';
  options?: string[];
  answer: string;
  explanation: string;
}

export interface FinalExam {
  questions: FinalExamQuestion[];
}

// Simplified response - only roadmap and resources
export interface CourseRoadmapResponse {
  roadmap: CourseRoadmap;
  resources: ChapterResource[];
}

export interface ChapterResource {
  chapterTitle: string;
  textbooks: Textbook[];
  freeVideosOrLectures: VideoOrLecture[];
  articlesOrDocs: ArticleOrDoc[];
}

// Legacy interface for backward compatibility (if needed)
export interface FullCourseResponse {
  roadmap: CourseRoadmap;
  chapters?: ChapterContent[];
  assessments?: ChapterAssessment[];
  resources?: CourseResources;
  finalExam?: FinalExam;
}

/**
 * Saves course data incrementally to a local file
 */
async function saveCourseIncrementally(
  courseName: string,
  partialData: Partial<CourseRoadmapResponse | FullCourseResponse>
): Promise<void> {
  try {
    const dataDir = join(process.cwd(), 'data', 'courses');
    const sanitizedCourseName = courseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dataFilePath = join(dataDir, `${sanitizedCourseName}.json`);

    // Create data directory if it doesn't exist
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Read existing data if file exists, otherwise start fresh
    let existingData: Partial<FullCourseResponse> = {};
    try {
      if (existsSync(dataFilePath)) {
        const fileContent = await readFile(dataFilePath, 'utf-8');
        existingData = JSON.parse(fileContent);
      }
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      existingData = {};
    }

    // Merge new data with existing
    const mergedData = {
      ...existingData,
      ...partialData,
      metadata: {
        ...(existingData as any)?.metadata,
        courseName: courseName.trim(),
        lastUpdated: new Date().toISOString(),
        version: '1.0',
      },
    };

    // Write to file
    await writeFile(dataFilePath, JSON.stringify(mergedData, null, 2), 'utf-8');
    console.log(`Course data saved incrementally to: ${dataFilePath}`);
  } catch (error) {
    console.error('Failed to save course incrementally:', error);
    // Don't throw - incremental saving is best effort
  }
}

/**
 * Generates a course roadmap with resources (simplified version)
 * Uses a single API call to generate roadmap + resources per chapter
 * @param courseName - The name of the course (e.g., "Linear Algebra")
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<CourseRoadmapResponse> - Course roadmap with resources
 */
export async function generateFullCourse(
  courseName: string,
  onProgress?: (section: string, data: Partial<CourseRoadmapResponse>) => void
): Promise<CourseRoadmapResponse> {
  try {
    console.log(`Starting course roadmap generation for: ${courseName}`);

    // Generate roadmap and resources in a single call
    console.log('Generating roadmap and resources...');
    const roadmapTemplate = await loadPromptTemplate('roadmap-only');
    const roadmapPrompt = replaceTemplateVariables(roadmapTemplate, { COURSE_NAME: courseName });
    const response = await callLLM(roadmapPrompt, 'gemini-2.5-flash');
    const courseData = parseJSONResponse<CourseRoadmapResponse>(response);

    // Validate structure
    if (!courseData.roadmap || !courseData.resources) {
      throw new Error('Invalid course structure returned from LLM - missing roadmap or resources');
    }

    if (!courseData.roadmap.course || !Array.isArray(courseData.roadmap.chapters)) {
      throw new Error('Invalid roadmap structure returned from LLM');
    }

    if (!Array.isArray(courseData.resources)) {
      throw new Error('Invalid resources structure returned from LLM');
    }

    console.log(`Roadmap generated with ${courseData.roadmap.chapters.length} chapters and ${courseData.resources.length} resource sets`);

    // Save immediately
    await saveCourseIncrementally(courseName, courseData);
    onProgress?.('complete', courseData);

    return courseData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate course roadmap: ${error.message}`);
    }
    throw new Error('Failed to generate course roadmap: Unknown error');
  }
}

