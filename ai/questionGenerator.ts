import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';

export interface MCQ {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

export interface ShortQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface NumericalProblem {
  id: number;
  problem: string;
  solution: string;
  answer: string;
}

export interface QuestionsResponse {
  chapter: string;
  subject: string;
  questions: {
    mcqs: MCQ[];
    short: ShortQuestion[];
    numerical: NumericalProblem[];
  };
}

/**
 * Generates practice questions for a chapter
 * @param subject - The subject name
 * @param chapter - The chapter title
 * @returns Promise<QuestionsResponse> - Structured questions with solutions
 */
export async function generateQuestions(
  subject: string,
  chapter: string
): Promise<QuestionsResponse> {
  try {
    // Load and prepare prompt
    const template = await loadPromptTemplate('questions');
    const prompt = replaceTemplateVariables(template, { subject, chapter });

    // Call LLM
    const response = await callLLM(prompt);

    // Parse and validate response
    const questions = parseJSONResponse<QuestionsResponse>(response);

    // Validate structure
    if (!questions.chapter || !questions.subject || !questions.questions) {
      throw new Error('Invalid questions structure returned from LLM');
    }

    if (
      !Array.isArray(questions.questions.mcqs) ||
      !Array.isArray(questions.questions.short) ||
      !Array.isArray(questions.questions.numerical)
    ) {
      throw new Error('Invalid questions content structure returned from LLM');
    }

    return questions;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
    throw new Error('Failed to generate questions: Unknown error');
  }
}

