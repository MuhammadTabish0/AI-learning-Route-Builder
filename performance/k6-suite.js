import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * ════════════════════════════════════════════════════════════════
 * SwiftEd — k6 Performance Test Suite
 * ════════════════════════════════════════════════════════════════
 * This script runs multiple performance scenarios concurrently.
 * 
 * To run ALL scenarios:
 *   k6 run performance/k6-suite.js
 * 
 * To run a SPECIFIC scenario (e.g., only login load):
 *   k6 run -e K6_SCENARIO=login_load performance/k6-suite.js
 * 
 * You may need to create a `perfuser` / `PerfPass1` account
 * in your app, or just let 'login_load' fail with 401s (it will
 * still measure latency & throughput). 
 */

export const options = {
  // Define thresholds for the entire suite
  thresholds: {
    // 95% of requests must complete under 2.5s
    http_req_duration: ['p(95)<2500'],
    // Global error rate must be less than 5%
    http_req_failed: ['rate<0.05'],
  },

  scenarios: {
    // ────────────────────────────────────────────────────────
    // PT-001: Baseline Load on Login Endpoint
    // Ramps up to 20 users, holds for 30s, ramps down.
    // ────────────────────────────────────────────────────────
    login_load: {
      executor: 'ramping-vus',
      exec: 'apiLogin',
      startTime: '0s',
      stages: [
        { duration: '10s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '10s', target: 0 },
      ],
    },

    // ────────────────────────────────────────────────────────
    // PT-002: Read-Heavy Load on User Courses
    // Ramps up to 40 users, simulating dashboard access.
    // ────────────────────────────────────────────────────────
    courses_read: {
      executor: 'ramping-vus',
      exec: 'apiCourses',
      startTime: '0s',
      stages: [
        { duration: '15s', target: 40 },
        { duration: '30s', target: 40 },
        { duration: '10s', target: 0 },
      ],
    },

    // ────────────────────────────────────────────────────────
    // PT-003: Registration Spike (Stress Testing Supabase inserts)
    // Sudden spike to 30 concurrent users in 2 seconds.
    // ────────────────────────────────────────────────────────
    register_spike: {
      executor: 'ramping-vus',
      exec: 'apiRegister',
      startTime: '5s', // Start a bit delayed to observe overlaps
      stages: [
        { duration: '2s', target: 30 },
        { duration: '15s', target: 30 },
        { duration: '5s', target: 0 },
      ],
    },

    // ────────────────────────────────────────────────────────
    // PT-004: Validation & Error Handling Constraints
    // Constantly hits API with bad payload to ensure fast 400 rejections.
    // ────────────────────────────────────────────────────────
    bad_requests: {
      executor: 'constant-vus',
      exec: 'apiBadReq',
      vus: 10,
      duration: '45s',
      startTime: '0s',
    },

    // ────────────────────────────────────────────────────────
    // PT-005: AI Generation Throttle (Simulated Roadmap Gen)
    // Limits the number of VUs to 5 so we don't spam the actual
    // AI provider unnecessarily, but still test response delays.
    // ────────────────────────────────────────────────────────
    ai_generation: {
      executor: 'constant-vus',
      exec: 'apiGenerateRoadmap',
      vus: 5,
      duration: '30s',
      startTime: '10s',
    }
  },
};

const BASE_URL = 'http://localhost:3000';

// Global variables for fallback tests
const TEST_USER = 'perfuser';
const TEST_PASS = 'PerfPass1';
const HEADERS = { 'Content-Type': 'application/json' };

// ─── Executors ────────────────────────────────────────────────────────────────

export function apiLogin() {
  const payload = JSON.stringify({ username: TEST_USER, password: TEST_PASS });
  const res = http.post(`${BASE_URL}/api/login`, payload, { headers: HEADERS });
  
  // Could be 200 (success) or 401 (if perfuser not created) - both test throughput
  check(res, {
    'login responded fast enough (<2s)': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}

export function apiCourses() {
  const res = http.get(`${BASE_URL}/api/user-courses?username=${TEST_USER}`);
  check(res, {
    'courses read status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function apiRegister() {
  // Use virtual user ID and timestamp to guarantee email/username uniqueness
  const ts = new Date().getTime();
  const rand = Math.floor(Math.random() * 10000);
  
  const payload = JSON.stringify({
    username: `perf_${__VU}_${ts}_${rand}`,
    email: `perf_${__VU}_${ts}_${rand}@qa.com`,
    password: 'PerfPass1!'
  });

  const res = http.post(`${BASE_URL}/api/register`, payload, { headers: HEADERS });
  check(res, {
    'registration successful (200)': (r) => r.status === 200,
    'time under 3s': (r) => r.timings.duration < 3000,
  });
  sleep(2); // Higher sleep to not absolutely bombard the DB
}

export function apiBadReq() {
  // Missing subject parameter string should be caught by route validation
  const payload = JSON.stringify({ subject: '   ' });
  const res = http.post(`${BASE_URL}/api/generate-roadmap`, payload, { headers: HEADERS });
  
  check(res, {
    'API catches bad request (400)': (r) => r.status === 400,
  });
  sleep(0.5);
}

export function apiGenerateRoadmap() {
  // A valid request to the AI generation route config
  const payload = JSON.stringify({ subject: 'Basic Mathematics' });
  
  // Set significantly higher timeout for AI generation (60 seconds)
  const res = http.post(`${BASE_URL}/api/generate-roadmap`, payload, { 
    headers: HEADERS,
    timeout: '60s'
  });
  
  check(res, {
    'roadmap generated successfully (200)': (r) => r.status === 200,
  });
  sleep(3); // Significant delay between AI requests to prevent rate limiting
}
