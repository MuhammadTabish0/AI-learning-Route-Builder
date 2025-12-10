import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/ai/roadmapGenerator';

/**
 * POST /api/generate-roadmap
 * Generates a subject roadmap with ordered chapters
 * 
 * Request body:
 * {
 *   "subject": "Linear Algebra"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject } = body;

    // Validate input
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Subject name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Generate roadmap
    const roadmap = await generateRoadmap(subject.trim());

    return NextResponse.json(roadmap, { status: 200 });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while generating roadmap' },
      { status: 500 }
    );
  }
}

