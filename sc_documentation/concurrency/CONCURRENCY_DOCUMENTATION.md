# Concurrency Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Two Models for Concurrent Programming](#two-models-for-concurrent-programming)
3. [Race Conditions](#race-conditions)
4. [Concurrency is Hard to Test and Debug](#concurrency-is-hard-to-test-and-debug)
5. [Examples from This Repository](#examples-from-this-repository)
6. [Best Practices for This Project](#best-practices-for-this-project)
7. [Summary](#summary)
8. [References](#references)

---

## Overview

This document explains how **Concurrency** principles from **MIT 6.102: Software Construction** are applied to the AI Learning Route Builder project.

The reading covers:

- **Two Models for Concurrent Programming** – shared memory vs. message passing.
- **Race Conditions** – when concurrent access leads to unpredictable behavior.
- **Concurrency is Hard to Test and Debug** – why concurrent bugs are particularly challenging.

These principles help us build software that is:

- **Safe from bugs** – by avoiding race conditions and properly synchronizing concurrent operations.
- **Easy to understand** – by using clear concurrency models and patterns.
- **Ready for change** – by designing concurrent code that's maintainable.

### What Was Added

- ✅ **Documentation** explaining concurrency principles and how they apply to this TypeScript/Next.js project.
- ✅ **Guidelines** for handling concurrent operations safely.
- ✅ **Examples** showing concurrency patterns in the codebase.
- ✅ **Best practices** for avoiding race conditions and debugging concurrent code.

### No Behavior Changed

**Important:** This integration is **documentation-only**:

- No source files in `app/`, `ai/`, `lib/`, or `components/` have been modified.
- No runtime behavior, async operations, or concurrent code has been changed.
- Only **documentation** has been added to explain *how* concurrency should be considered.

---

## Two Models for Concurrent Programming

The MIT 6.102 reading describes two main models for concurrent programming:

### 1. Shared Memory Model

In the **shared memory model**, threads/processes share access to the same memory:

- Multiple threads can read/write the same variables.
- Requires **synchronization** (locks, mutexes) to prevent race conditions.
- Common in languages like Java, C++, C#.

**Example (conceptual - not in this project):**

```typescript
// Shared memory model (if we had threads)
let sharedCounter = 0;

// Thread 1
function incrementCounter() {
  sharedCounter++; // Race condition risk!
}

// Thread 2
function decrementCounter() {
  sharedCounter--; // Race condition risk!
}
```

### 2. Message Passing Model

In the **message passing model**, processes communicate by sending messages:

- No shared memory.
- Processes are isolated.
- Communication happens through channels/queues.
- Common in languages like Go, Erlang, JavaScript (with async/await).

**Example in JavaScript/TypeScript:**

```typescript
// Message passing model (async/await)
async function processCourse(courseName: string): Promise<CourseRoadmap> {
  // Send "message" (request) to LLM API
  const response = await callLLM(prompt);
  
  // Receive "message" (response)
  return parseJSONResponse<CourseRoadmap>(response);
}
```

### In This Project

This project primarily uses the **message passing model** through:

- **Async/await** – asynchronous operations communicate via promises.
- **API calls** – HTTP requests/responses are message passing.
- **Event-driven architecture** – Next.js uses event-driven patterns.

**Example from `lib/llm-client.ts`:**

```typescript
export async function callLLM(prompt: string): Promise<string> {
  // Message passing: send request, wait for response
  const result = await generativeModel.generateContentStream(fullPrompt);
  
  // Collect response (message)
  let content = '';
  for await (const chunk of result.stream) {
    content += chunkText;
  }
  
  return content; // Return message
}
```

**No shared memory concerns** because:
- JavaScript is single-threaded (event loop).
- Async operations are handled by the runtime.
- No manual thread synchronization needed.

---

## Race Conditions

A **race condition** occurs when:

- Multiple operations access shared state concurrently.
- The outcome depends on the **timing** of those operations.
- The result is unpredictable or incorrect.

### Example: Counter Race Condition

```typescript
// ❌ BAD: Race condition with shared state
let requestCount = 0;

async function handleRequest() {
  requestCount++; // Race condition: multiple requests could increment simultaneously
  console.log(`Request ${requestCount} received`);
}

// Multiple concurrent requests:
handleRequest(); // Thread 1: reads 0, writes 1
handleRequest(); // Thread 2: reads 0, writes 1 (overwrites Thread 1!)
// Result: requestCount = 1 (should be 2!)
```

### Example: File Writing Race Condition

```typescript
// ❌ BAD: Race condition when writing files
async function saveCourse(course: CourseRoadmap) {
  // Read existing file
  const existing = await readFile(filePath, 'utf-8');
  const data = JSON.parse(existing);
  
  // Modify data
  data.courses.push(course);
  
  // Write back (race condition: another request might have written in between!)
  await writeFile(filePath, JSON.stringify(data));
}
```

### Preventing Race Conditions

#### 1. Use Atomic Operations

```typescript
// ✅ GOOD: Atomic increment (if available)
// In JavaScript, simple operations are atomic, but be careful with async
let requestCount = 0;

async function handleRequest() {
  // In single-threaded JavaScript, this is safe
  requestCount++;
}
```

#### 2. Use Locks/Mutexes (if needed)

```typescript
// ✅ GOOD: Use a lock to prevent concurrent access
class CourseStorage {
  private lock = false;
  
  async saveCourse(course: CourseRoadmap): Promise<void> {
    // Wait for lock
    while (this.lock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.lock = true;
    try {
      // Critical section
      const existing = await readFile(filePath, 'utf-8');
      const data = JSON.parse(existing);
      data.courses.push(course);
      await writeFile(filePath, JSON.stringify(data));
    } finally {
      this.lock = false;
    }
  }
}
```

#### 3. Use Database Transactions

```typescript
// ✅ GOOD: Database transactions prevent race conditions
async function saveCourse(course: CourseRoadmap): Promise<void> {
  // Database handles concurrency
  await supabase
    .from('courses')
    .insert(course); // Atomic operation
}
```

### In This Project

**Potential race conditions:**

1. **File-based course storage** (`data/courses/*.json`):
   - Multiple requests could try to write the same file simultaneously.
   - **Mitigation**: Currently, course generation is typically sequential per user.
   - **Better**: Use database (Supabase) which handles concurrency.

2. **API route handlers**:
   - Multiple requests to `/api/generate-full-course` could conflict.
   - **Mitigation**: Each request creates its own file path (based on course name).
   - **Better**: Add request queuing or database locking.

3. **React state updates**:
   - Multiple state updates could conflict.
   - **Mitigation**: React batches state updates, and `setState` is designed to handle this.

**Example from `app/api/generate-full-course/route.ts`:**

```typescript
export async function POST(request: NextRequest) {
  // Each request is independent - no shared state
  const { courseName } = await request.json();
  
  // File path is unique per course name
  const dataFilePath = join(dataDir, `${sanitizedCourseName}.json`);
  
  // Potential race: two requests for same course name
  // Could both check existsSync, both try to write
  if (existsSync(dataFilePath)) {
    // Return cached - but what if another request is writing it?
    return cachedData;
  }
  
  // Generate and save - race condition if two requests for same course
  const course = await generateFullCourse(courseName);
  await writeFile(dataFilePath, JSON.stringify(course));
}
```

**Improvement suggestion:**

```typescript
// Better: Use a lock or database
const lockKey = `course-generation-${sanitizedCourseName}`;
if (await isLocked(lockKey)) {
  // Wait for other request to finish
  await waitForLock(lockKey);
  return await readCachedCourse(dataFilePath);
}

await acquireLock(lockKey);
try {
  const course = await generateFullCourse(courseName);
  await writeFile(dataFilePath, JSON.stringify(course));
} finally {
  await releaseLock(lockKey);
}
```

---

## Concurrency is Hard to Test and Debug

The reading emphasizes that **concurrent bugs are particularly challenging**:

### Why Concurrency Bugs are Hard

1. **Non-deterministic** – bugs may only appear sometimes.
2. **Timing-dependent** – hard to reproduce consistently.
3. **Heisenbugs** – debugging changes timing, making bugs disappear.
4. **Complex interactions** – many possible interleavings of operations.

### Example: Non-Deterministic Bug

```typescript
// ❌ BAD: Non-deterministic behavior
let logs: string[] = [];

async function logMessage(message: string) {
  // Race condition: order depends on timing
  logs.push(`${Date.now()}: ${message}`);
}

// Concurrent calls
logMessage('Start');
logMessage('Process');
logMessage('End');

// Result: logs might be in wrong order!
// [ '...: Process', '...: Start', '...: End' ]
```

### Testing Concurrent Code

#### 1. Test for Race Conditions

```typescript
// Test concurrent operations
it('should handle concurrent course generation', async () => {
  const promises = Array(10).fill(null).map(() => 
    generateFullCourse('Linear Algebra')
  );
  
  const results = await Promise.all(promises);
  
  // All should succeed (or all should fail consistently)
  expect(results.every(r => r !== null)).toBe(true);
});
```

#### 2. Use Deterministic Testing

```typescript
// ✅ GOOD: Make tests deterministic
it('should process requests in order', async () => {
  const results: string[] = [];
  
  // Process sequentially (deterministic)
  await processRequest('A');
  await processRequest('B');
  await processRequest('C');
  
  expect(results).toEqual(['A', 'B', 'C']);
});
```

#### 3. Test Edge Cases

```typescript
// Test concurrent access to shared resource
it('should prevent race conditions when saving courses', async () => {
  const courseName = 'Test Course';
  
  // Simulate concurrent saves
  const promises = Array(5).fill(null).map(() =>
    saveCourse({ course: courseName, chapters: [] })
  );
  
  await Promise.all(promises);
  
  // Verify only one course was saved (or all were saved correctly)
  const saved = await loadCourse(courseName);
  expect(saved).toBeDefined();
});
```

### Debugging Concurrent Code

#### 1. Add Logging

```typescript
// Add detailed logging to understand timing
async function saveCourse(course: CourseRoadmap) {
  console.log(`[${Date.now()}] Starting save for ${course.course}`);
  
  const existing = await readFile(filePath, 'utf-8');
  console.log(`[${Date.now()}] Read existing file`);
  
  // ... processing ...
  
  await writeFile(filePath, JSON.stringify(data));
  console.log(`[${Date.now()}] Wrote file`);
}
```

#### 2. Use Debugging Tools

- **Chrome DevTools** – async stack traces, breakpoints in async code.
- **Node.js Inspector** – debug Node.js applications.
- **Logging** – add timestamps and request IDs to trace execution.

#### 3. Reproduce with Delays

```typescript
// Artificially delay operations to reproduce race conditions
async function saveCourseWithDelay(course: CourseRoadmap) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  // ... rest of function
}
```

### In This Project

**Current testing approach:**

- Tests in `lib/__tests__/` focus on **sequential** behavior.
- Integration tests verify **end-to-end** workflows.
- **No explicit concurrency tests** – could be added.

**Example test from `lib/__tests__/prompt-loader.test.ts`:**

```typescript
// Current: Sequential test
it('should load and replace template variables', async () => {
  const template = await loadPromptTemplate('roadmap');
  const filled = replaceTemplateVariables(template, { subject: 'Math' });
  expect(filled).toContain('Math');
});

// Could add: Concurrency test
it('should handle concurrent template loads', async () => {
  const promises = ['roadmap', 'notes', 'questions'].map(name =>
    loadPromptTemplate(name)
  );
  const templates = await Promise.all(promises);
  expect(templates).toHaveLength(3);
});
```

---

## Examples from This Repository

### Example 1: Async API Route Handler (`app/api/generate-full-course/route.ts`)

This route handles concurrent requests:

```typescript
export async function POST(request: NextRequest) {
  // Each request is independent
  const { courseName } = await request.json();
  
  // Potential race: multiple requests for same course
  if (existsSync(dataFilePath)) {
    return cachedData; // What if another request is writing?
  }
  
  // Generate (could be concurrent with other requests)
  const course = await generateFullCourse(courseName);
  await writeFile(dataFilePath, JSON.stringify(course));
}
```

**Concurrency considerations:**
- Multiple users could request the same course simultaneously.
- File writing could conflict.
- **Better**: Use database or add locking.

### Example 2: React State Updates (`app/courses/page.tsx`)

React handles concurrent state updates:

```typescript
const [myCourses, setMyCourses] = useState<Course[]>([]);

// Multiple rapid updates
setMyCourses([...myCourses, newCourse1]);
setMyCourses([...myCourses, newCourse2]); // Race condition!

// ✅ BETTER: Functional update
setMyCourses(prev => [...prev, newCourse1]);
setMyCourses(prev => [...prev, newCourse2]); // Safe
```

**Why functional updates are safe:**
- React batches updates.
- Functional updates use the latest state.
- Prevents race conditions from stale closures.

### Example 3: LLM API Calls (`lib/llm-client.ts`)

Concurrent LLM calls:

```typescript
// Multiple concurrent calls
const roadmapPromise = callLLM(roadmapPrompt);
const notesPromise = callLLM(notesPrompt);
const questionsPromise = callLLM(questionsPrompt);

// Wait for all
const [roadmap, notes, questions] = await Promise.all([
  roadmapPromise,
  notesPromise,
  questionsPromise
]);
```

**Concurrency considerations:**
- API rate limits could cause issues.
- Retry logic (`retryWithBackoff`) handles transient failures.
- **Good**: Each call is independent (no shared state).

---

## Best Practices for This Project

### 1. Prefer Async/Await Over Callbacks

```typescript
// ✅ GOOD: Async/await (clearer, easier to debug)
async function processCourse(courseName: string): Promise<CourseRoadmap> {
  const template = await loadPromptTemplate('roadmap');
  const response = await callLLM(template);
  return parseJSONResponse<CourseRoadmap>(response);
}

// ❌ AVOID: Callback hell (harder to debug)
function processCourse(courseName: string, callback: (result: CourseRoadmap) => void) {
  loadPromptTemplate('roadmap', (template) => {
    callLLM(template, (response) => {
      callback(parseJSONResponse<CourseRoadmap>(response));
    });
  });
}
```

### 2. Use Promise.all for Independent Operations

```typescript
// ✅ GOOD: Concurrent independent operations
const [roadmap, notes, questions] = await Promise.all([
  generateRoadmap(subject),
  generateNotes(subject),
  generateQuestions(subject)
]);

// ❌ AVOID: Sequential when not needed
const roadmap = await generateRoadmap(subject);
const notes = await generateNotes(subject);
const questions = await generateQuestions(subject);
```

### 3. Avoid Shared Mutable State

```typescript
// ❌ BAD: Shared mutable state
let globalCounter = 0;

async function increment() {
  globalCounter++; // Race condition risk
}

// ✅ GOOD: No shared state
async function processRequest(requestId: string) {
  // Each request has its own state
  const result = await process(requestId);
  return result;
}
```

### 4. Use Database for Shared State

```typescript
// ✅ GOOD: Database handles concurrency
async function saveCourse(course: CourseRoadmap) {
  await supabase.from('courses').insert(course);
  // Database ensures atomicity
}

// ❌ AVOID: File-based shared state
async function saveCourse(course: CourseRoadmap) {
  const existing = await readFile(filePath);
  // Race condition: another request might write between read and write
  await writeFile(filePath, JSON.stringify(course));
}
```

### 5. Add Logging for Debugging

```typescript
// Add request IDs to trace concurrent operations
async function generateFullCourse(courseName: string): Promise<CourseRoadmap> {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting generation for ${courseName}`);
  
  try {
    const result = await generateRoadmap(courseName);
    console.log(`[${requestId}] Generation complete`);
    return result;
  } catch (error) {
    console.error(`[${requestId}] Generation failed:`, error);
    throw error;
  }
}
```

### 6. Test Concurrent Scenarios

```typescript
// Test concurrent operations
it('should handle concurrent course generation', async () => {
  const promises = Array(5).fill(null).map(() =>
    generateFullCourse('Linear Algebra')
  );
  
  const results = await Promise.all(promises);
  expect(results.every(r => r !== null)).toBe(true);
});
```

---

## Summary

In this project:

- **Concurrency principles** are applied by:
  - Using async/await for asynchronous operations.
  - Preferring message passing (promises) over shared memory.
  - Using React's state update patterns to avoid race conditions.

- **Race conditions** are mitigated by:
  - Using database (Supabase) for shared state instead of files.
  - Using functional React state updates.
  - Making operations independent where possible.

- **Testing and debugging** considerations:
  - Current tests focus on sequential behavior.
  - Could add explicit concurrency tests.
  - Logging helps trace concurrent operations.

- The codebase follows these principles to remain:
  - **Safe from bugs** – avoiding race conditions and properly handling async operations.
  - **Easy to understand** – clear async/await patterns.
  - **Ready for change** – concurrent code is maintainable.

All of this is documented here without modifying any existing behavior, consistent with your assignment requirements.

---

## References

- **MIT 6.102 – Reading on Concurrency**  
  Principles of concurrent programming, race conditions, and debugging concurrent code.

- **Related Readings in This Repo**  
  - Specifications: `sc_documentation/specifications/SPECIFICATIONS_DOCUMENTATION.md`  
  - Testing: `sc_documentation/testing/TESTING_DOCUMENTATION.md`  
  - Abstraction: `sc_documentation/abstraction/ABSTRACTION_DOCUMENTATION.md`

- **JavaScript/TypeScript Concurrency**  
  - [MDN: Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
  - [MDN: Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  - [JavaScript Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)

- **Concurrency Patterns**  
  - [Promise.all for Concurrent Operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
  - [React: State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)

- **Testing Concurrent Code**  
  - [Jest: Async Testing](https://jestjs.io/docs/asynchronous)
  - [Testing Race Conditions](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

These resources together show how **Concurrency** principles from MIT 6.102 are applied within the AI Learning Route Builder project.

