import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Loads a prompt template from the prompts directory
 * @param templateName - Name of the template file (without .txt extension)
 * @returns Promise<string> - The template content
 */
export async function loadPromptTemplate(templateName: string): Promise<string> {
  try {
    const templatePath = join(process.cwd(), 'prompts', `${templateName}.txt`);
    const template = await readFile(templatePath, 'utf-8');
    return template;
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${templateName}. Error: ${error}`);
  }
}

/**
 * Replaces template variables in a prompt string
 * @param template - The template string with {{variable}} placeholders
 * @param variables - Object with variable names and values
 * @returns The template with variables replaced
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

