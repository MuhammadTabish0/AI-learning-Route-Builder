import { NextRequest } from 'next/server'
import { POST as postRoadmap } from '../generate-roadmap/route'
import { POST as postNotes } from '../generate-notes/route'
import { POST as postResources } from '../generate-resources/route'

// Mock all AI generators
jest.mock('@/ai/roadmapGenerator', () => ({
  generateRoadmap: jest.fn(),
}))
jest.mock('@/ai/notesGenerator', () => ({
  generateNotes: jest.fn(),
}))
jest.mock('@/ai/resourcesGenerator', () => ({
  generateResources: jest.fn(),
}))

import { generateRoadmap } from '@/ai/roadmapGenerator'
import { generateNotes } from '@/ai/notesGenerator'
import { generateResources } from '@/ai/resourcesGenerator'

function makePost(url: string, body: object): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── GENERATE ROADMAP ─────────────────────────────────────────────────────────

describe('POST /api/generate-roadmap', () => {
  beforeEach(() => jest.clearAllMocks())

  // UT-029
  it('UT-029: Returns 400 if subject field is missing', async () => {
    const req = makePost('http://localhost/api/generate-roadmap', {})
    const res = await postRoadmap(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Subject name is required/)
  })

  // UT-030
  it('UT-030: Returns 400 if subject is an empty string', async () => {
    const req = makePost('http://localhost/api/generate-roadmap', { subject: '   ' })
    const res = await postRoadmap(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Subject name is required/)
  })

  // UT-031
  it('UT-031: Returns 200 with roadmap data on successful generation', async () => {
    const mockRoadmap = { chapters: ['Chapter 1', 'Chapter 2'] };
    (generateRoadmap as jest.Mock).mockResolvedValue(mockRoadmap)

    const req = makePost('http://localhost/api/generate-roadmap', { subject: 'Linear Algebra' })
    const res = await postRoadmap(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.chapters).toHaveLength(2)
  })

  // UT-032
  it('UT-032: Returns 500 with error message if AI generator throws', async () => {
    (generateRoadmap as jest.Mock).mockRejectedValue(new Error('LLM quota exceeded'))

    const req = makePost('http://localhost/api/generate-roadmap', { subject: 'Calculus' })
    const res = await postRoadmap(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).toBe('LLM quota exceeded')
  })
})

// ─── GENERATE NOTES ───────────────────────────────────────────────────────────

describe('POST /api/generate-notes', () => {
  beforeEach(() => jest.clearAllMocks())

  // UT-033
  it('UT-033: Returns 400 if subject field is missing', async () => {
    const req = makePost('http://localhost/api/generate-notes', { chapter: 'Vectors' })
    const res = await postNotes(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Subject name is required/)
  })

  // UT-034
  it('UT-034: Returns 400 if chapter field is missing', async () => {
    const req = makePost('http://localhost/api/generate-notes', { subject: 'Maths' })
    const res = await postNotes(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Chapter name is required/)
  })

  // UT-035
  it('UT-035: Returns 200 with notes data when both fields are valid', async () => {
    const mockNotes = { title: 'Vectors', content: '# Introduction\n...' };
    (generateNotes as jest.Mock).mockResolvedValue(mockNotes)

    const req = makePost('http://localhost/api/generate-notes', { subject: 'Maths', chapter: 'Vectors' })
    const res = await postNotes(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.title).toBe('Vectors')
  })

  // UT-036
  it('UT-036: Returns 500 with error message if notes generator throws', async () => {
    (generateNotes as jest.Mock).mockRejectedValue(new Error('Token limit exceeded'))

    const req = makePost('http://localhost/api/generate-notes', { subject: 'Physics', chapter: 'Optics' })
    const res = await postNotes(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).toBe('Token limit exceeded')
  })
})

// ─── GENERATE RESOURCES ───────────────────────────────────────────────────────

describe('POST /api/generate-resources', () => {
  beforeEach(() => jest.clearAllMocks())

  // UT-037
  it('UT-037: Returns 400 if subject field is missing', async () => {
    const req = makePost('http://localhost/api/generate-resources', {})
    const res = await postResources(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Subject name is required/)
  })

  // UT-038
  it('UT-038: Returns 200 with resource data on successful generation', async () => {
    const mockResources = { videos: [], articles: [] };
    (generateResources as jest.Mock).mockResolvedValue(mockResources)

    const req = makePost('http://localhost/api/generate-resources', { subject: 'Python' })
    const res = await postResources(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toHaveProperty('videos')
  })

  // UT-039
  it('UT-039: Returns 500 with error message if resources generator throws', async () => {
    (generateResources as jest.Mock).mockRejectedValue(new Error('Apify unavailable'))

    const req = makePost('http://localhost/api/generate-resources', { subject: 'Java' })
    const res = await postResources(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).toBe('Apify unavailable')
  })

  // UT-040
  it('UT-040: Returns 400 if subject is a whitespace-only string', async () => {
    const req = makePost('http://localhost/api/generate-resources', { subject: '    ' })
    const res = await postResources(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Subject name is required/)
  })
})
