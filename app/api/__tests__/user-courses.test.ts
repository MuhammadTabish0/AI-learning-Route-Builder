import { NextRequest } from 'next/server'
import { GET, POST } from '../user-courses/route'

jest.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { supabase } from '@/lib/supabase-server'
const mockFrom = supabase.from as jest.Mock

describe('GET /api/user-courses', () => {
  beforeEach(() => jest.clearAllMocks())

  // UT-022
  it('UT-022: Returns 400 if username query param is missing', async () => {
    const req = new NextRequest('http://localhost/api/user-courses')
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toBe('Username is required')
  })

  // UT-023
  it('UT-023: Returns 200 with courses array when username is provided', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 1, course_name: 'React Basics', username: 'ali' }],
        error: null,
      }),
    })

    const req = new NextRequest('http://localhost/api/user-courses?username=ali')
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.courses).toHaveLength(1)
    expect(json.courses[0].course_name).toBe('React Basics')
  })

  // UT-024
  it('UT-024: Returns 200 with empty array when user has no courses', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const req = new NextRequest('http://localhost/api/user-courses?username=newuser')
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.courses).toEqual([])
  })

  // UT-025
  it('UT-025: Returns 500 if DB query fails during GET', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    })

    const req = new NextRequest('http://localhost/api/user-courses?username=ali')
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).toBe('Failed to fetch courses')
  })
})

describe('POST /api/user-courses', () => {
  beforeEach(() => jest.clearAllMocks())

  function makeRequest(body: object): NextRequest {
    return new NextRequest('http://localhost/api/user-courses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // UT-026
  it('UT-026: Returns 400 if required fields are missing in POST body', async () => {
    const req = makeRequest({ username: 'ali' }) // missing courseName and courseData
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Missing required fields/)
  })

  // UT-027
  it('UT-027: Inserts new course and returns 200 when course does not exist yet', async () => {
    // Check existing: returns empty
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    // Insert new course
    .mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 10, course_name: 'Python', username: 'ali' },
        error: null,
      }),
    })

    const req = makeRequest({ username: 'ali', courseName: 'Python', courseData: { chapters: [] } })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.course.course_name).toBe('Python')
  })

  // UT-028
  it('UT-028: Updates existing course and returns 200 when course already exists', async () => {
    // Check existing: returns one row
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [{ id: 5 }], error: null }),
    })
    // Update existing
    .mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 5, course_name: 'Python', username: 'ali' },
        error: null,
      }),
    })

    const req = makeRequest({ username: 'ali', courseName: 'Python', courseData: { chapters: ['ch1'] } })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })
})
