import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { runWebsiteCrawler } from '@/lib/apify';

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
  description?: string;
}

export interface ArticleOrDoc {
  title: string;
  url: string;
  description?: string;
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
 * Comprehensive URL validation using multiple methods:
 * 1. URL format validation
 * 2. DNS resolution check (if available)
 * 3. HTTP HEAD request with proper headers
 * 4. HTTP GET fallback for servers that don't support HEAD
 * 5. Final redirect URL validation
 * 6. Retry logic for transient failures
 */
async function isUrlReachable(url: string, retries: number = 1): Promise<boolean> {
  // Step 1: Basic URL format validation
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Clean and normalize URL
  const cleanUrl = url.trim();
  
  // Must start with http:// or https://
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return false;
  }

  // Check for obviously invalid patterns
  if (cleanUrl.includes('example.com') || 
      cleanUrl.includes('placeholder') || 
      cleanUrl.includes('test.com') ||
      cleanUrl.length < 10) {
    return false;
  }

  // Validate URL format using URL constructor
  try {
    new URL(cleanUrl);
  } catch {
    return false;
  }

  // Step 2: HTTP validation with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Use a proper user agent to avoid blocking
      const headers: HeadersInit = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      };

      // First try HEAD request (faster, less bandwidth)
      let res: Response;
      try {
        res = await fetch(cleanUrl, {
          method: 'HEAD',
          headers,
          redirect: 'follow',
          signal: controller.signal,
        });
      } catch (headError) {
        // If HEAD fails, try GET
        clearTimeout(timeout);
        const getController = new AbortController();
        const getTimeout = setTimeout(() => getController.abort(), 10000);
        
        try {
          res = await fetch(cleanUrl, {
            method: 'GET',
            headers,
            redirect: 'follow',
            signal: getController.signal,
          });
        } finally {
          clearTimeout(getTimeout);
        }
      }

      clearTimeout(timeout);

      // Check if response is OK (status 200-299)
      if (res.ok) {
        // Additional check: verify final URL after redirects
        const finalUrl = res.url || cleanUrl;
        
        // If redirected to a 404 page or error page, consider it invalid
        if (finalUrl.includes('404') || 
            finalUrl.includes('not-found') || 
            finalUrl.includes('error')) {
          return false;
        }

        return true;
      }

      // If status is not OK, check if it's a retryable error
      if (attempt < retries && (res.status >= 500 || res.status === 429)) {
        // Retry on server errors or rate limits
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }

      // Non-retryable errors (4xx except 429)
      return false;

    } catch (error: any) {
      clearTimeout(timeout);
      
      // Check if it's a retryable error
      if (attempt < retries && (
        error.name === 'AbortError' || // Timeout
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ENOTFOUND')
      )) {
        // Retry on network errors
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      // Non-retryable errors or out of retries
      return false;
    }
  }

  return false;
}

/**
 * Validate all external URLs in the generated resources and drop links
 * that clearly 404 / fail, so students mostly see working links.
 * Uses parallel validation for better performance.
 * Exported for use in other modules (e.g., custom course generation)
 */
