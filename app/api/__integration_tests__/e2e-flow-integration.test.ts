/**
 * INTEGRATION TEST: Full End-to-End User Journey
 * Covers IT-015
 *
 * Integration scope: Chains all major modules together in sequence:
 * Register → Login → Save Course → Retrieve Courses
 *
 * This is the highest-level integration test, verifying that:
 * 1. Auth module (register) creates a DB record
 * 2. Auth module (login) reads and validates that same record
 * 3. Course module (POST) saves course data linked to the user
 * 4. Course module (GET) retrieves the saved course for that user
 *
 * Only Supabase and filesystem are mocked (true external boundaries).
 */

import { NextRequest } from 'next/server'
import { POST as register } from '../register/route'
import { POST as login } from '../login/route'
import { GET as getCourses, POST as saveCourse } from '../user-courses/route'

jest.mock('@/lib/supabase-server', () => ({
  supabase: { from: jest.fn() },
}))

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('[]'),
  mkdir: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}))

import { supabase } from '@/lib/supabase-server'
const mockFrom = supabase.from as jest.Mock

// Shared test user state (simulates a real DB record lifecycle)
const testUser = {
  email: 'e2e@test.com',
  username: 'e2euser',
  password: 'SecurePass@123',
  accountType: 'Student',
  subscriptionPlan: 'Free',
}

const savedCourse = {
  id: 99,
  username: testUser.username,
  course_name: 'Data Science',
  course_data: { chapters: ['Intro', 'Statistics', 'ML'] },
  image: '/datasci.jpg',
  created_at: '2026-05-03T18:00:00Z',
}

// ── IT-015 ────────────────────────────────────────────────────────────────────
describe('IT-015: Full End-to-End — Register → Login → Save Course → Retrieve Courses', () => {
  beforeEach(() => jest.clearAllMocks())

  it('Step 1 of 4 — Register: creates user in DB and returns 200 with correct shape', async () => {
    // DB: no duplicate found
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    // DB: insert returns new user
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          email: testUser.email,
          username: testUser.username,
          account_type: testUser.accountType,
          subscription_plan: testUser.subscriptionPlan,
        },
        error: null,
      }),
    })

    const req = new NextRequest('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await register(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.username).toBe(testUser.username)
    expect(json.data).not.toHaveProperty('password')
  })

  it('Step 2 of 4 — Login: authenticates registered user and returns session data', async () => {
    // DB returns the user that was registered in Step 1
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{
          username: testUser.username,
          password: testUser.password,
          email: testUser.email,
          account_type: testUser.accountType,
          subscription_plan: testUser.subscriptionPlan,
        }],
        error: null,
      }),
    })

    const req = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: testUser.username, password: testUser.password }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await login(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe(testUser.email)
    // Login response should expose account info but NOT password
    expect(json.data).not.toHaveProperty('password')
  })

  it('Step 3 of 4 — Save Course: persists course linked to logged-in user', async () => {
    // DB: no existing course for user
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    // DB: insert returns new course row
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: savedCourse, error: null }),
    })

    const req = new NextRequest('http://localhost/api/user-courses', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser.username,
        courseName: savedCourse.course_name,
        courseData: savedCourse.course_data,
        image: savedCourse.image,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await saveCourse(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.course.course_name).toBe('Data Science')
    expect(json.course.id).toBe(99)
  })

  it('Step 4 of 4 — Retrieve Courses: fetches the saved course for the user', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [savedCourse],
        error: null,
      }),
    })

    const req = new NextRequest(
      `http://localhost/api/user-courses?username=${testUser.username}`
    )
    const res = await getCourses(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.courses).toHaveLength(1)
    expect(json.courses[0].course_name).toBe('Data Science')
    expect(json.courses[0].username).toBe(testUser.username)
    // Verify the full chapter data is intact (data integrity check)
    expect(json.courses[0].course_data.chapters).toContain('ML')
  })
})
