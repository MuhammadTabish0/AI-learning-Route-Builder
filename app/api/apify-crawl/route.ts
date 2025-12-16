import { NextRequest, NextResponse } from "next/server"
import { runWebsiteCrawler } from "@/lib/apify"

/**
 * POST /api/apify-crawl
 * Body: { startUrls: string[], maxPages?: number }
 * Returns: { pages: { url, title, text }[] }
 *
 * This is a simple integration point with Apify's Website Content Crawler.
 * You can call it from the frontend to verify/content-scrape specific URLs.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { startUrls, maxPages } = body as { startUrls?: string[]; maxPages?: number }

    if (!Array.isArray(startUrls) || startUrls.length === 0) {
      return NextResponse.json({ error: "startUrls must be a non-empty array" }, { status: 400 })
    }

    const pages = await runWebsiteCrawler({
      startUrls,
      maxPages: maxPages ?? 3,
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Apify crawl error:", error)
    const message = error instanceof Error ? error.message : "Unknown Apify error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


