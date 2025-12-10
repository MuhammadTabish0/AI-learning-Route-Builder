import { NextRequest, NextResponse } from 'next/server';
import { generateResources } from '@/ai/resourcesGenerator';

/**
 * POST /api/generate-resources
 * Generates external learning resources for a subject
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

    // Generate resources
    const resources = await generateResources(subject.trim());

    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Error generating resources:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while generating resources' },
      { status: 500 }
    );
  }
}

