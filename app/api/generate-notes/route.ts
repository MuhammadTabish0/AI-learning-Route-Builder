import { NextRequest, NextResponse } from 'next/server';
import { generateNotes } from '@/ai/notesGenerator';

/**
 * POST /api/generate-notes
 * Generates detailed chapter notes
 * 
 * Request body:
 * {
 *   "subject": "Linear Algebra",
 *   "chapter": "Determinants"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, chapter } = body;

    // Validate input
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Subject name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!chapter || typeof chapter !== 'string' || chapter.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chapter name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Generate notes
    const notes = await generateNotes(subject.trim(), chapter.trim());

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error('Error generating notes:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while generating notes' },
      { status: 500 }
    );
  }
}

