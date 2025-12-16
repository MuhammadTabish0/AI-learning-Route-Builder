# Mutability Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Risks of Mutation](#risks-of-mutation)
3. [Mutations and Contracts](#mutations-and-contracts)
4. [Immutability in TypeScript](#immutability-in-typescript)
5. [Examples from This Repository](#examples-from-this-repository)
6. [Best Practices for This Project](#best-practices-for-this-project)
7. [Summary](#summary)
8. [References](#references)

---

## Overview

This document explains how **Mutability** principles from **MIT 6.102: Software Construction** are applied to the AI Learning Route Builder project.

The reading emphasizes understanding:

- **Risks of Mutation** – how mutable state can lead to bugs that are hard to find and fix.
- **Mutations and Contracts** – how mutability affects specifications and behavioral equivalence.

These principles help us build software that is:

- **Safe from bugs** – by minimizing mutable state and making mutations explicit.
- **Easy to understand** – by preferring immutable data structures where possible.
- **Ready for change** – by reducing hidden dependencies on mutable state.

### What Was Added

- ✅ **Documentation** explaining mutability risks and how they apply to this TypeScript/Next.js project.
- ✅ **Guidelines** for when to use mutable vs. immutable patterns.
- ✅ **Examples** from the codebase showing how mutability is handled.
- ✅ **Best practices** for avoiding mutation-related bugs.

### No Behavior Changed

**Important:** This integration is **documentation-only**:

- No source files in `app/`, `ai/`, `lib/`, or `components/` have been modified.
- No runtime behavior, API contracts, or state management has been changed.
- Only **documentation** has been added to explain *how* mutability should be considered.

---

## Risks of Mutation

The MIT 6.102 reading highlights several risks associated with mutable state:

### 1. Aliasing Bugs

When multiple references point to the same mutable object, changes through one reference affect all others:

```typescript
// RISKY: Mutable object shared by reference
const courseData = { title: "Linear Algebra", chapters: [] };
const copy1 = courseData;
const copy2 = courseData;

copy1.chapters.push("Chapter 1"); // Mutates the shared object
console.log(copy2.chapters); // ["Chapter 1"] - unexpected!
```

**In this project:**
- AI generator functions (`ai/*.ts`) return **new objects** rather than mutating inputs.
- API route handlers create fresh response objects.
- React state updates use immutable patterns (e.g., `setState(newValue)` rather than mutating existing state).

### 2. Hidden Dependencies

Mutable state can create hidden dependencies between distant parts of the code:

```typescript
// RISKY: Function with hidden side effects
function processCourse(course: Course) {
  course.lastModified = new Date(); // Mutates input - caller might not expect this!
  return course.title;
}
```

**In this project:**
- Functions in `lib/prompt-loader.ts` and `lib/llm-client.ts` are **pure** where possible:
  - They take inputs and return outputs without mutating arguments.
  - Side effects (like file I/O or API calls) are explicit and documented.

### 3. Breaking Behavioral Equivalence

Two implementations that should be behaviorally equivalent can differ if one mutates shared state:

```typescript
// Implementation A: Mutates input
function addChapter(course: Course, chapter: string) {
  course.chapters.push(chapter);
  return course;
}

// Implementation B: Returns new object
function addChapter(course: Course, chapter: string) {
  return { ...course, chapters: [...course.chapters, chapter] };
}
```

These are **not behaviorally equivalent** if the original `course` object is used elsewhere.

**In this project:**
- Specifications (see `SPECIFICATIONS_DOCUMENTATION.md`) document whether functions mutate inputs.
- Tests verify that functions don't have unexpected side effects.

---

## Mutations and Contracts

The reading explains how mutability affects **specifications** and **contracts**:

### Preconditions and Postconditions with Mutation

When a function mutates its arguments, the specification must explicitly state this:

```typescript
/**
 * Adds a chapter to a course roadmap.
 *
 * Requires:
 * - `roadmap` is a valid CourseRoadmap object
 * - `chapterTitle` is a non-empty string
 *
 * Effects:
 * - Mutates `roadmap.chapters` by appending a new chapter
 * - Returns the modified `roadmap` object (same reference)
 *
 * ⚠️ WARNING: This function mutates the input object.
 */
function addChapterMutable(roadmap: CourseRoadmap, chapterTitle: string): CourseRoadmap {
  roadmap.chapters.push({ chapterNumber: roadmap.chapters.length + 1, title: chapterTitle });
  return roadmap;
}
```

**Better approach (immutable):**

```typescript
/**
 * Creates a new course roadmap with an additional chapter.
 *
 * Requires:
 * - `roadmap` is a valid CourseRoadmap object
 * - `chapterTitle` is a non-empty string
 *
 * Effects:
 * - Returns a NEW CourseRoadmap object with the additional chapter
 * - Does NOT mutate the input `roadmap`
 */
function addChapterImmutable(roadmap: CourseRoadmap, chapterTitle: string): CourseRoadmap {
  return {
    ...roadmap,
    chapters: [
      ...roadmap.chapters,
      { chapterNumber: roadmap.chapters.length + 1, title: chapterTitle }
    ]
  };
}
```

### Behavioral Equivalence and Mutation

Two implementations are **behaviorally equivalent** only if:
- They produce the same outputs for the same inputs, AND
- They have the same side effects (including mutations).

**In this project:**
- Functions in `ai/*Generator.ts` return new objects, making them easier to reason about.
- React components use immutable state updates to avoid rendering bugs.

---

## Immutability in TypeScript

TypeScript provides several mechanisms to work with immutable data:

### 1. Spread Operator for Shallow Copies

```typescript
// Create a new object with some properties changed
const updatedCourse = {
  ...originalCourse,
  title: "New Title"
};
```

### 2. Array Methods That Return New Arrays

```typescript
// map, filter, reduce return new arrays
const newChapters = chapters.map(ch => ({ ...ch, updated: true }));

// Avoid: push, pop, splice mutate the original array
```

### 3. Readonly Types

TypeScript's `readonly` modifier helps prevent accidental mutations:

```typescript
interface ReadonlyCourse {
  readonly title: string;
  readonly chapters: readonly Chapter[];
}

// TypeScript will error if you try to mutate
function processCourse(course: ReadonlyCourse) {
  // course.title = "New"; // ❌ Error: Cannot assign to 'title' because it is a read-only property
}
```

### 4. Deep Immutability Libraries

For complex nested structures, libraries like `immer` can help:

```typescript
import produce from 'immer';

const newState = produce(oldState, draft => {
  draft.chapters.push(newChapter); // Looks like mutation, but creates new object
});
```

**In this project:**
- We use TypeScript's built-in immutability patterns (spread, readonly).
- For complex state management, React's state update patterns are used.

---

## Examples from This Repository

### Example 1: AI Generator Functions (`ai/roadmapGenerator.ts`)

The `generateRoadmap` function returns a **new object** rather than mutating inputs:

```typescript
export async function generateRoadmap(subject: string): Promise<CourseRoadmap> {
  // ... generation logic ...
  
  // Returns a NEW CourseRoadmap object
  return {
    course: subject,
    chapters: generatedChapters // New array
  };
}
```

**Why this matters:**
- Callers can safely reuse the input `subject` string.
- Multiple calls don't interfere with each other.
- The function is easier to test and reason about.

### Example 2: React State Updates (`app/courses/page.tsx`)

React components use immutable state updates:

```typescript
const [myCourses, setMyCourses] = useState<Course[]>([]);

// ✅ CORRECT: Create new array
setMyCourses([...myCourses, newCourse]);

// ❌ WRONG: Mutate existing array
// myCourses.push(newCourse); // React won't detect this change!
```

**Why this matters:**
- React's rendering depends on reference equality.
- Mutating state directly can cause components not to re-render.
- Immutable updates make state changes explicit and traceable.

### Example 3: API Route Handlers (`app/api/generate-full-course/route.ts`)

API handlers create new response objects:

```typescript
export async function POST(request: NextRequest) {
  // ... processing ...
  
  // Returns a NEW response object
  return NextResponse.json({
    type: 'complete',
    data: course // New object, not mutated from input
  });
}
```

**Why this matters:**
- Request objects should not be mutated.
- Response objects are independent of request state.
- Makes the API easier to test and debug.

---

## Best Practices for This Project

### 1. Prefer Immutable Returns

When designing new functions:

- ✅ **DO**: Return new objects/arrays rather than mutating inputs.
- ❌ **AVOID**: Mutating function arguments unless explicitly documented.

### 2. Document Mutations Explicitly

If a function must mutate state, document it clearly:

```typescript
/**
 * ⚠️ MUTATES: This function modifies the `course` object in place.
 * 
 * Requires:
 * - `course` is a valid Course object
 * 
 * Effects:
 * - Mutates `course.metadata.lastUpdated`
 * - Returns the same `course` object (by reference)
 */
function updateTimestamp(course: Course): Course {
  course.metadata.lastUpdated = new Date();
  return course;
}
```

### 3. Use Readonly Types for Shared Data

When passing data that shouldn't be mutated:

```typescript
function processReadonlyCourse(course: Readonly<CourseRoadmap>): CourseRoadmap {
  // TypeScript prevents accidental mutations
  return { ...course, /* modifications */ };
}
```

### 4. Test for Immutability

Write tests that verify functions don't mutate inputs:

```typescript
it('should not mutate input roadmap', () => {
  const original = { course: "Math", chapters: [] };
  const copy = JSON.parse(JSON.stringify(original)); // Deep copy
  
  generateRoadmap("Math");
  
  expect(original).toEqual(copy); // Should be unchanged
});
```

### 5. React State Management

- Always use `setState` with new values, not mutations.
- Use functional updates for state that depends on previous state:

```typescript
// ✅ CORRECT
setCount(prev => prev + 1);

// ❌ WRONG
count++; // Mutates, React won't detect
```

---

## Summary

In this project:

- **Mutability risks** are mitigated by:
  - Preferring immutable return values in AI generators and utility functions.
  - Using React's immutable state update patterns.
  - Documenting any necessary mutations explicitly.

- **Mutations and contracts** are handled by:
  - Including mutation behavior in function specifications.
  - Testing that functions don't have unexpected side effects.
  - Using TypeScript's type system to prevent accidental mutations where possible.

- The codebase follows these principles to remain:
  - **Safe from bugs** – fewer aliasing and hidden dependency issues.
  - **Easy to understand** – explicit data flow without hidden mutations.
  - **Ready for change** – immutable patterns make refactoring safer.

All of this is documented here without modifying any existing behavior, consistent with your assignment requirements.

---

## References

- **MIT 6.102 – Reading on Mutability**  
  Principles of mutability, immutability, and their impact on software design.

- **Related Readings in This Repo**  
  - Specifications: `sc_documentation/specifications/SPECIFICATIONS_DOCUMENTATION.md`  
  - Testing: `sc_documentation/testing/TESTING_DOCUMENTATION.md`  
  - Code Review: `sc_documentation/code_review/CODE_REVIEW_DOCUMENTATION.md`

- **TypeScript Immutability**  
  - [TypeScript Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
  - [Readonly Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)

- **React State Updates**  
  - [React: State Updates](https://react.dev/learn/updating-objects-in-state)
  - [React: Immutability](https://react.dev/learn/updating-arrays-in-state)

These resources together show how **Mutability** principles from MIT 6.102 are applied within the AI Learning Route Builder project.

