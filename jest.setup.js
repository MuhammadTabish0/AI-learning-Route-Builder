/**
 * Jest Setup File
 * 
 * This file runs before all tests and sets up the test environment.
 * It includes:
 * - Environment variable mocking
 * - Global test utilities
 * - Common test fixtures
 */

// Mock environment variables for testing
process.env.GEMINI_API_KEY = 'test-api-key-mock';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Increase timeout for integration tests
jest.setTimeout(10000);


