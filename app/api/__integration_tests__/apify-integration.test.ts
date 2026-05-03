/**
 * INTEGRATION TESTS: Apify Crawl Route ↔ lib/apify.ts
 * Covers IT-012, IT-013
 *
 * Integration scope: The route handler delegates to runWebsiteCrawler() from
 * lib/apify.ts. Only the global fetch (Apify external API) is mocked.
 * The route → lib module wiring is tested as an integrated unit.
 */

import { NextRequest } from 'next/server'
import { POST } from '../apify-crawl/route'

// Mock ONLY global fetch (the true external boundary — Apify's API)
// lib/apify.ts itself is NOT mocked — it runs real code
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv, APIFY_TOKEN: 'test-integration-token' }
  global.fetch = jest.fn()
})

afterEach(() => {
  process.env = originalEnv
})

function makePost(body: object): NextRequest {
  return new NextRequest('http://localhost/api/apify-crawl', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── IT-012 ────────────────────────────────────────────────────────────────────
describe('IT-012: POST /api/apify-crawl → lib/apify.ts → Apify external API integration', () => {
  it('should pass startUrls through route to runWebsiteCrawler and return pages array', async () => {
    const fetchMock = global.fetch as jest.Mock

    // Mock Apify run endpoint (returns dataset ID)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { defaultDatasetId: 'dataset-abc-123' } }),
    })

    // Mock Apify dataset items endpoint (returns scraped pages)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          url: 'https://en.wikipedia.org/wiki/Machine_learning',
          title: 'Machine learning - Wikipedia',
          text: 'Machine learning (ML) is a field of inquiry...',
        },
      ]),
    })

    const res = await POST(makePost({
      startUrls: ['https://en.wikipedia.org/wiki/Machine_learning'],
      maxPages: 1,
    }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveProperty('pages')
    expect(json.pages).toHaveLength(1)
    expect(json.pages[0].url).toBe('https://en.wikipedia.org/wiki/Machine_learning')
    expect(json.pages[0].title).toBe('Machine learning - Wikipedia')
    expect(json.pages[0].text).toContain('Machine learning')

    // Verify that BOTH Apify API calls happened through the lib module
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ── IT-013 ────────────────────────────────────────────────────────────────────
describe('IT-013: POST /api/apify-crawl → validation layer blocks empty startUrls', () => {
  it('should return 400 immediately without calling lib/apify.ts when startUrls is empty', async () => {
    const fetchMock = global.fetch as jest.Mock

    const res = await POST(makePost({ startUrls: [] }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('startUrls must be a non-empty array')

    // fetch should NEVER be called — the route validation stopped execution
    // before the lib/apify.ts module was reached
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should return 400 when startUrls is not an array at all', async () => {
    const fetchMock = global.fetch as jest.Mock

    const res = await POST(makePost({ startUrls: 'https://example.com' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('startUrls must be a non-empty array')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
