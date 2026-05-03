/**
 * INTEGRATION TESTS: Environment Config ↔ API Layer
 * Covers IT-014
 *
 * Integration scope: Tests that GET /api/test-env correctly reads from
 * process.env and surfaces environment configuration status through the
 * API response layer.
 */

import { GET } from '../test-env/route'

const originalEnv = process.env

afterEach(() => {
  process.env = originalEnv
})

// ── IT-014 ────────────────────────────────────────────────────────────────────
describe('IT-014: GET /api/test-env → process.env config integration', () => {
  it('should report hasApiKey=true when GEMINI_API_KEY is set in environment', async () => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'AIzaSyFakeKey1234567890',
    }

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.hasApiKey).toBe(true)
    expect(json.keyLength).toBe('AIzaSyFakeKey1234567890'.length)
    // Key prefix should show only the first 10 chars followed by "..."
    expect(json.keyPrefix).toBe('AIzaSyFake...')
    expect(json.message).toBe('API key is loaded successfully')
  })

  it('should report hasApiKey=false and show warning message when key is missing', async () => {
    const env = { ...originalEnv }
    delete (env as any).GEMINI_API_KEY
    process.env = env

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.hasApiKey).toBe(false)
    expect(json.keyLength).toBe(0)
    expect(json.keyPrefix).toBe('N/A')
    expect(json.message).toMatch(/NOT loaded/)
  })
})
