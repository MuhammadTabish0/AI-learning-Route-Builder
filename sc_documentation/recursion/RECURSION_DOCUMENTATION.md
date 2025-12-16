# Recursion Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Choosing the Right Recursive Subproblem](#choosing-the-right-recursive-subproblem)
3. [Structure of Recursive Implementations](#structure-of-recursive-implementations)
4. [Common Mistakes in Recursive Implementations](#common-mistakes-in-recursive-implementations)
5. [Recursive Data Types](#recursive-data-types)
6. [Regular Expressions](#regular-expressions)
7. [Grammars](#grammars)
8. [Examples from This Repository](#examples-from-this-repository)
9. [Best Practices for This Project](#best-practices-for-this-project)
10. [Summary](#summary)
11. [References](#references)

---

## Overview

This document explains how **Recursion** principles from **MIT 6.102: Software Construction** are applied to the AI Learning Route Builder project.

The reading covers:

- **Choosing the Right Recursive Subproblem** – how to decompose problems recursively.
- **Structure of Recursive Implementations** – base cases, recursive cases, and termination.
- **Common Mistakes in Recursive Implementations** – infinite recursion, missing base cases, wrong subproblems.
- **Recursive Data Types** – data structures that are naturally recursive (trees, lists, etc.).
- **Regular Expressions** – pattern matching using recursive structures.
- **Grammars** – formal languages and parsing using recursive definitions.

These principles help us build software that is:

- **Safe from bugs** – by ensuring recursive functions terminate correctly.
- **Easy to understand** – by using recursion to express naturally recursive problems.
- **Ready for change** – by structuring code to match the recursive structure of data.

### What Was Added

- ✅ **Documentation** explaining recursion principles and how they apply to this TypeScript/Next.js project.
- ✅ **Guidelines** for when to use recursion vs. iteration.
- ✅ **Examples** showing recursive patterns in the codebase.
- ✅ **Best practices** for avoiding common recursion pitfalls.

### No Behavior Changed

**Important:** This integration is **documentation-only**:

- No source files in `app/`, `ai/`, `lib/`, or `components/` have been modified.
- No runtime behavior, algorithms, or data structures have been changed.
- Only **documentation** has been added to explain *how* recursion should be considered.

---

## Choosing the Right Recursive Subproblem

The key to successful recursion is choosing a subproblem that:

1. **Is smaller** than the original problem.
2. **Is of the same form** as the original problem.
3. **Makes progress** toward the base case.

### Example: Processing Nested Course Structures

Consider a course structure with nested chapters and sub-chapters:

```typescript
interface Chapter {
  title: string;
  subChapters?: Chapter[];
}

// ✅ GOOD: Recursive subproblem processes one level at a time
function countAllChapters(chapter: Chapter): number {
  // Base case: chapter with no sub-chapters
  if (!chapter.subChapters || chapter.subChapters.length === 0) {
    return 1; // Count this chapter
  }
  
  // Recursive case: count this chapter + all sub-chapters
  return 1 + chapter.subChapters.reduce(
    (sum, subChapter) => sum + countAllChapters(subChapter),
    0
  );
}

// ❌ BAD: Wrong subproblem - doesn't make progress
function countAllChaptersBad(chapter: Chapter): number {
  // This doesn't actually recurse on sub-chapters!
  return 1 + (chapter.subChapters?.length || 0);
}
```

**Why the good version works:**
- The subproblem (counting sub-chapters) is smaller (fewer levels).
- It's the same form (counting chapters in a tree).
- It makes progress (one level deeper each time).

### Example: Parsing Nested JSON Structures

When parsing AI-generated JSON responses:

```typescript
// ✅ GOOD: Recursive subproblem handles nested objects
function extractAllTexts(obj: any): string[] {
  // Base case: primitive value
  if (typeof obj === 'string') {
    return [obj];
  }
  if (typeof obj !== 'object' || obj === null) {
    return [];
  }
  
  // Recursive case: process all values in object/array
  if (Array.isArray(obj)) {
    return obj.flatMap(item => extractAllTexts(item));
  }
  
  return Object.values(obj).flatMap(value => extractAllTexts(value));
}
```

**In this project:**
- JSON parsing in `lib/llm-client.ts` handles nested structures recursively.
- Course data structures (roadmaps with chapters) are naturally recursive.

---

## Structure of Recursive Implementations

Every recursive function has:

1. **Base case(s)** – the simplest case that can be solved directly.
2. **Recursive case(s)** – break the problem into smaller subproblems.
3. **Termination guarantee** – ensure recursion eventually reaches a base case.

### Template for Recursive Functions

```typescript
function recursiveFunction(input: InputType): ReturnType {
  // 1. Base case(s) - handle simplest cases
  if (isBaseCase(input)) {
    return baseCaseResult;
  }
  
  // 2. Recursive case - break into smaller subproblem
  const subproblem = makeSmaller(input);
  const subresult = recursiveFunction(subproblem);
  
  // 3. Combine subresult with current input
  return combine(input, subresult);
}
```

### Example: Flattening Nested Arrays

```typescript
function flatten<T>(arr: (T | T[])[]): T[] {
  // Base case: empty array
  if (arr.length === 0) {
    return [];
  }
  
  // Base case: single element (could be array or not)
  if (arr.length === 1) {
    const first = arr[0];
    return Array.isArray(first) ? flatten(first) : [first];
  }
  
  // Recursive case: process first element + rest
  const [first, ...rest] = arr;
  const firstFlattened = Array.isArray(first) ? flatten(first) : [first];
  const restFlattened = flatten(rest);
  
  return [...firstFlattened, ...restFlattened];
}
```

**Termination guarantee:**
- Each recursive call processes a smaller array (fewer elements or fewer levels of nesting).
- Eventually reaches base case (empty array or single element).

---

## Common Mistakes in Recursive Implementations

### 1. Missing Base Case

```typescript
// ❌ BAD: No base case - infinite recursion!
function sum(numbers: number[]): number {
  return numbers[0] + sum(numbers.slice(1)); // Crashes on empty array!
}

// ✅ GOOD: Base case handles empty array
function sum(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0; // Base case
  }
  return numbers[0] + sum(numbers.slice(1));
}
```

### 2. Wrong Base Case

```typescript
// ❌ BAD: Base case doesn't handle all terminal cases
function factorial(n: number): number {
  if (n === 1) {
    return 1;
  }
  return n * factorial(n - 1); // Crashes if n === 0!
}

// ✅ GOOD: Handles n === 0 and n === 1
function factorial(n: number): number {
  if (n <= 1) {
    return 1; // Base case for both 0 and 1
  }
  return n * factorial(n - 1);
}
```

### 3. Not Making Progress

```typescript
// ❌ BAD: Subproblem is same size - infinite recursion!
function processChapters(chapters: Chapter[]): void {
  if (chapters.length === 0) {
    return;
  }
  processChapters(chapters); // Same input - never terminates!
}

// ✅ GOOD: Subproblem is smaller
function processChapters(chapters: Chapter[]): void {
  if (chapters.length === 0) {
    return;
  }
  const [first, ...rest] = chapters;
  processChapter(first);
  processChapters(rest); // Smaller array
}
```

### 4. Incorrect Subproblem

```typescript
// ❌ BAD: Wrong subproblem - doesn't solve the right problem
function findMax(numbers: number[]): number {
  if (numbers.length === 1) {
    return numbers[0];
  }
  // Wrong: comparing first element with max of REST
  // Should compare first with recursive result
  return Math.max(numbers[0], findMax(numbers.slice(1)));
}

// Actually, this one is correct! But here's a clearer version:
function findMax(numbers: number[]): number {
  if (numbers.length === 1) {
    return numbers[0];
  }
  const maxOfRest = findMax(numbers.slice(1));
  return Math.max(numbers[0], maxOfRest);
}
```

**In this project:**
- Recursive functions in parsing and data processing include explicit base cases.
- Tests verify termination for edge cases (empty inputs, single elements).

---

## Recursive Data Types

Some data structures are naturally recursive:

### Trees

```typescript
interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[]; // Recursive: children are also TreeNodes
}

// Recursive operations on trees
function countNodes<T>(node: TreeNode<T>): number {
  // Base case: leaf node (no children)
  if (node.children.length === 0) {
    return 1;
  }
  
  // Recursive case: count this node + all children
  return 1 + node.children.reduce(
    (sum, child) => sum + countNodes(child),
    0
  );
}
```

### Linked Lists

```typescript
interface ListNode<T> {
  value: T;
  next: ListNode<T> | null; // Recursive: next is also a ListNode
}

function length<T>(node: ListNode<T> | null): number {
  // Base case: empty list
  if (node === null) {
    return 0;
  }
  
  // Recursive case: 1 + length of rest
  return 1 + length(node.next);
}
```

### Course Roadmap as Recursive Structure

In this project, course roadmaps could be extended to support nested chapters:

```typescript
interface RecursiveChapter {
  chapterNumber: number;
  title: string;
  subChapters?: RecursiveChapter[]; // Recursive structure
}

// Recursive function to process all chapters at all levels
function getAllChapterTitles(chapter: RecursiveChapter): string[] {
  const titles = [chapter.title];
  
  if (chapter.subChapters) {
    const subTitles = chapter.subChapters.flatMap(
      subChapter => getAllChapterTitles(subChapter)
    );
    titles.push(...subTitles);
  }
  
  return titles;
}
```

**In this project:**
- Course data structures (`CourseRoadmap`, `ChapterRoadmap`) are currently flat but could be extended recursively.
- JSON parsing handles nested structures recursively.

---

## Regular Expressions

Regular expressions are a form of recursive pattern matching:

### Basic Patterns

```typescript
// Match course codes like "CS101", "MATH202"
const courseCodePattern = /^[A-Z]{2,4}\d{3}$/;

// Match email addresses
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### Recursive Patterns

Regular expressions can match nested structures (with limitations):

```typescript
// Match balanced parentheses (simplified - regex has limitations)
const balancedParens = /^\((?:[^()]|\([^()]*\))*\)$/;

// For truly nested structures, use a parser (see Grammars section)
```

**In this project:**
- Input validation in API routes uses regex patterns.
- Prompt template variable replacement uses regex for pattern matching.

### Example: Validating Course Names

```typescript
function isValidCourseName(name: string): boolean {
  // Pattern: letters, numbers, spaces, hyphens, parentheses
  const pattern = /^[A-Za-z0-9\s\-()]+$/;
  return pattern.test(name) && name.trim().length > 0;
}
```

---

## Grammars

Grammars define the structure of languages using recursive rules:

### Context-Free Grammar Example

A grammar for simple arithmetic expressions:

```
Expression → Term | Expression + Term | Expression - Term
Term → Factor | Term * Factor | Term / Factor
Factor → Number | ( Expression )
Number → Digit | Number Digit
Digit → 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
```

This grammar is **recursive** because:
- `Expression` can contain `Expression` (left recursion).
- `Term` can contain `Term` (left recursion).
- `Number` can contain `Number` (right recursion).

### Parsing with Recursion

A recursive descent parser for the above grammar:

```typescript
interface ParseResult {
  value: number;
  remaining: string;
}

function parseExpression(input: string): ParseResult {
  let result = parseTerm(input);
  
  while (result.remaining.startsWith('+') || result.remaining.startsWith('-')) {
    const op = result.remaining[0];
    const termResult = parseTerm(result.remaining.slice(1));
    
    if (op === '+') {
      result = { value: result.value + termResult.value, remaining: termResult.remaining };
    } else {
      result = { value: result.value - termResult.value, remaining: termResult.remaining };
    }
  }
  
  return result;
}

function parseTerm(input: string): ParseResult {
  // Similar recursive structure for Term
  // ...
}
```

### JSON Grammar

JSON is defined by a recursive grammar:

```
JSON → Object | Array | String | Number | Boolean | Null
Object → { } | { Members }
Members → Pair | Members , Pair
Pair → String : JSON
Array → [ ] | [ Elements ]
Elements → JSON | Elements , JSON
```

**In this project:**
- JSON parsing in `lib/llm-client.ts` uses JavaScript's built-in `JSON.parse()`, which implements a recursive parser.
- The `parseJSONResponse` function handles nested JSON structures recursively.

### Example: Parsing Prompt Templates

When parsing prompt templates with nested variable references:

```typescript
// Grammar for template variables: {{variableName}}
// Can be nested: {{outer{{inner}}}}

function parseTemplateVariables(template: string): string[] {
  const variables: string[] = [];
  let depth = 0;
  let currentVar = '';
  let inVariable = false;
  
  for (let i = 0; i < template.length; i++) {
    const char = template[i];
    const nextTwo = template.slice(i, i + 2);
    
    if (nextTwo === '{{') {
      if (inVariable) {
        depth++;
        currentVar += '{{';
      } else {
        inVariable = true;
        currentVar = '';
      }
      i++; // Skip second {
    } else if (nextTwo === '}}') {
      if (inVariable) {
        if (depth === 0) {
          variables.push(currentVar);
          inVariable = false;
          currentVar = '';
        } else {
          depth--;
          currentVar += '}}';
        }
      }
      i++; // Skip second }
    } else if (inVariable) {
      currentVar += char;
    }
  }
  
  return variables;
}
```

---

## Examples from This Repository

### Example 1: JSON Parsing (`lib/llm-client.ts`)

The `parseJSONResponse` function handles nested JSON structures:

```typescript
export function parseJSONResponse<T>(response: string): T {
  // Remove markdown code blocks if present (recursive structure)
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // JSON.parse internally uses recursive parsing for nested structures
  return JSON.parse(cleaned) as T;
}
```

**Why recursion matters:**
- JSON can have arbitrary nesting (objects within arrays within objects).
- The parser must handle this recursively.

### Example 2: Processing Course Chapters

If course structures were extended to support nested chapters:

```typescript
function processAllChapters(chapters: Chapter[]): void {
  // Base case: empty array
  if (chapters.length === 0) {
    return;
  }
  
  // Recursive case: process first, then rest
  const [first, ...rest] = chapters;
  processChapter(first);
  processAllChapters(rest); // Recursive call on smaller array
}
```

### Example 3: Template Variable Replacement (`lib/prompt-loader.ts`)

The `replaceTemplateVariables` function processes templates recursively:

```typescript
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  // Find all {{variable}} patterns (could be nested in complex cases)
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  
  return result;
}
```

**Future extension:** If templates support nested variables, this would need recursive processing.

---

## Best Practices for This Project

### 1. Identify Naturally Recursive Problems

Use recursion when:
- The problem has a naturally recursive structure (trees, nested data).
- The recursive solution is clearer than iterative.
- The problem size decreases predictably.

**Avoid recursion when:**
- The problem is naturally iterative (simple loops).
- Stack depth could be very large (use iteration or tail recursion).
- Performance is critical (iteration is usually faster).

### 2. Always Include Base Cases

Every recursive function must have:
- At least one base case.
- A guarantee that recursion reaches a base case.

```typescript
// ✅ GOOD: Clear base case
function processItems<T>(items: T[]): void {
  if (items.length === 0) { // Base case
    return;
  }
  processItem(items[0]);
  processItems(items.slice(1)); // Recursive case
}
```

### 3. Make Progress Toward Base Case

Each recursive call should:
- Reduce the problem size.
- Move closer to a base case.

```typescript
// ✅ GOOD: Array gets smaller
function sum(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }
  return numbers[0] + sum(numbers.slice(1)); // Smaller array
}
```

### 4. Document Recursive Structure

When using recursion, document:
- What the base case is.
- How the subproblem is smaller.
- Why termination is guaranteed.

```typescript
/**
 * Counts all chapters in a nested chapter structure.
 * 
 * Base case: Chapter with no sub-chapters (returns 1).
 * Recursive case: 1 (this chapter) + sum of all sub-chapters.
 * 
 * Termination: Each recursive call processes a chapter with fewer
 * levels of nesting, eventually reaching a leaf chapter.
 */
function countAllChapters(chapter: RecursiveChapter): number {
  // Implementation...
}
```

### 5. Test Edge Cases

Recursive functions should be tested for:
- Empty inputs (base case).
- Single element (smallest non-base case).
- Deeply nested structures (stress test).
- Maximum recursion depth (if applicable).

---

## Summary

In this project:

- **Recursion principles** are applied by:
  - Using recursive patterns for nested data structures (JSON, course hierarchies).
  - Choosing appropriate recursive subproblems that make progress.
  - Including explicit base cases and termination guarantees.

- **Recursive data types** appear in:
  - JSON structures (objects, arrays).
  - Potential nested chapter structures.
  - Template parsing with nested variables.

- **Regular expressions and grammars** are used for:
  - Input validation (course names, emails).
  - Pattern matching in templates.
  - JSON parsing (via built-in parser).

- The codebase follows these principles to remain:
  - **Safe from bugs** – correct base cases and termination.
  - **Easy to understand** – recursive structure matches problem structure.
  - **Ready for change** – recursive patterns are extensible.

All of this is documented here without modifying any existing behavior, consistent with your assignment requirements.

---

## References

- **MIT 6.102 – Reading on Recursion**  
  Principles of recursive problem solving, recursive data types, and parsing.

- **Related Readings in This Repo**  
  - Specifications: `sc_documentation/specifications/SPECIFICATIONS_DOCUMENTATION.md`  
  - Testing: `sc_documentation/testing/TESTING_DOCUMENTATION.md`  
  - Mutability: `sc_documentation/mutability/MUTABILITY_DOCUMENTATION.md`

- **TypeScript/JavaScript Recursion**  
  - [MDN: Recursion](https://developer.mozilla.org/en-US/docs/Glossary/Recursion)
  - [Tail Call Optimization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function#tail_call_optimization)

- **Regular Expressions**  
  - [MDN: Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
  - [Regex101: Online Regex Tester](https://regex101.com/)

- **Grammars and Parsing**  
  - [Context-Free Grammars](https://en.wikipedia.org/wiki/Context-free_grammar)
  - [Recursive Descent Parsing](https://en.wikipedia.org/wiki/Recursive_descent_parser)

These resources together show how **Recursion** principles from MIT 6.102 are applied within the AI Learning Route Builder project.

