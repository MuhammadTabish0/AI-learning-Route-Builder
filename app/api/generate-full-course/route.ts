import { NextRequest, NextResponse } from 'next/server';
import { generateFullCourse, CourseRoadmapResponse } from '@/ai/fullCourseGenerator';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Explicitly load environment variables (Next.js should do this automatically, but sometimes needs help)
if (typeof process !== 'undefined' && !process.env.GEMINI_API_KEY) {
  try {
    // Try to load .env file explicitly if not already loaded
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach((line: string) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (e) {
    console.warn('Could not manually load .env file:', e);
  }
}

/**
 * POST /api/generate-full-course
 * Generates a complete university-level course with roadmap, chapters, assessments, resources, and final exam
 * 
 * Request body:
 * {
 *   "courseName": "Linear Algebra"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Full Course Generation Request ===');
    
    // Debug: Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing. Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Please check your .env file and restart the server.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { courseName } = body;
    console.log('Course name:', courseName);

    // Validate input
    if (!courseName || typeof courseName !== 'string' || courseName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Course name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if course already exists locally
    const dataDir = join(process.cwd(), 'data', 'courses');
    const sanitizedCourseName = courseName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dataFilePath = join(dataDir, `${sanitizedCourseName}.json`);

    if (existsSync(dataFilePath)) {
      try {
        const existingData = await readFile(dataFilePath, 'utf-8');
        const course = JSON.parse(existingData);
        
        // Remove metadata before returning
        const { metadata, ...courseData } = course;
        
        console.log('Returning cached course data from:', dataFilePath);
        
        // Return cached data via streaming for consistency
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const send = (data: any) => {
              const message = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(encoder.encode(message));
            };
            
            // Send complete course immediately
            send({
              type: 'complete',
              data: courseData,
              cached: true,
            });
            
            controller.close();
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
        console.warn('Failed to read cached course, will regenerate:', error);
        // Continue to generation if cache read fails
      }
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Generate course roadmap with progress callbacks
          const course = await generateFullCourse(courseName.trim(), (section, partialData) => {
            // Send progress update to client
            send({
              type: 'progress',
              section,
              data: partialData,
            });
          });

          // Send final complete course
          send({
            type: 'complete',
            data: course,
          });

          controller.close();
        } catch (error) {
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
    console.error('Error generating full course:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while generating full course' },
      { status: 500 }
    );
  }
}

