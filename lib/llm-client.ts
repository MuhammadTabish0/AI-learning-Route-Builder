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
 * Calls the Gemini API with a prompt and returns the response
 * @param prompt - The prompt to send to the LLM
 * @param model - The model to use (default: gemini-1.5-flash for cost efficiency)
 * @returns Promise<string> - The raw response from the LLM
 */
/**
 * Retry function with exponential backoff
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
        maxOutputTokens: 16384, // Increase token limit for large course generation
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
 * Sanitizes JSON string by escaping control characters within string values
 * This fixes issues where LLMs generate unescaped newlines, tabs, etc. in JSON strings
 */
function sanitizeJSON(jsonString: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    const charCode = char.charCodeAt(0);
    
    if (escapeNext) {
      // We're escaping this character, add it as-is
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      // Escape sequence, keep it and mark next char as escaped
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      // Toggle string state
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      // We're inside a string value
      // Control characters (0x00-0x1F) except already escaped ones need to be escaped
      if (charCode >= 0x00 && charCode <= 0x1F) {
        // Escape control characters
        switch (char) {
          case '\n':
            result += '\\n';
            break;
          case '\r':
            result += '\\r';
            break;
          case '\t':
            result += '\\t';
            break;
          case '\b':
            result += '\\b';
            break;
          case '\f':
            result += '\\f';
            break;
          default:
            // Escape other control characters as \uXXXX
            result += `\\u${charCode.toString(16).padStart(4, '0')}`;
        }
      } else {
        result += char;
      }
    } else {
      // Outside string, add character as-is
      result += char;
    }
  }
  
  return result;
}

/**
 * Parses JSON response from LLM, handling potential markdown code blocks and control characters
 * @param response - The raw response from the LLM
 * @returns Parsed JSON object
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

    // Try to parse the JSON directly first
    try {
      return JSON.parse(cleaned) as T;
    } catch (parseError: any) {
      // If parsing fails due to control characters, try sanitizing
      if (parseError.message && (
        parseError.message.includes('control character') ||
        parseError.message.includes('Bad control character')
      )) {
        console.warn('Detected control characters in JSON, attempting to sanitize...');
        const sanitized = sanitizeJSON(cleaned);
        return JSON.parse(sanitized) as T;
      }
      // Re-throw if it's not a control character error
      throw parseError;
    }
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

