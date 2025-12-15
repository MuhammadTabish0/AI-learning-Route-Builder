import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';

export interface RoadmapResponse {
  subject: string;
  chapters: string[];
}

/**
 * Generates a subject roadmap with ordered chapters.
 *
 * **Specification**:
 *
 * Requires:
 * - `subject` is a non-empty string describing the course subject.
 *   (API routes are expected to pass a trimmed, non-empty subject.)
 *
 * Effects:
 * - Loads the `'roadmap'` prompt template using `loadPromptTemplate`.
 * - Substitutes `{{subject}}` in the template via `replaceTemplateVariables`.
 * - Calls the LLM through `callLLM` and parses the response as `RoadmapResponse`
 *   using `parseJSONResponse`.
 * - Returns an object where:
 *   - `roadmap.subject` is a string (typically echoing the input),
 *   - `roadmap.chapters` is an array (possibly empty) of chapter descriptions.
 * - If any step fails (prompt loading, LLM call, JSON parsing, or structural
 *   validation), throws an `Error` whose message is prefixed with
 *   `"Failed to generate roadmap:"`.
 *
 * This function does not persist data or mutate external state; it is a pure
 * generator based on the current prompt templates and LLM behavior.
 *
 * @param subject - The subject name (e.g., `"Linear Algebra"`).
 * @returns Structured roadmap with subject and chapters.
 */
export async function generateRoadmap(subject: string): Promise<RoadmapResponse> {
  try {
    // Load and prepare prompt
    const template = await loadPromptTemplate('roadmap');
    const prompt = replaceTemplateVariables(template, { subject });

    // Call LLM
    const response = await callLLM(prompt);

    // Parse and validate response
    const roadmap = parseJSONResponse<RoadmapResponse>(response);

    // Validate structure
    if (!roadmap.subject || !Array.isArray(roadmap.chapters)) {
      throw new Error('Invalid roadmap structure returned from LLM');
    }

    return roadmap;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate roadmap: ${error.message}`);
    }
    throw new Error('Failed to generate roadmap: Unknown error');
  }
}

