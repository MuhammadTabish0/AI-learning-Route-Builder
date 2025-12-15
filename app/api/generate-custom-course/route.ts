import { NextRequest, NextResponse } from 'next/server';
import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';
import { CourseRoadmapResponse, validateCourseLinks, augmentCourseWithExternalResources } from '@/ai/fullCourseGenerator';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/generate-custom-course
 * Generates a personalized course based on user responses
 * 
 * Request body:
 * {
 *   "courseName": "Linear Algebra",
 *   "responses": {
 *     "1": "Complete beginner",
 *     "2": "Career advancement",
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName, responses } = body;

    if (!courseName || typeof courseName !== 'string' || courseName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Student responses are required' },
        { status: 400 }
      );
    }

    // Format responses for the prompt
    const responsesText = Object.entries(responses)
      .map(([questionId, answer]) => `Question ${questionId}: ${answer}`)
      .join('\n');

    // Load the custom course generation prompt
    const promptTemplate = await loadPromptTemplate('custom-course-generation');
    const prompt = replaceTemplateVariables(promptTemplate, {
      COURSE_NAME: courseName.trim(),
      STUDENT_RESPONSES: responsesText,
    });

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Send progress update
          send({
            type: 'progress',
            section: 'generating',
            message: 'Generating personalized course roadmap...',
          });

          // Call LLM to generate custom course
          const response = await callLLM(prompt, 'gemini-2.5-flash');
          
          // Parse JSON response
          const courseData = parseJSONResponse(response) as CourseRoadmapResponse;

          // Validate structure
          if (!courseData.roadmap || !courseData.resources) {
            throw new Error('Invalid course structure in response');
          }

          // Validate external links so students mostly see working URLs
          send({
            type: 'progress',
            section: 'validating',
            message: 'Validating resource links...',
          });
          const validatedCourseData = await validateCourseLinks(courseData);

          // Augment with real links via Apify (MIT OCW, Khan Academy, YouTube)
          send({
            type: 'progress',
            section: 'augmenting',
            message: 'Augmenting resources with external links...',
          });
          const augmentedCourseData = await augmentCourseWithExternalResources(courseName.trim(), validatedCourseData);

          // Save to cache
          try {
            const dataDir = join(process.cwd(), 'data', 'courses');
            if (!existsSync(dataDir)) {
              await mkdir(dataDir, { recursive: true });
            }
            
            const sanitizedCourseName = courseName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const dataFilePath = join(dataDir, `${sanitizedCourseName}-custom.json`);
            
            await writeFile(
              dataFilePath,
              JSON.stringify({
                ...augmentedCourseData,
                metadata: {
                  generatedAt: new Date().toISOString(),
                  isCustom: true,
                  responses,
                },
              }, null, 2),
              'utf-8'
            );
          } catch (saveError) {
            console.warn('Failed to save custom course to cache:', saveError);
            // Continue even if save fails
          }

          // Send final complete course (with validated + augmented links)
          send({
            type: 'complete',
            data: augmentedCourseData,
          });

          controller.close();
        } catch (error) {
          console.error('Error generating custom course:', error);
          send({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in generate-custom-course:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while generating custom course' },
      { status: 500 }
    );
  }
}

