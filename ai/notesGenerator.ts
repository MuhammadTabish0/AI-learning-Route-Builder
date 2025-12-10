import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';

export interface Definition {
  term: string;
  definition: string;
}

export interface Concept {
  title: string;
  explanation: string;
}

export interface Theorem {
  name: string;
  statement: string;
  explanation: string;
}

export interface Example {
  title: string;
  problem: string;
  solution: string;
  explanation: string;
}

export interface ChapterNotes {
  definitions: Definition[];
  concepts: Concept[];
  theorems: Theorem[];
  examples: Example[];
  summary: string;
}

export interface NotesResponse {
  chapter: string;
  subject: string;
  notes: ChapterNotes;
}

/**
 * Generates detailed chapter notes
 * @param subject - The subject name
 * @param chapter - The chapter title
 * @returns Promise<NotesResponse> - Structured notes with all sections
 */
export async function generateNotes(
  subject: string,
  chapter: string
): Promise<NotesResponse> {
  try {
    // Load and prepare prompt
    const template = await loadPromptTemplate('notes');
    const prompt = replaceTemplateVariables(template, { subject, chapter });

    // Call LLM
    const response = await callLLM(prompt);

    // Parse and validate response
    const notes = parseJSONResponse<NotesResponse>(response);

    // Validate structure
    if (!notes.chapter || !notes.subject || !notes.notes) {
      throw new Error('Invalid notes structure returned from LLM');
    }

    if (
      !Array.isArray(notes.notes.definitions) ||
      !Array.isArray(notes.notes.concepts) ||
      !Array.isArray(notes.notes.theorems) ||
      !Array.isArray(notes.notes.examples) ||
      !notes.notes.summary
    ) {
      throw new Error('Invalid notes content structure returned from LLM');
    }

    return notes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate notes: ${error.message}`);
    }
    throw new Error('Failed to generate notes: Unknown error');
  }
}

