import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/ai/questionGenerator';

/**
 * POST /api/generate-questions
 * Generates practice questions for a chapter
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

    // Generate questions
    const questions = await generateQuestions(subject.trim(), chapter.trim());

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error('Error generating questions:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while generating questions' },
      { status: 500 }
    );
  }
}

