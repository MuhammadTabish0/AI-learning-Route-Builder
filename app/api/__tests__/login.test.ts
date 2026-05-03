import { NextRequest } from 'next/server'
import { POST } from '../login/route'

// Mock the supabase-server module
jest.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

// Mock fs/promises and fs
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

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // UT-011
  it('UT-011: Returns 400 if username is missing from body', async () => {
    const req = makeRequest({ password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Missing required fields/)
  })

  // UT-012
  it('UT-012: Returns 400 if password is missing from body', async () => {
    const req = makeRequest({ username: 'testuser' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Missing required fields/)
  })

  // UT-013
  it('UT-013: Returns 401 if username does not exist in database', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const req = makeRequest({ username: 'ghost', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.error).toBe('Invalid username or password')
  })

  // UT-014
  it('UT-014: Returns 401 if password does not match stored password', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ username: 'testuser', password: 'correctpass', email: 'a@a.com' }],
        error: null,
      }),
    })

    const req = makeRequest({ username: 'testuser', password: 'wrongpass' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.error).toBe('Invalid username or password')
  })

  // UT-015
  it('UT-015: Returns 200 with user data on successful login', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{
          username: 'testuser',
          password: 'pass123',
          email: 'test@test.com',
          account_type: 'Student',
          subscription_plan: 'Free',
        }],
        error: null,
      }),
    })

    const req = makeRequest({ username: 'testuser', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.username).toBe('testuser')
    expect(json.data).not.toHaveProperty('password')
  })

  // UT-016
  it('UT-016: Returns 500 if database query throws an error', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB connection failed' },
      }),
    })

    const req = makeRequest({ username: 'testuser', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).toMatch(/Database error/)
  })
})
