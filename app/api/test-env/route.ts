import { NextResponse } from 'next/server';

/**
 * GET /api/test-env
 * Test endpoint to check if environment variables are loaded
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!apiKey;
  const keyLength = apiKey?.length || 0;
  const keyPrefix = apiKey?.substring(0, 10) || 'N/A';

  return NextResponse.json({
    hasApiKey: hasKey,
    keyLength,
    keyPrefix: hasKey ? `${keyPrefix}...` : 'N/A',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')),
    message: hasKey 
      ? 'API key is loaded successfully' 
      : 'API key is NOT loaded. Check your .env file and restart the server.',
  });
}

