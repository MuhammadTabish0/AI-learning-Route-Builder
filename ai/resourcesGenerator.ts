import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader';
import { callLLM, parseJSONResponse } from '@/lib/llm-client';

export interface VideoResource {
  title: string;
  url: string;
  description: string;
  channel: string;
}

export interface ArticleResource {
  title: string;
  url: string;
  description: string;
  source: string;
}

export interface BookResource {
  title: string;
  author: string;
  description: string;
  isbn?: string;
  note?: string;
}

export interface ResourcesResponse {
  subject: string;
  resources: {
    videos: VideoResource[];
    articles: ArticleResource[];
    books: BookResource[];
  };
}

/**
 * Generates external learning resources for a subject
 * @param subject - The subject name
 * @returns Promise<ResourcesResponse> - Structured resources list
 */
export async function generateResources(subject: string): Promise<ResourcesResponse> {
  try {
    // Load and prepare prompt
    const template = await loadPromptTemplate('resources');
    const prompt = replaceTemplateVariables(template, { subject });

    // Call LLM
    const response = await callLLM(prompt);

    // Parse and validate response
    const resources = parseJSONResponse<ResourcesResponse>(response);

    // Validate structure
    if (!resources.subject || !resources.resources) {
      throw new Error('Invalid resources structure returned from LLM');
    }

    if (
      !Array.isArray(resources.resources.videos) ||
      !Array.isArray(resources.resources.articles) ||
      !Array.isArray(resources.resources.books)
    ) {
      throw new Error('Invalid resources content structure returned from LLM');
    }

    return resources;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate resources: ${error.message}`);
    }
    throw new Error('Failed to generate resources: Unknown error');
  }
}

