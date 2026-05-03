import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Directory where all system tests live
  testDir: './e2e',

  // Run tests sequentially (important for video clarity)
  fullyParallel: false,

  // Fail the build on CI if test.only is left
  forbidOnly: !!process.env.CI,

  // Retry failed tests once
  retries: 1,

  // One worker so videos are recorded cleanly one test at a time
  workers: 1,

  // Reporters: terminal list + HTML report with video attachments
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Global settings for ALL tests
  use: {
    // Base URL of the already-running Next.js dev server
    baseURL: 'http://localhost:3000',

    // ── VIDEO RECORDING ─────────────────────────────────────────────────────
    // 'on'              → Record video for EVERY test (pass or fail)
    // 'retain-on-failure' → Record for all, but DELETE for passing tests
    // 'on-first-retry'  → Record on the first retry of a failed test only
    video: 'on',

    // Video output size (matches viewport)
    // Videos are saved inside test-results/<test-name>/video.webm
    // ────────────────────────────────────────────────────────────────────────

    // Collect traces on failures for step-by-step debugging
    trace: 'on-first-retry',

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Viewport size (determines video resolution)
    viewport: { width: 1280, height: 720 },

    // Max time per action (click, fill, etc.)
    actionTimeout: 10000,

    // Slow down every action by 300ms so videos are easy to follow
    launchOptions: {
      slowMo: 300,
    },
  },

  // Test projects — Desktop Chrome only
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // ── WEB SERVER ─────────────────────────────────────────────────────────────
  // Since `npm run dev` is already running in a separate terminal,
  // this block simply checks that localhost:3000 is reachable and uses it.
  // It will NOT try to start a second Next.js instance.
  webServer: {
    command: 'echo "Using existing dev server"',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // MUST be true when dev is already running
    timeout: 15000,
  },
})
