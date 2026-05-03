/**
 *
 * Strategy
 * ─────────
 *  • A unique test user is created ONCE at the start of the suite
 *    (username / email carry a ms timestamp to avoid collisions).
 *  • Tests run sequentially so each test builds on the previous one.
 *  • No page.route() intercepts — every network call hits the real
 *    Supabase database and Next.js API routes.
 *
 * Prerequisites
 * ─────────────
 *  • `npm run dev` is already running (playwright.config.ts reuses it).
 *  • Supabase credentials are set in .env.local / .env.
 *
 * Environment: Windows 11 · Chrome (Desktop) · 1280×720
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Unique test-user credentials ────────────────────────────────────────────
const TS        = Date.now()
const USERNAME  = `tester${TS}`
const EMAIL     = `tester${TS}@qaswifted.com`
const PASSWORD  = `Test@${TS}`.slice(0, 20)   // satisfies: 8+ chars, upper, lower, digit

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fill the login form and submit. */
async function performLogin(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /^Login$/i }).click()
}

// ══════════════════════════════════════════════════════════════════════════════
//  ST-001  Homepage loads with correct title and hero section
// ══════════════════════════════════════════════════════════════════════════════
test('ST-001: Homepage loads with correct title, hero heading, and Login/Sign Up navbar buttons', async ({ page }) => {
  await page.goto('/')

  // Page title
  await expect(page).toHaveTitle(/SwiftEd|AI Learning/i)

  // Hero h1 heading
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SwiftEd')

  // Navbar must show Login and Sign Up to guests
  await expect(page.getByRole('link', { name: /^Login$/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /^Sign Up$/i }).first()).toBeVisible()

  // Feature cards
  await expect(page.getByText('Structured Study Roadmaps')).toBeVisible()
  await expect(page.getByText('AI-Generated Summaries & Quizzes')).toBeVisible()
  await expect(page.getByText('Progress Tracking & Insights')).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-002  Signup page renders all required form elements
// ══════════════════════════════════════════════════════════════════════════════
test('ST-002: Signup page renders email, username, password fields and Register button', async ({ page }) => {
  await page.goto('/signup')

  await expect(page.getByRole('heading', { name: /Welcome to SwiftEd/i })).toBeVisible()
  await expect(page.getByText('Create your account to get started')).toBeVisible()

  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#username')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Register$/i })).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-003  Signup form shows validation errors on empty submit
// ══════════════════════════════════════════════════════════════════════════════
test('ST-003: Signup form shows validation errors when submitted without any data', async ({ page }) => {
  await page.goto('/signup')

  await page.getByRole('button', { name: /^Register$/i }).click()

  await expect(page.getByText(/Email is required/i)).toBeVisible()
  await expect(page.getByText(/Username is required/i)).toBeVisible()
  await expect(page.getByText(/Password is required/i)).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-004  Signup form rejects an invalid email format
// ══════════════════════════════════════════════════════════════════════════════
test('ST-004: Signup form rejects invalid email format and shows error message', async ({ page }) => {
  await page.goto('/signup')

  await page.locator('#email').fill('notanemail')
  await page.locator('#username').fill('validuser')
  await page.locator('#password').fill('ValidPass1')
  await page.getByRole('button', { name: /^Register$/i }).click()

  await expect(page.getByText(/Invalid email format/i)).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-005  Signup form rejects a weak password (no uppercase)
// ══════════════════════════════════════════════════════════════════════════════
test('ST-005: Signup form rejects weak password (no uppercase letter)', async ({ page }) => {
  await page.goto('/signup')

  await page.locator('#email').fill('test@test.com')
  await page.locator('#username').fill('testuser')
  await page.locator('#password').fill('alllowercase1')
  await page.getByRole('button', { name: /^Register$/i }).click()

  await expect(page.getByText(/at least one uppercase letter/i)).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-006  Successful user registration (real Supabase insert)
// ══════════════════════════════════════════════════════════════════════════════
test('ST-006: New user can register successfully and is redirected to /login', async ({ page }) => {
  await page.goto('/signup')

  await page.locator('#email').fill(EMAIL)
  await page.locator('#username').fill(USERNAME)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Register$/i }).click()

  // Success toast
  await expect(page.getByText(/Registration successful/i)).toBeVisible({ timeout: 15000 })

  // Redirect to /login after 1.5 s delay
  await page.waitForURL('**/login', { timeout: 10000 })
  expect(page.url()).toContain('/login')
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-007  Duplicate registration is rejected
// ══════════════════════════════════════════════════════════════════════════════
test('ST-007: Registering with an already-used email/username shows conflict error', async ({ page }) => {
  // USERNAME was registered in ST-006; attempting again must be rejected
  await page.goto('/signup')

  await page.locator('#email').fill(EMAIL)
  await page.locator('#username').fill(USERNAME)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Register$/i }).click()

  await expect(page.getByText(/User already exists/i)).toBeVisible({ timeout: 15000 })
  // Must stay on /signup
  expect(page.url()).toContain('/signup')
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-008  Login page renders all elements
// ══════════════════════════════════════════════════════════════════════════════
test('ST-008: Login page renders username, password fields, Remember Me and Login button', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: /Welcome to SwiftEd/i })).toBeVisible()
  await expect(page.locator('#username')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.getByRole('checkbox')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Login$/i })).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-009  Login fails with wrong password and shows error toast
// ══════════════════════════════════════════════════════════════════════════════
test('ST-009: Login with wrong password shows "Invalid username or password" error', async ({ page }) => {
  await performLogin(page, USERNAME, 'WrongPass999!')

  await expect(page.getByText(/Invalid username or password/i)).toBeVisible({ timeout: 10000 })
  // Must stay on /login
  expect(page.url()).toContain('/login')
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-010  Successful login redirects user to /courses
// ══════════════════════════════════════════════════════════════════════════════
test('ST-010: User logs in with valid credentials and is redirected to /courses', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)

  // Success toast
  await expect(page.getByText(/Login successful/i)).toBeVisible({ timeout: 10000 })

  // Redirect to /courses after 1.5 s
  await page.waitForURL('**/courses', { timeout: 10000 })
  expect(page.url()).toContain('/courses')

  // Welcome heading visible
  await expect(
    page.getByRole('heading', { name: /Welcome back, ready for your next lesson/i })
  ).toBeVisible({ timeout: 8000 })
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-011  Courses page shows authenticated user in navbar
// ══════════════════════════════════════════════════════════════════════════════
test('ST-011: After login, navbar shows the logged-in username instead of Login/Sign Up buttons', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)
  await page.waitForURL('**/courses', { timeout: 10000 })

  // Username must appear in the navbar
  await expect(page.getByText(USERNAME).first()).toBeVisible({ timeout: 8000 })

  // Login / Sign Up links must be GONE
  await expect(page.getByRole('link', { name: /^Login$/i })).not.toBeVisible()
  await expect(page.getByRole('link', { name: /^Sign Up$/i })).not.toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-012  Search bar filters courses in real time
// ══════════════════════════════════════════════════════════════════════════════
test('ST-012: Authenticated user searches "Linear Algebra" and only that course card remains visible', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)
  await page.waitForURL('**/courses', { timeout: 10000 })

  const searchInput = page.getByPlaceholder('Search courses...')
  await expect(searchInput).toBeVisible({ timeout: 8000 })

  await searchInput.fill('Linear Algebra')

  // Matching card visible
  await expect(page.getByText('Linear Algebra').first()).toBeVisible({ timeout: 5000 })

  // Non-matching card must disappear
  await expect(page.getByText('Web Engineering')).not.toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-013  Searching a non-existent course shows empty state
// ══════════════════════════════════════════════════════════════════════════════
test('ST-013: Searching a course that does not exist shows "No courses found." message', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)
  await page.waitForURL('**/courses', { timeout: 10000 })

  const searchInput = page.getByPlaceholder('Search courses...')
  await expect(searchInput).toBeVisible({ timeout: 8000 })
  await searchInput.fill('QuantumPhysicsXYZ999')

  await expect(page.getByText('No courses found.')).toBeVisible({ timeout: 5000 })
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-014  My Courses tab empty state for a brand-new user
// ══════════════════════════════════════════════════════════════════════════════
test('ST-014: Newly registered user switches to My Courses tab and sees the empty-state message', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)
  await page.waitForURL('**/courses', { timeout: 10000 })

  // Switch to My Courses
  await page.getByRole('button', { name: /My Courses/i }).click()

  // Empty state — new user has no saved courses
  await expect(page.getByText('No saved courses yet.')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('Search a course and generate it to save here.')).toBeVisible()
})

// ══════════════════════════════════════════════════════════════════════════════
//  ST-015  Authenticated user logs out and is returned to homepage
// ══════════════════════════════════════════════════════════════════════════════
test('ST-015: Authenticated user clicks Log out from navbar dropdown and is redirected to homepage', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)
  await page.waitForURL('**/courses', { timeout: 10000 })

  // Open the user dropdown by clicking the username
  const usernameBtn = page.getByText(USERNAME).first()
  await expect(usernameBtn).toBeVisible({ timeout: 8000 })
  await usernameBtn.click()

  // "Log out" button appears in the dropdown
  const logoutBtn = page.getByRole('button', { name: /^Log out$/i })
  await expect(logoutBtn).toBeVisible({ timeout: 5000 })
  await logoutBtn.click()

  // Redirected to homepage
  await page.waitForURL('**/', { timeout: 8000 })
  expect(page.url()).toMatch(/localhost:3000\/?$/)

  // Login / Sign Up buttons reappear — user is now a guest
  await expect(page.getByRole('link', { name: /^Login$/i }).first()).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('link', { name: /^Sign Up$/i }).first()).toBeVisible()
})
test('ST-016: User can generate custom course content', async ({ page }) => {
  await performLogin(page, USERNAME, PASSWORD)
  await page.waitForURL('**/courses', { timeout: 10000 })

  // Click "Create Custom Course"
  await page.getByRole('button', { name: /^Create Custom Course$/i }).click()

  // Fill the form
  await page.locator('#topic').fill('TypeScript basics')
  await page.locator('#duration').fill('3')
  await page.locator('#difficulty').selectOption('Beginner')
  await page.locator('#format').selectOption('Text')

  // Click "Generate"
  await page.getByRole('button', { name: /^Generate$/i }).click()

  // Wait for the course to appear
  await expect(page.getByText('TypeScript basics')).toBeVisible({ timeout: 10000 })
})