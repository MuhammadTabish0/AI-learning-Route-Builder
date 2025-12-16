import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure environment variables are loaded (for Next.js)
if (typeof process !== 'undefined' && process.env) {
  // Next.js automatically loads .env files, but we can verify
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && typeof window === 'undefined') {
    console.warn('GEMINI_API_KEY not found in environment variables');
  }
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Retry function with exponential backoff.
 *
 * **Specification (internal helper)**:
 *
 * Requires:
 * - `fn` is an async function that may throw on transient failures.
 * - `maxRetries` is a positive integer (default 3).
 * - `baseDelay` is a positive integer number of milliseconds (default 1000).
 *
 * Effects:
 * - Calls `fn` up to `maxRetries` times until it resolves successfully.
 * - On errors that look like rate limiting (HTTP 429 / quota / rate text),
 *   waits with exponential backoff (or a server-suggested delay) before retrying,
 *   unless this was the last allowed attempt.
 * - If all attempts fail, rethrows the last error or throws a generic
 *   "Max retries exceeded" error.
 *
 * This function does not mutate external state; its only observable effects are
 * timing (delays) and any side effects performed inside `fn` itself.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate');
      
      if (isRateLimit && !isLastAttempt) {
        // Extract retry delay from error if available
        let delay = baseDelay * Math.pow(2, attempt);
        
        // Try to extract retry delay from error message
        const retryMatch = error?.message?.match(/retry in (\d+\.?\d*)s/i);
        if (retryMatch) {
          delay = parseFloat(retryMatch[1]) * 1000;
        }
        
        console.log(`Rate limit hit, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or not a rate limit error, throw
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Calls the Gemini LLM with a prompt and returns the raw JSON string response.
 *
 * **Specification**:
 *
 * Requires:
 * - `process.env.GEMINI_API_KEY` is defined; otherwise this function throws.
 * - `prompt` is a non-empty string containing the user/system instructions.
 * - `model` is a valid Gemini model identifier (default `'gemini-1.5-flash'`).
 *
 * Effects:
 * - Uses the shared `genAI` client to call the specified Gemini model.
 * - Wraps the given `prompt` with a fixed system instruction that instructs
 *   the model to respond with **valid JSON only**.
 * - Uses streaming first, then falls back to non‑streaming if needed.
 * - Returns a `Promise` that resolves to the raw string content from the LLM.
 * - Throws an `Error` (wrapped with a helpful message) if:
 *   - the API key is missing,
 *   - the LLM request fails, or
 *   - no non‑empty content is produced.
 *
 * This function does not persist or cache responses; callers are responsible
 * for parsing the returned JSON (e.g., via `parseJSONResponse`).
 *
 * @param prompt - The prompt to send to the LLM.
 * @param model - The model to use (default: `'gemini-1.5-flash'`).
 * @returns Raw string response from the LLM.
 */
export async function callLLM(
  prompt: string,
  model: string = 'gemini-1.5-flash'
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  // Use retry logic for rate limits
  return retryWithBackoff(async () => {
    try {
    // Get the generative model
    const generativeModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        maxOutputTokens: 32768, // Increased token limit for very large course generation
      },
    });

    // Combine system instruction with user prompt
    const fullPrompt = `You are an expert educational content generator. Always respond with valid JSON only, no additional text or markdown formatting.

${prompt}`;

    // Use streaming to handle very large responses
    // This ensures we get the complete response even if it's very long
    const result = await generativeModel.generateContentStream(fullPrompt);
    
    // Collect all chunks from the stream
    let content = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      content += chunkText;
    }

    // If streaming didn't work or returned empty, try non-streaming as fallback
    if (!content || content.trim().length === 0) {
      console.log('Streaming returned empty, trying non-streaming approach...');
      const fallbackResult = await generativeModel.generateContent(fullPrompt);
      const fallbackResponse = fallbackResult.response;
      content = fallbackResponse.text();
    }

    if (!content || content.trim().length === 0) {
      throw new Error('No response content from LLM');
    }

    // Log response length for debugging
    console.log(`LLM Response length: ${content.length} characters`);

      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM API call failed: ${error.message}`);
      }
      throw new Error('LLM API call failed with unknown error');
    }
  });
}

/**
 * Parses JSON response from the LLM, handling potential markdown code blocks.
 *
 * **Specification**:
 *
 * Requires:
 * - `response` is a string that is expected to contain a JSON value, optionally
 *   wrapped in a markdown code block with ``` or ```json fences.
 *
 * Effects:
 * - Strips leading/trailing markdown fences if present.
 * - Logs warnings if the JSON text appears structurally incomplete
 *   (unbalanced braces/brackets).
 * - Attempts to `JSON.parse` the cleaned string and returns the resulting value
 *   as type `T`.
 * - If parsing fails, logs detailed diagnostics and throws an `Error` whose
 *   message describes the parse error and includes a preview of the response.
 * - If the response appears truncated (very long, no closing brace/bracket),
 *   throws an `Error` that explicitly mentions truncation.
 *
 * This function does not mutate its input string or external state; it only
 * performs logging and throws on failure.
 *
 * @param response - The raw response from the LLM.
 * @returns Parsed JSON value of type `T`.
 */
export function parseJSONResponse<T>(response: string): T {
  try {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Check if JSON appears incomplete (common signs of truncation)
    const trimmedCleaned = cleaned.trim();
    if (trimmedCleaned.length > 0) {
      // Check for unclosed brackets/braces (signs of truncation)
      const openBraces = (trimmedCleaned.match(/{/g) || []).length;
      const closeBraces = (trimmedCleaned.match(/}/g) || []).length;
      const openBrackets = (trimmedCleaned.match(/\[/g) || []).length;
      const closeBrackets = (trimmedCleaned.match(/\]/g) || []).length;
      
      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.warn(`JSON appears incomplete: ${openBraces} open braces vs ${closeBraces} close braces, ${openBrackets} open brackets vs ${closeBrackets} close brackets`);
        console.warn(`Response length: ${response.length} characters`);
        console.warn(`Last 200 chars: ${trimmedCleaned.slice(-200)}`);
      }
    }

    // Try to parse the JSON
    return JSON.parse(cleaned) as T;
  } catch (error) {
    // If parsing fails, try to find where the JSON breaks and provide better error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const responsePreview = response.length > 1000 
      ? response.substring(0, 1000) + '... [truncated]' 
      : response;
    
    console.error('JSON Parse Error:', errorMessage);
    console.error('Response preview (first 1000 chars):', responsePreview);
    console.error('Full response length:', response.length);
    console.error('Last 500 chars:', response.slice(-500));
    
    // Check if response was truncated
    const isTruncated = response.length > 10000 && (
      !response.trim().endsWith('}') && 
      !response.trim().endsWith(']')
    );
    
    if (isTruncated) {
      throw new Error(`JSON response appears to be truncated. Response length: ${response.length} characters. The API may have hit a token limit. Try reducing the amount of content requested or breaking the generation into smaller chunks.`);
    }
    
    throw new Error(`Failed to parse JSON response: ${errorMessage}. Response length: ${response.length} characters. Preview: ${responsePreview.substring(0, 500)}`);
  }
}

