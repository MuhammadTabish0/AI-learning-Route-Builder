import { NextRequest } from "next/server"

const APIFY_BASE_URL = "https://api.apify.com/v2"
const WEBSITE_CRAWLER_ACTOR = "apify~website-content-crawler"

function getApifyToken() {
  const token = process.env.APIFY_TOKEN
  if (!token) {
    throw new Error("APIFY_TOKEN is not set in environment variables")
  }
  return token
}

interface CrawlInput {
  startUrls: string[]
  maxPages?: number
}

export interface CrawledPage {
  url: string
  title?: string
  text?: string
}

/**
 * Run Apify Website Content Crawler on a set of URLs and return crawled pages.
 * This uses `waitForFinish` so the call resolves when the crawl is done.
 */
export async function runWebsiteCrawler(input: CrawlInput): Promise<CrawledPage[]> {
  const token = getApifyToken()

  const apiUrl = `${APIFY_BASE_URL}/acts/${WEBSITE_CRAWLER_ACTOR}/runs?token=${encodeURIComponent(
    token,
  )}&waitForFinish=120`

  const apifyInput = {
    startUrls: input.startUrls.map((url) => ({ url })),
    maxCrawlPages: input.maxPages ?? 5,
    // Keep config simple; you can tune this later in Apify UI if needed
    crawlerType: "cheerio",
    proxyConfiguration: { useApifyProxy: true },
  }

  const runRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(apifyInput),
  })

  if (!runRes.ok) {
    const text = await runRes.text().catch(() => "")
    throw new Error(`Apify run failed: ${runRes.status} ${runRes.statusText} ${text}`)
  }

  const runJson: any = await runRes.json()
  const datasetId: string | undefined = runJson.data?.defaultDatasetId

  if (!datasetId) {
    return []
  }

  const datasetUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}`
  const datasetRes = await fetch(datasetUrl)

  if (!datasetRes.ok) {
    const text = await datasetRes.text().catch(() => "")
    throw new Error(`Failed to load Apify dataset: ${datasetRes.status} ${datasetRes.statusText} ${text}`)
  }

  const items: any[] = await datasetRes.json()

  // Map to a compact shape we can use in the app
  const pages: CrawledPage[] = items.map((item) => ({
    url: item.url,
    title: item.title || item.meta?.title,
    text: item.text || item.content || "",
  }))

  return pages
}


