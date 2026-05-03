import { NextRequest } from 'next/server'
import { POST } from '../register/route'

jest.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { supabase } from '@/lib/supabase-server'
const mockFrom = supabase.from as jest.Mock

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // UT-017
  it('UT-017: Returns 400 if email is missing', async () => {
    const req = makeRequest({ username: 'newuser', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Missing required fields/)
  })

  // UT-018
  it('UT-018: Returns 400 if username is missing', async () => {
    const req = makeRequest({ email: 'a@a.com', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/Missing required fields/)
  })

  // UT-019
  it('UT-019: Returns 409 if email or username already exists', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ email: 'existing@test.com', username: 'existingUser' }],
        error: null,
      }),
    })

    const req = makeRequest({ email: 'existing@test.com', username: 'existingUser', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(409)
    expect(json.error).toMatch(/User already exists/)
  })

  // UT-020
  it('UT-020: Returns 200 on successful registration with correct response shape', async () => {
    // First call: check for existing user (returns empty)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    // Second call: insert new user
    .mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          email: 'new@test.com',
          username: 'newuser',
          account_type: 'Student',
          subscription_plan: 'Free',
        },
        error: null,
      }),
    })

    const req = makeRequest({ email: 'new@test.com', username: 'newuser', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe('new@test.com')
  })

  // UT-021
  it('UT-021: Returns 500 if database check query fails', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      }),
    })

    const req = makeRequest({ email: 'new@test.com', username: 'newuser', password: 'pass123' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).toMatch(/Database error/)
  })
})