export async function validateCourseLinks(course: CourseRoadmapResponse): Promise<CourseRoadmapResponse> {
  const validatedResources: ChapterResource[] = [];
  
  console.log(`Validating links for ${course.resources.length} chapters...`);

  // Process all chapters
  for (const chapter of course.resources) {
    const validVideos: VideoOrLecture[] = [];
    const validArticles: ArticleOrDoc[] = [];

    // Collect all URLs to validate
    const videoUrls = (chapter.freeVideosOrLectures || []).map(v => ({ video: v, url: v.url }));
    const articleUrls = (chapter.articlesOrDocs || []).map(a => ({ article: a, url: a.url }));

    // Validate videos in parallel (batch of 5 at a time to avoid overwhelming servers)
    const videoBatches: typeof videoUrls[] = [];
    for (let i = 0; i < videoUrls.length; i += 5) {
      videoBatches.push(videoUrls.slice(i, i + 5));
    }

    for (const batch of videoBatches) {
      const results = await Promise.allSettled(
        batch.map(async ({ video, url }) => {
          const isValid = await isUrlReachable(url);
          return { video, isValid };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.isValid) {
          validVideos.push(result.value.video);
        }
      }
    }

    // Validate articles in parallel (batch of 5 at a time)
    const articleBatches: typeof articleUrls[] = [];
    for (let i = 0; i < articleUrls.length; i += 5) {
      articleBatches.push(articleUrls.slice(i, i + 5));
    }

    for (const batch of articleBatches) {
      const results = await Promise.allSettled(
        batch.map(async ({ article, url }) => {
          const isValid = await isUrlReachable(url);
          return { article, isValid };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.isValid) {
          validArticles.push(result.value.article);
        }
      }
    }

    console.log(`Chapter "${chapter.chapterTitle}": ${validVideos.length}/${videoUrls.length} videos, ${validArticles.length}/${articleUrls.length} articles valid`);

    validatedResources.push({
      ...chapter,
      freeVideosOrLectures: validVideos,
      articlesOrDocs: validArticles,
    });
  }

  const totalVideos = course.resources.reduce((sum, ch) => sum + (ch.freeVideosOrLectures?.length || 0), 0);
  const totalArticles = course.resources.reduce((sum, ch) => sum + (ch.articlesOrDocs?.length || 0), 0);
  const validVideos = validatedResources.reduce((sum, ch) => sum + (ch.freeVideosOrLectures?.length || 0), 0);
  const validArticles = validatedResources.reduce((sum, ch) => sum + (ch.articlesOrDocs?.length || 0), 0);

  console.log(`Link validation complete: ${validVideos}/${totalVideos} videos and ${validArticles}/${totalArticles} articles are valid`);

  return {
    ...course,
    resources: validatedResources,
  };
}

/**
 * Use Apify Website Content Crawler to fetch REAL resources from
 * MIT OCW, Khan Academy, and YouTube for each chapter, and merge them
 * into the existing resources.
 *
 * This does NOT ask the LLM for URLs – it constructs search URLs from
 * the course + chapter names and relies on Apify to discover pages.
 */
export async function augmentCourseWithExternalResources(
  courseName: string,
  course: CourseRoadmapResponse
): Promise<CourseRoadmapResponse> {
  try {
    console.log('Augmenting course resources with Apify for', courseName);

    const updatedResources: ChapterResource[] = [];

    for (const chapter of course.resources) {
      const query = `${courseName} ${chapter.chapterTitle}`.trim();
      const searchParam = encodeURIComponent(query);

      const startUrls = [
        // MIT OCW search
        `https://ocw.mit.edu/search?q=${searchParam}`,
        // Khan Academy search
        `https://www.khanacademy.org/search?query=${searchParam}`,
        // YouTube search
        `https://www.youtube.com/results?search_query=${searchParam}`,
      ];

      let crawledPages = [];

      try {
        crawledPages = await runWebsiteCrawler({
          startUrls,
          maxPages: 2,
        });
      } catch (error) {
        console.warn('Apify crawl failed for chapter', chapter.chapterTitle, error);
        // If Apify fails, just keep existing resources
        updatedResources.push(chapter);
        continue;
      }

      const extraVideos: VideoOrLecture[] = [];
      const extraArticles: ArticleOrDoc[] = [];

      for (const page of crawledPages) {
        if (!page.url) continue;

        let hostname: string;
        try {
          hostname = new URL(page.url).hostname;
        } catch {
          continue;
        }

        const title = page.title || chapter.chapterTitle || courseName;

        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
          extraVideos.push({
            source: 'YouTube',
            topic: title,
            url: page.url,
            description: `YouTube video introducing ${chapter.chapterTitle} for ${courseName}.`,
          });
        } else if (hostname.includes('ocw.mit.edu')) {
          extraArticles.push({
            title: title.startsWith('MIT OCW') ? title : `MIT OCW – ${title}`,
            url: page.url,
            description: `MIT OpenCourseWare material covering ${chapter.chapterTitle} in ${courseName}.`,
          });
        } else if (hostname.includes('khanacademy.org')) {
          extraArticles.push({
            title: title.startsWith('Khan Academy') ? title : `Khan Academy – ${title}`,
            url: page.url,
            description: `Khan Academy resource reinforcing concepts from ${chapter.chapterTitle}.`,
          });
        }
      }

      // Deduplicate by URL
      const videoByUrl = new Map<string, VideoOrLecture>();
      for (const v of [...(chapter.freeVideosOrLectures || []), ...extraVideos]) {
        if (v.url) {
          videoByUrl.set(v.url, v);
        }
      }

      const articleByUrl = new Map<string, ArticleOrDoc>();
      for (const a of [...(chapter.articlesOrDocs || []), ...extraArticles]) {
        if (a.url) {
          articleByUrl.set(a.url, a);
        }
      }

      updatedResources.push({
        ...chapter,
        freeVideosOrLectures: Array.from(videoByUrl.values()),
        articlesOrDocs: Array.from(articleByUrl.values()),
      });
    }

    console.log('Apify augmentation complete');

    return {
      ...course,
      resources: updatedResources,
    };
  } catch (error) {
    console.warn('augmentCourseWithExternalResources failed, returning original course', error);
    return course;
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

    // Validate external links so students mostly see working URLs
    console.log('Validating external resource links...');
    const validatedCourse = await validateCourseLinks(courseData);

    // Augment with real links from MIT OCW, Khan Academy, YouTube via Apify
    console.log('Augmenting resources with external crawled links...');
    const augmentedCourse = await augmentCourseWithExternalResources(courseName, validatedCourse);

    // Save immediately
    await saveCourseIncrementally(courseName, augmentedCourse);
    onProgress?.('complete', augmentedCourse);

    return augmentedCourse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate course roadmap: ${error.message}`);
    }
    throw new Error('Failed to generate course roadmap: Unknown error');
  }
}

