# SwiftEd — k6 Performance Test Suite 🚀

This document outlines the configured Performance Test Cases created for the SwiftEd AI Learning Route Builder utilizing [k6](https://k6.io/).

A consolidated script (`k6-suite.js`) handles these configurations and executes multiple scenarios running concurrently.

---

## 📊 K6 Performance Scenarios

| Scenario ID | Name | Type | Target Endpoints | Virtual Users (VUs) | Ramp-up / Duration | Pass Criteria |
|-------------|------|------|------------------|---------------------|-------------------|---------------|
| `login_load` | **Baseline Load (Login)** | Load | `POST /api/login` | 20 | 10s ramp, 30s flat, 10s ramp down | `p(95) < 2500ms` |
| `courses_read` | **Dashboard Read Heavy** | Load | `GET /api/user-courses` | 40 | 15s ramp, 30s flat, 10s down | HTTP 200, low latency |
| `register_spike` | **Registration Spike** | Spike/Stress | `POST /api/register` | 30 | Sudden 2s spike, 15s hold | Supabase insertions pass |
| `bad_requests` | **API Constraint Guard** | Soak | `POST /api/generate-roadmap` | 10 | Constant for 45s | Fails gracefully w/ `HTTP 400` |
| `ai_generation` | **AI Endpoint Throttle** | Stress | `POST /api/generate-roadmap` | 5 | Constant for 30s | Returns complete roadmap |


### Thresholds
All tests are governed by global test thresholds defined at the top of the suite:
1. `http_req_duration`: **95% of all requests** across all scenarios must complete in under 2.5 seconds (2500ms).
2. `http_req_failed`: The global error rate across all endpoints must be strictly **below 5%**.

---

## 🛠️ How to Run the Tests

### 1. Install k6
* **Windows**: `winget install k6` or `choco install k6`
* **Mac**: `brew install k6`
* **Linux**: Follow official [apt/yum instructions](https://k6.io/docs/get-started/installation/).

### 2. Run the Full Suite (All 5 Scenarios Concurrently)
Ensure your local Next.js server (`npm run dev`) is running, then execute:
```bash
k6 run performance/k6-suite.js
```

### 3. Run a Specific Scenario Isolated
If you only want to test the **Login Load** without triggering Supabase inserts or AI generations:
```bash
k6 run -e K6_SCENARIO=login_load performance/k6-suite.js
```

### 4. Output Example
At the end of the test, `k6` will output an ASCII table indicating response times, the number of successfully completed checks, data received, and whether the thresholds passed (`✓`) or failed (`✗`).
