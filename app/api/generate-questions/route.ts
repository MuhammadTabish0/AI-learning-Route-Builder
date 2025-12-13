import { NextRequest, NextResponse } from 'next/server';
import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';

/**
 * POST /api/generate-questions
 * Generates diagnostic questions for custom course generation
 * 
 * Request body:
 * {
 *   "courseName": "Linear Algebra"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName } = body;

    if (!courseName || typeof courseName !== 'string' || courseName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // Load the questions prompt template
    const promptTemplate = await loadPromptTemplate('custom-course-questions');
    const prompt = replaceTemplateVariables(promptTemplate, {
      COURSE_NAME: courseName.trim(),
    });

    // Call LLM to generate questions
    const response = await callLLM(prompt, 'gemini-2.5-flash');
    
    // Parse JSON response
    const questionsData = parseJSONResponse(response);

    // Validate structure
    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }

    // Validate each question
    for (const q of questionsData.questions) {
      if (!q.questionId || !q.question || !q.type || !q.options || !Array.isArray(q.options)) {
        throw new Error('Invalid question format');
      }
      if (q.type !== 'single' && q.type !== 'multiple') {
        throw new Error(`Invalid question type: ${q.type}`);
      }
    }

    return NextResponse.json({
      success: true,
      questions: questionsData.questions,
    });
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
