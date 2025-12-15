import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Loads a prompt template from the `prompts` directory.
 *
 * **Specification**:
 *
 * Requires:
 * - `templateName` is a non-empty string that corresponds to a `.txt` file
 *   under the `prompts/` directory (without the `.txt` extension).
 *
 * Effects:
 * - Attempts to read `<cwd>/prompts/${templateName}.txt`.
 * - If the file exists and is readable, returns its contents as a UTF‑8 string.
 * - If the file cannot be read for any reason (missing file, I/O error, etc.),
 *   throws an `Error` whose message includes the `templateName` and original error.
 *
 * @param templateName - Name of the template file (without `.txt` extension).
 * @returns The template content as a string.
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
 * Replaces template variables in a prompt string.
 *
 * **Specification**:
 *
 * Requires:
 * - `template` is any string (may or may not contain `{{variable}}` placeholders).
 * - `variables` is an object mapping variable names (without braces) to strings.
 *
 * Effects:
 * - For each `[key, value]` in `variables`, replaces **all** occurrences of
 *   `{{key}}` in `template` with `value`, using a global regular expression.
 * - Returns the resulting string.
 * - Does **not** mutate the original `template` string or `variables` object.
 *
 * Note:
 * - Placeholders in `template` that are not present in `variables` are left
 *   unchanged.
 *
 * @param template - The template string with `{{variable}}` placeholders.
 * @param variables - Object with variable names and replacement values.
 * @returns The template with variables replaced.
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

