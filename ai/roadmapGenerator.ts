import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';

export interface RoadmapResponse {
  subject: string;
  chapters: string[];
}

/**
 * Generates a subject roadmap with ordered chapters
 * @param subject - The subject name (e.g., "Linear Algebra")
 * @returns Promise<RoadmapResponse> - Structured roadmap with chapters
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

