import { runWebsiteCrawler } from '../apify'

const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
  global.fetch = jest.fn()
})

afterEach(() => {
  process.env = originalEnv
})

describe('apify - runWebsiteCrawler', () => {
  it('UT-008: Catch missing API Config environment variables immediately', async () => {
    delete process.env.APIFY_TOKEN
    
    await expect(runWebsiteCrawler({ startUrls: ['https://test.com'] })).rejects.toThrow(
      'APIFY_TOKEN is not set in environment variables'
    )
  })

  it('UT-009: Successful integration data maps to crawler structure', async () => {
    process.env.APIFY_TOKEN = 'test_token'

    const fetchMock = global.fetch as jest.Mock
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { defaultDatasetId: 'dataset123' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ url: 'https://test.com', text: 'Mock Text' }])
      })

    const result = await runWebsiteCrawler({ startUrls: ['https://test.com'] })
    expect(result).toEqual([{ url: 'https://test.com', title: undefined, text: 'Mock Text' }])
  })

  it('UT-010: Validates HTTP status code parsing logic on 4xx codes', async () => {
    process.env.APIFY_TOKEN = 'test_token'

    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('Invalid token')
    })

    await expect(runWebsiteCrawler({ startUrls: ['https://test.com'] })).rejects.toThrow(
      'Apify run failed: 401 Unauthorized Invalid token'
    )
  })
})
