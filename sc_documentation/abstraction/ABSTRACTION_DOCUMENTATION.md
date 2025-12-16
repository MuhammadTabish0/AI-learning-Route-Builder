# Abstraction Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Designing Abstract Types](#designing-abstract-types)
3. [Realising ADT Concepts in TypeScript/JavaScript](#realising-adt-concepts-in-typescriptjavascript)
4. [Functions and Representation](#functions-and-representation)
5. [Invariants](#invariants)
6. [ADT Invariants Replace Preconditions](#adt-invariants-replace-preconditions)
7. [Testing and Abstract Data Types](#testing-and-abstract-data-types)
8. [Examples from This Repository](#examples-from-this-repository)
9. [Best Practices for This Project](#best-practices-for-this-project)
10. [Summary](#summary)
11. [References](#references)

---

## Overview

This document explains how **Abstraction** and **Abstract Data Types (ADTs)** principles from **MIT 6.102: Software Construction** are applied to the AI Learning Route Builder project.

The reading covers:

- **Designing Abstract Types** – how to design clean, useful abstractions.
- **Realising ADT Concepts** – how to implement ADTs in programming languages.
- **Functions and Representation** – the relationship between operations and data representation.
- **Invariants** – properties that must always be true for an ADT.
- **ADT Invariants Replace Preconditions** – how invariants simplify specifications.
- **Testing and Abstract Data Types** – how to test abstract types.

These principles help us build software that is:

- **Safe from bugs** – by encapsulating representation and enforcing invariants.
- **Easy to understand** – by providing clear, abstract interfaces.
- **Ready for change** – by hiding implementation details behind abstractions.

### What Was Added

- ✅ **Documentation** explaining ADT principles and how they apply to this TypeScript/Next.js project.
- ✅ **Guidelines** for designing and implementing abstract types.
- ✅ **Examples** showing ADT patterns in the codebase.
- ✅ **Best practices** for maintaining invariants and testing abstractions.

### No Behavior Changed

**Important:** This integration is **documentation-only**:

- No source files in `app/`, `ai/`, `lib/`, or `components/` have been modified.
- No runtime behavior, data structures, or APIs have been changed.
- Only **documentation** has been added to explain *how* abstraction should be considered.

---

## Designing Abstract Types

An **Abstract Data Type (ADT)** is defined by:

1. **Operations** – what you can do with the type.
2. **Specifications** – what each operation does (preconditions, postconditions).
3. **Representation independence** – clients don't depend on implementation details.

### Example: Course Roadmap ADT

Consider a `CourseRoadmap` as an abstract type:

```typescript
// Abstract interface - defines operations
interface CourseRoadmap {
  getCourseName(): string;
  getChapters(): ReadonlyArray<Chapter>;
  addChapter(chapter: Chapter): void;
  getChapterCount(): number;
  findChapter(title: string): Chapter | undefined;
}

// Implementation - representation is hidden
class CourseRoadmapImpl implements CourseRoadmap {
  private courseName: string;
  private chapters: Chapter[]; // Private representation
  
  constructor(courseName: string) {
    this.courseName = courseName;
    this.chapters = [];
  }
  
  getCourseName(): string {
    return this.courseName;
  }
  
  getChapters(): ReadonlyArray<Chapter> {
    return [...this.chapters]; // Return copy to preserve encapsulation
  }
  
  addChapter(chapter: Chapter): void {
    // Could enforce invariants here (e.g., no duplicate chapter numbers)
    this.chapters.push(chapter);
  }
  
  getChapterCount(): number {
    return this.chapters.length;
  }
  
  findChapter(title: string): Chapter | undefined {
    return this.chapters.find(ch => ch.title === title);
  }
}
```

**Key principles:**
- **Operations define the ADT** – clients only see the interface.
- **Representation is hidden** – `chapters` is private.
- **Invariants can be enforced** – e.g., no duplicate chapter numbers.

### In This Project

Current course data structures are more like **data transfer objects (DTOs)** than full ADTs:

```typescript
// Current: DTO (exposed representation)
export interface CourseRoadmap {
  course: string;
  chapters: ChapterRoadmap[];
}

// Could be: ADT (hidden representation)
export class CourseRoadmapADT {
  private course: string;
  private chapters: ChapterRoadmap[];
  
  // Operations with specifications
  // ...
}
```

**Trade-off:**
- DTOs are simpler and work well with JSON serialization.
- ADTs provide better encapsulation and invariant enforcement.

---

## Realising ADT Concepts in TypeScript/JavaScript

TypeScript/JavaScript don't have traditional ADT syntax (like Java interfaces), but we can achieve similar goals:

### 1. Interfaces Define Operations

```typescript
// Abstract interface
interface PromptLoader {
  loadTemplate(name: string): Promise<string>;
  replaceVariables(template: string, vars: Record<string, string>): string;
}

// Implementation
class FilePromptLoader implements PromptLoader {
  async loadTemplate(name: string): Promise<string> {
    // Implementation details hidden
  }
  
  replaceVariables(template: string, vars: Record<string, string>): string {
    // Implementation details hidden
  }
}
```

### 2. Private Fields Hide Representation

```typescript
class LLMClient {
  private apiKey: string; // Hidden representation
  private baseUrl: string; // Hidden representation
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }
  
  // Public operations
  async generateContent(prompt: string): Promise<string> {
    // Uses private fields, but clients don't see them
  }
}
```

### 3. Modules as ADTs

In TypeScript, a module can act as an ADT:

```typescript
// lib/prompt-loader.ts
// Module exports define the "operations"
export async function loadPromptTemplate(name: string): Promise<string> {
  // Implementation hidden
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  // Implementation hidden
}

// Private helper functions are not exported
function sanitizeTemplateName(name: string): string {
  // Hidden implementation detail
}
```

**In this project:**
- `lib/prompt-loader.ts` acts as an ADT module.
- `lib/llm-client.ts` acts as an ADT module.
- `ai/*Generator.ts` modules provide abstract interfaces for course generation.

---

## Functions and Representation

The reading emphasizes the relationship between:

- **Operations (functions)** – what you can do.
- **Representation** – how data is stored.

### Representation Independence

An ADT is **representation independent** if:
- Clients work with the abstract operations.
- Changing the representation doesn't break clients.

### Example: Course Storage

```typescript
// Abstract interface
interface CourseStorage {
  saveCourse(course: CourseRoadmap): Promise<void>;
  loadCourse(courseName: string): Promise<CourseRoadmap | null>;
}

// Implementation A: File-based storage
class FileCourseStorage implements CourseStorage {
  async saveCourse(course: CourseRoadmap): Promise<void> {
    // Representation: JSON files in data/courses/
    const filePath = `data/courses/${course.course}.json`;
    await writeFile(filePath, JSON.stringify(course));
  }
  
  async loadCourse(courseName: string): Promise<CourseRoadmap | null> {
    // Implementation details hidden
  }
}

// Implementation B: Database storage
class DatabaseCourseStorage implements CourseStorage {
  async saveCourse(course: CourseRoadmap): Promise<void> {
    // Representation: Supabase database
    // Different representation, same interface
  }
  
  async loadCourse(courseName: string): Promise<CourseRoadmap | null> {
    // Implementation details hidden
  }
}
```

**Clients use the interface, not the representation:**

```typescript
// Client code - representation independent
async function processCourse(courseName: string, storage: CourseStorage) {
  const course = await storage.loadCourse(courseName);
  // Works with FileCourseStorage OR DatabaseCourseStorage
}
```

**In this project:**
- `lib/supabase.ts` and `lib/supabase-server.ts` abstract database operations.
- API routes use these abstractions without depending on Supabase-specific details.

---

## Invariants

An **invariant** is a property that must always be true for an ADT:

- **Representation invariant** – always true of the internal representation.
- **Abstract invariant** – always true from the client's perspective.

### Example: Course Roadmap Invariants

```typescript
class CourseRoadmapADT {
  private course: string;
  private chapters: ChapterRoadmap[];
  
  // Representation invariant:
  // - course is non-empty
  // - chapters array is never null (but may be empty)
  // - chapter numbers are unique and sequential (1, 2, 3, ...)
  // - chapter titles are non-empty
  
  constructor(course: string) {
    if (!course || course.trim().length === 0) {
      throw new Error('Course name must be non-empty');
    }
    this.course = course;
    this.chapters = [];
  }
  
  addChapter(chapter: ChapterRoadmap): void {
    // Enforce invariant: chapter numbers must be unique
    const existing = this.chapters.find(ch => ch.chapterNumber === chapter.chapterNumber);
    if (existing) {
      throw new Error(`Chapter ${chapter.chapterNumber} already exists`);
    }
    
    // Enforce invariant: chapter numbers should be sequential
    const expectedNumber = this.chapters.length + 1;
    if (chapter.chapterNumber !== expectedNumber) {
      throw new Error(`Expected chapter number ${expectedNumber}, got ${chapter.chapterNumber}`);
    }
    
    this.chapters.push(chapter);
  }
  
  // Private method to check invariants
  private checkInvariants(): void {
    if (!this.course || this.course.trim().length === 0) {
      throw new Error('Invariant violated: course name is empty');
    }
    
    const numbers = this.chapters.map(ch => ch.chapterNumber);
    const uniqueNumbers = new Set(numbers);
    if (numbers.length !== uniqueNumbers.size) {
      throw new Error('Invariant violated: duplicate chapter numbers');
    }
  }
}
```

### In This Project

Current code uses **implicit invariants** (not explicitly checked):

```typescript
// lib/llm-client.ts - implicit invariant: API key is set
export async function callLLM(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set'); // Enforces invariant
  }
  // ...
}

// ai/roadmapGenerator.ts - implicit invariant: subject is non-empty
export async function generateRoadmap(subject: string): Promise<CourseRoadmap> {
  // Could add explicit check:
  if (!subject || subject.trim().length === 0) {
    throw new Error('Subject must be non-empty'); // Enforces invariant
  }
  // ...
}
```

---

## ADT Invariants Replace Preconditions

The reading explains that **invariants can replace preconditions**:

- If an ADT maintains an invariant, operations don't need to check it as a precondition.
- The invariant is guaranteed by the ADT's constructor and mutators.

### Example: Stack ADT

```typescript
class Stack<T> {
  private elements: T[] = [];
  
  // Invariant: elements is always an array (never null)
  // No precondition needed for push - invariant guarantees representation is valid
  
  push(item: T): void {
    // No need to check if elements is null - invariant guarantees it's an array
    this.elements.push(item);
  }
  
  pop(): T {
    // Precondition: stack is not empty
    if (this.elements.length === 0) {
      throw new Error('Cannot pop from empty stack');
    }
    return this.elements.pop()!;
  }
  
  isEmpty(): boolean {
    // No precondition - invariant guarantees elements is an array
    return this.elements.length === 0;
  }
}
```

### In This Project

Current functions have **explicit preconditions** that could be replaced by ADT invariants:

```typescript
// Current: explicit precondition
export async function loadPromptTemplate(templateName: string): Promise<string> {
  // Precondition: templateName is non-empty and corresponds to a file
  if (!templateName || templateName.trim().length === 0) {
    throw new Error('Template name must be non-empty');
  }
  // ...
}

// With ADT: invariant replaces precondition
class PromptTemplateLoader {
  private templateDir: string;
  
  // Invariant: templateDir is always a valid directory path
  constructor(templateDir: string) {
    if (!existsSync(templateDir)) {
      throw new Error('Template directory does not exist');
    }
    this.templateDir = templateDir;
  }
  
  async loadTemplate(templateName: string): Promise<string> {
    // No need to check templateDir - invariant guarantees it's valid
    // Still need precondition for templateName (not part of ADT invariant)
    if (!templateName || templateName.trim().length === 0) {
      throw new Error('Template name must be non-empty');
    }
    const filePath = join(this.templateDir, `${templateName}.txt`);
    // ...
  }
}
```

---

## Testing and Abstract Data Types

Testing ADTs focuses on:

1. **Testing operations** – do they satisfy their specifications?
2. **Testing invariants** – are invariants maintained?
3. **Testing representation independence** – do tests work with any implementation?

### Example: Testing Course Roadmap ADT

```typescript
describe('CourseRoadmapADT', () => {
  let roadmap: CourseRoadmapADT;
  
  beforeEach(() => {
    roadmap = new CourseRoadmapADT('Linear Algebra');
  });
  
  it('should maintain invariant: course name is non-empty', () => {
    expect(() => new CourseRoadmapADT('')).toThrow();
  });
  
  it('should maintain invariant: chapter numbers are unique', () => {
    roadmap.addChapter({ chapterNumber: 1, title: 'Chapter 1' });
    expect(() => {
      roadmap.addChapter({ chapterNumber: 1, title: 'Duplicate' });
    }).toThrow();
  });
  
  it('should return chapters in order', () => {
    roadmap.addChapter({ chapterNumber: 1, title: 'First' });
    roadmap.addChapter({ chapterNumber: 2, title: 'Second' });
    
    const chapters = roadmap.getChapters();
    expect(chapters[0].chapterNumber).toBe(1);
    expect(chapters[1].chapterNumber).toBe(2);
  });
  
  it('should be representation independent', () => {
    // Test works regardless of internal representation
    // (array, linked list, tree, etc.)
    const chapters = roadmap.getChapters();
    expect(Array.isArray(chapters)).toBe(true);
  });
});
```

### In This Project

Current tests focus on **function behavior** rather than ADT invariants:

```typescript
// lib/__tests__/prompt-loader.test.ts
describe('loadPromptTemplate', () => {
  it('should load template from file', async () => {
    // Tests the operation, not ADT invariants
    const template = await loadPromptTemplate('roadmap');
    expect(template).toContain('{{subject}}');
  });
});
```

**Future improvement:** If modules were refactored as ADTs, tests could verify invariants explicitly.

---

## Examples from This Repository

### Example 1: Prompt Loader Module (`lib/prompt-loader.ts`)

This module acts as an **ADT module**:

```typescript
// Abstract operations (exports)
export async function loadPromptTemplate(templateName: string): Promise<string>
export function replaceTemplateVariables(template: string, variables: Record<string, string>): string

// Hidden representation:
// - File system structure (prompts/ directory)
// - Template file format (.txt files)
// - Variable syntax ({{variableName}})
```

**Clients use the abstract interface:**

```typescript
// ai/roadmapGenerator.ts - client code
const template = await loadPromptTemplate('roadmap');
const filledTemplate = replaceTemplateVariables(template, { subject: 'Math' });
```

**Representation independence:**
- Could change from file-based to database-based storage.
- Could change template format (YAML, JSON, etc.).
- Clients wouldn't need to change.

### Example 2: LLM Client Module (`lib/llm-client.ts`)

This module abstracts LLM operations:

```typescript
// Abstract operations
export async function callLLM(prompt: string, model?: string): Promise<string>
export function parseJSONResponse<T>(response: string): T

// Hidden representation:
// - Google Generative AI SDK
// - API endpoints, authentication
// - Response parsing logic
```

**Clients use the abstraction:**

```typescript
// ai/roadmapGenerator.ts - client code
const response = await callLLM(prompt);
const roadmap = parseJSONResponse<CourseRoadmap>(response);
```

**Could switch LLM providers** without changing client code (with proper abstraction).

### Example 3: Course Data Structures

Current structures are **DTOs**, but could be **ADTs**:

```typescript
// Current: DTO (exposed representation)
export interface CourseRoadmap {
  course: string;
  chapters: ChapterRoadmap[];
}

// Potential: ADT (hidden representation)
export class CourseRoadmapADT {
  private course: string;
  private chapters: ChapterRoadmap[];
  
  // Operations with invariants
  addChapter(chapter: ChapterRoadmap): void {
    // Enforce: unique chapter numbers, sequential ordering
  }
  
  getChapters(): ReadonlyArray<ChapterRoadmap> {
    // Return copy to preserve encapsulation
  }
}
```

---

## Best Practices for This Project

### 1. Design Clear Abstractions

When creating new modules or classes:

- ✅ **DO**: Define operations (what you can do) before representation (how it's stored).
- ✅ **DO**: Hide implementation details behind interfaces or modules.
- ❌ **AVOID**: Exposing internal representation unnecessarily.

### 2. Document Invariants

When invariants exist, document them:

```typescript
/**
 * CourseRoadmap ADT
 * 
 * Invariants:
 * - course name is always non-empty
 * - chapters array is never null (but may be empty)
 * - chapter numbers are unique and sequential
 */
class CourseRoadmapADT {
  // ...
}
```

### 3. Enforce Invariants

Check invariants in constructors and mutators:

```typescript
constructor(course: string) {
  if (!course || course.trim().length === 0) {
    throw new Error('Course name must be non-empty'); // Enforce invariant
  }
  this.course = course;
}
```

### 4. Use Modules as ADTs

In TypeScript, modules can act as ADTs:

```typescript
// lib/my-module.ts
// Exports define the "operations"
export function operation1(): void { }
export function operation2(): void { }

// Private functions are hidden
function helperFunction(): void { }
```

### 5. Test Invariants

Write tests that verify invariants:

```typescript
it('should maintain invariant: course name is non-empty', () => {
  expect(() => new CourseRoadmapADT('')).toThrow();
});
```

### 6. Prefer Representation Independence

Design abstractions that allow representation changes:

```typescript
// ✅ GOOD: Interface allows different implementations
interface Storage {
  save(data: any): Promise<void>;
  load(): Promise<any>;
}

// ❌ BAD: Tied to specific representation
function saveToFile(data: any): void {
  // Hard to change to database later
}
```

---

## Summary

In this project:

- **Abstraction principles** are applied by:
  - Using modules as ADTs (`lib/prompt-loader.ts`, `lib/llm-client.ts`).
  - Hiding implementation details behind exported functions.
  - Documenting implicit invariants in function specifications.

- **ADT concepts** appear in:
  - Module boundaries (exports define operations).
  - Type definitions (interfaces define abstract structure).
  - Data structures (could be extended to full ADTs with invariants).

- **Invariants** are:
  - Enforced through runtime checks (e.g., non-empty strings).
  - Documented in function specifications.
  - Could be made more explicit with ADT classes.

- The codebase follows these principles to remain:
  - **Safe from bugs** – invariants prevent invalid states.
  - **Easy to understand** – clear abstractions hide complexity.
  - **Ready for change** – representation independence allows implementation changes.

All of this is documented here without modifying any existing behavior, consistent with your assignment requirements.

---

## References

- **MIT 6.102 – Reading on Abstraction and ADTs**  
  Principles of abstract data types, invariants, and representation independence.

- **Related Readings in This Repo**  
  - Specifications: `sc_documentation/specifications/SPECIFICATIONS_DOCUMENTATION.md`  
  - Testing: `sc_documentation/testing/TESTING_DOCUMENTATION.md`  
  - Mutability: `sc_documentation/mutability/MUTABILITY_DOCUMENTATION.md`

- **TypeScript/JavaScript Abstraction**  
  - [TypeScript: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
  - [TypeScript: Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
  - [Encapsulation in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects#defining_getters_and_setters)

- **ADT Design**  
  - [Abstract Data Types](https://en.wikipedia.org/wiki/Abstract_data_type)
  - [Representation Independence](https://web.mit.edu/6.102/www/sp25/classes/)

These resources together show how **Abstraction** principles from MIT 6.102 are applied within the AI Learning Route Builder project.

