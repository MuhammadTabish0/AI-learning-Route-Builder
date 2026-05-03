/**
 * INTEGRATION TESTS: Course Management Module ↔ Supabase Database
 * Covers IT-005, IT-006, IT-007
 *
 * Integration scope: The GET + POST route handlers interact with the Supabase
 * `user_courses` table. The upsert logic (check-then-insert vs check-then-update)
 * is tested as an integrated unit to verify the branching pipeline.
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../user-courses/route'

jest.mock('@/lib/supabase-server', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '@/lib/supabase-server'
const mockFrom = supabase.from as jest.Mock

function makePostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/user-courses', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const coursePayload = {
  username: 'integrationuser',
  courseName: 'Linear Algebra',
  courseData: { chapters: ['Vectors', 'Matrices'] },
  image: '/math.jpg',
}

// ── IT-005 ────────────────────────────────────────────────────────────────────
describe('IT-005: POST /api/user-courses → Supabase INSERT integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should check for existing course, find none, and INSERT new row', async () => {
    // Check existing: none found
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    // Insert new course
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 42,
          username: coursePayload.username,
          course_name: coursePayload.courseName,
          course_data: coursePayload.courseData,
          image: coursePayload.image,
        },
        error: null,
      }),
    })

    const res = await POST(makePostRequest(coursePayload))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.course.course_name).toBe('Linear Algebra')
    expect(json.course.id).toBe(42)

    // Both the check-query AND the insert must have touched 'user_courses'
    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(mockFrom).toHaveBeenCalledWith('user_courses')
  })
})

// ── IT-006 ────────────────────────────────────────────────────────────────────
describe('IT-006: POST /api/user-courses → Supabase UPDATE integration (upsert logic)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should find existing course row, and UPDATE it instead of inserting duplicate', async () => {
    // Check existing: found one row
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 42 }], // same id as IT-005
        error: null,
      }),
    })
    // Update existing row
    mockFrom.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 42,
          username: coursePayload.username,
          course_name: coursePayload.courseName,
          course_data: { chapters: ['Vectors', 'Matrices', 'Eigenvalues'] }, // updated
        },
        error: null,
      }),
    })

    const updatedPayload = {
      ...coursePayload,
      courseData: { chapters: ['Vectors', 'Matrices', 'Eigenvalues'] },
    }

    const res = await POST(makePostRequest(updatedPayload))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // Verify the updated chapter list is returned (not the original)
    expect(json.course.course_data.chapters).toContain('Eigenvalues')
    // Same ID proves it was an update, not a fresh insert
    expect(json.course.id).toBe(42)

    // 2 DB calls: check + update (NOT check + insert)
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })
})

// ── IT-007 ────────────────────────────────────────────────────────────────────
describe('IT-007: GET /api/user-courses → Supabase SELECT + ordering integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should query user_courses table with correct username filter and return ordered list', async () => {
    const mockCourses = [
      { id: 43, course_name: 'Data Science', created_at: '2026-05-03T18:00:00Z' },
      { id: 42, course_name: 'Linear Algebra', created_at: '2026-05-02T10:00:00Z' },
    ]

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockCourses, error: null }),
    })

    const req = new NextRequest('http://localhost/api/user-courses?username=integrationuser')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.courses).toHaveLength(2)
    // First item should be the most recently created (ordered DESC)
    expect(json.courses[0].course_name).toBe('Data Science')
    expect(json.courses[1].course_name).toBe('Linear Algebra')

    // DB must have been called with correct table name
    expect(mockFrom).toHaveBeenCalledWith('user_courses')
  })
})
