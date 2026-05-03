/**
 * INTEGRATION TESTS: Auth Module ↔ Supabase Database
 * Covers IT-001, IT-002, IT-003, IT-004
 *
 * Integration scope: The route handler, body validation, and Supabase DB call
 * all work together as a pipeline. Only Supabase and filesystem are mocked
 * (external services). All internal logic is tested end-to-end.
 */

import { NextRequest } from 'next/server'
import { POST as register } from '../register/route'
import { POST as login } from '../login/route'

// ── Mock external services ONLY ──────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRegisterRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeLoginRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// A complete user fixture for reuse across tests
const newUser = {
  email: 'newstudent@test.com',
  username: 'newstudent',
  password: 'Test@1234',
  accountType: 'Student',
  subscriptionPlan: 'Free',
}

// ── IT-001 ────────────────────────────────────────────────────────────────────
describe('IT-001: Register route + Supabase INSERT integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should insert new user into DB and return 200 with correct user shape', async () => {
    // Step 1 — No duplicate exists
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    // Step 2 — Insert succeeds, DB returns inserted row
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          email: newUser.email,
          username: newUser.username,
          account_type: 'Student',
          subscription_plan: 'Free',
        },
        error: null,
      }),
    })

    const res = await register(makeRegisterRequest(newUser))
    const json = await res.json()

    // Verify response shape from the combined route + DB layer
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe(newUser.email)
    expect(json.data.username).toBe(newUser.username)
    expect(json.data.accountType).toBe('Student')
    // Critical: password must NEVER appear in the response
    expect(json.data).not.toHaveProperty('password')

    // Verify Supabase was called with 'users' table (both check + insert)
    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(mockFrom).toHaveBeenCalledWith('users')
  })
})

// ── IT-002 ────────────────────────────────────────────────────────────────────
describe('IT-002: Register route + Supabase duplicate-check integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return 409 and NOT call insert when email/username already exists', async () => {
    // Existing user found in DB
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ email: newUser.email, username: newUser.username }],
        error: null,
      }),
    })

    const res = await register(makeRegisterRequest(newUser))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toMatch(/User already exists/)

    // Ensure insert was NEVER called (only 1 DB call total — the check)
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })
})

// ── IT-003 ────────────────────────────────────────────────────────────────────
describe('IT-003: Login route + Supabase SELECT + filesystem logging integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should query users table, match password, and return 200 with user data', async () => {
    // DB returns matching user
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{
          username: newUser.username,
          password: newUser.password,
          email: newUser.email,
          account_type: 'Student',
          subscription_plan: 'Free',
        }],
        error: null,
      }),
    })

    const res = await login(makeLoginRequest({
      username: newUser.username,
      password: newUser.password,
      rememberMe: true,
    }))
    const json = await res.json()

    // Route + DB integration produced correct outcome
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.message).toBe('Login successful')
    expect(json.data.username).toBe(newUser.username)
    expect(json.data.email).toBe(newUser.email)
    // Ensure password is not returned
    expect(json.data).not.toHaveProperty('password')

    // Verify DB was queried via 'users' table
    expect(mockFrom).toHaveBeenCalledWith('users')
  })
})

// ── IT-004 ────────────────────────────────────────────────────────────────────
describe('IT-004: Login route + Supabase SELECT + password mismatch integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return 401 when DB user found but password does not match', async () => {
    // DB query succeeds and returns user, but stored password is different
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{
          username: newUser.username,
          password: 'RealStoredPassword!',
          email: newUser.email,
          account_type: 'Student',
          subscription_plan: 'Free',
        }],
        error: null,
      }),
    })

    const res = await login(makeLoginRequest({
      username: newUser.username,
      password: 'WrongPassword!', // mismatched
    }))
    const json = await res.json()

    // DB lookup succeeded, but password comparison inside route rejected
    expect(res.status).toBe(401)
    expect(json.error).toBe('Invalid username or password')
    // DB was still queried (integration between route + DB happened)
    expect(mockFrom).toHaveBeenCalledWith('users')
  })
})
