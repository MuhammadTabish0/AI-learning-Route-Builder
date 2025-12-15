# Specifications Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Specifications and Behavioral Equivalence](#specifications-and-behavioral-equivalence)
3. [Specification Structure Used in This Project](#specification-structure-used-in-this-project)
4. [Specifications in TypeScript and JSDoc](#specifications-in-typescript-and-jsdoc)
5. [What Specs May Talk About](#what-specs-may-talk-about)
6. [Avoiding `null` and Including Emptiness](#avoiding-null-and-including-emptiness)
7. [Specifications, Testing, and Code Review](#specifications-testing-and-code-review)
8. [Module-Level Specifications](#module-level-specifications)
9. [Concrete Examples from This Repository](#concrete-examples-from-this-repository)
10. [Specification Checklist for New Code](#specification-checklist-for-new-code)
11. [Summary](#summary)
12. [References](#references)

---

## Overview

This document explains how **Specifications** from **MIT 6.102: Software Construction – Reading 4: Specifications** are applied to the AI Learning Route Builder project  
([Reference](https://web.mit.edu/6.102/www/sp25/classes/04-specifications/)).

Specifications are treated as **contracts** between:

- the **client** of a function/module (code that calls or imports it), and  
- the **implementer** of that function/module (code that defines it).

They help us build software that is:

- **Safe from bugs** – by clarifying responsibilities and preventing interface misunderstandings.
- **Easy to understand** – a short, precise spec is easier to read than implementation code.
- **Ready for change** – implementations can change as long as they still satisfy the spec.

### What Was Added

- ✅ **Inline specifications in the codebase** using JSDoc-style comments with explicit preconditions and postconditions, particularly in:
  - `lib/prompt-loader.ts` (`loadPromptTemplate`, `replaceTemplateVariables`)
  - `lib/llm-client.ts` (`retryWithBackoff`, `callLLM`, `parseJSONResponse`)
  - `ai/roadmapGenerator.ts` (`generateRoadmap`)
  - `lib/utils.ts` (`cn`)
- ✅ **Documentation in `sc_documentation/`** explaining how to think about and write specifications in this project.
- ✅ **Project-specific guidelines** for preconditions, postconditions, and module specs.
- ✅ **Connections** between specifications, the testing infrastructure, and the code review process.

### No Behavior Changed

In line with your requirement for this course:

- The **logic** of existing functions in `app/`, `ai/`, `lib/`, and `components/` was not altered.
- The new comments and specs **describe** the current behavior and contracts; they do not change runtime behavior, database schema, or external API behavior.
- All code edits are **non-invasive**: they only add documentation around existing implementations.

---

## Specifications and Behavioral Equivalence

The MIT 6.102 reading introduces **behavioral equivalence** using variations of a `find` function. The key idea:

- Two implementations are *behaviorally equivalent* **with respect to a spec** if:
  - For all legal inputs (those satisfying the **precondition**),
  - They produce outputs and effects allowed by the **postcondition**.

In this project, this means:

- We can freely **refactor** internal implementations (e.g., in `ai/roadmapGenerator.ts` or `lib/prompt-loader.ts`)
- As long as:
  - The function still satisfies its **documented contract** (types + comments).
  - The tests (written against the spec) still pass.

This is exactly how we keep the code **Ready for change**: specs form a contract that protects clients when implementation details evolve.

---

## Specification Structure Used in This Project

The reading describes specifications in terms of **preconditions** and **postconditions**:

- **Precondition (requires)** – what must be true for a *legal call*.
- **Postcondition (effects/returns)** – what is guaranteed when the precondition is met.

In this TypeScript project, we express specs using:

- **Type annotations** (function signatures, interfaces, return types).
- **JSDoc-style comments** and doc blocks.
- **Descriptive names** for parameters and return values.
- **Runtime checks and exceptions** when preconditions are violated.

### Example Spec Pattern (General Form)

Conceptually, many functions in this repo can be thought of as having specs like:

```ts
/**
 * @param subject  non-empty string describing the course subject
 * @returns        roadmap object with subject and a non-empty array of chapters
 *
 * Requires:
 * - subject.trim().length > 0
 *
 * Effects:
 * - returns a roadmap whose `subject` field equals the given subject
 * - roadmap.chapters is an array (possibly empty, depending on LLM output),
 *   each chapter has a non-empty title
 * - does not modify external state
 */
```

This general pattern is now **made concrete** in several key modules via JSDoc comments that explicitly include **Requires/Effects** sections. These inline specs guide:

- how we design public functions in `ai/` and `lib/`, and  
- how we write tests against them (see `TESTING_DOCUMENTATION.md`).

---

## Specifications in TypeScript and JSDoc

The reading emphasizes that specs can be partially **machine-checked** using language features:

- Type signatures
- Exception types and behaviors
- `undefined` in union types for special results

In this project, we use:

- **TypeScript function signatures** to specify:
  - Number and types of parameters.
  - Return type (`Promise<...>` vs. synchronous).
- **Interfaces and types** for structured results:
  - Roadmaps, notes, resources, questions.
- **JSDoc-style comments** (where present) to document:
  - Preconditions (e.g., “subject must be non-empty”).
  - Postconditions (e.g., “chapters is an array of chapter descriptions”).

### What the Compiler Checks vs. What Comments Check

Per the reading:

- TypeScript **statically checks**:
  - Number and type of arguments.
  - Return type usage.
- Comments and developer discipline **check**:
  - Semantic properties like:
    - “string must be non-empty.”
    - “array must be sorted.”
    - “object must contain unique IDs.”

In this repository:

- We rely on **types** wherever possible, and
- Use **tests** and **code review** to enforce the semantic parts of the spec.

---

## What Specs May Talk About

According to the reading, a good specification makes clear:

- **What the function reads** (its parameters and possibly global state).
- **What the function writes** (its return value and any side effects).
- **Exceptional behavior** (when and why exceptions are thrown).

For this project, that means:

- For **pure library functions** (e.g., formatting helpers in `lib/utils.ts`):
  - Specs talk mainly about inputs and outputs.
  - They avoid side effects.
- For **AI generators** (`ai/*.ts`):
  - Specs also discuss the *shape* of the generated data.
  - They may mention that behavior depends on LLM output but still guarantee structure.
- For **API routes** (`app/api/*/route.ts`):
  - Specs include:
    - Expected request body/query structure.
    - Response shape and status codes.
    - When errors are returned (e.g., missing fields, invalid subject).

This is consistent with using specifications as **contracts at module boundaries**, reducing bugs at the interfaces between components.

---

## Avoiding `null` and Including Emptiness

The MIT 6.102 reading stresses:

- Prefer **avoiding `null`** in specs.
- **Include emptiness** in your specifications and tests (e.g., empty strings, empty arrays).

In this project:

- TypeScript is configured to avoid pervasive `null` usage.
- We use:
  - `undefined` in union types when a special result is needed, or
  - exceptions when an illegal call is made.
- Our **testing strategy** (documented in `TESTING_DOCUMENTATION.md`) already includes:
  - Empty strings.
  - Empty arrays.
  - Boundary values.

For specifications, this means:

- When documenting functions, we explicitly state whether:
  - Empty input is **allowed** (part of the precondition), and what happens in that case.
  - Empty input is **forbidden**, in which case we:
    - Document a precondition (e.g., “must be non-empty”), and
    - Throw an exception or return a clearly-invalid result when violated.

This alignment between specs and tests is exactly what Reading 4 advocates.

---

## Specifications, Testing, and Code Review

The reading explicitly connects **specifications** to **testing**:

- **Tests should be written against the specification**, not against incidental implementation details.
- A change in implementation is acceptable if:
  - It still satisfies the spec, and
  - All tests (based on that spec) continue to pass.

In this project:

- The testing documentation (`TESTING_DOCUMENTATION.md`) already frames:
  - Black-box tests as being based on publicly observable behavior.
  - Glass-box tests as *additional* checks for tricky internal behavior.
- The code review documentation (`CODE_REVIEW_DOCUMENTATION.md`) stresses:
  - Reading code “as if you only see the spec” (function signature + comments).
  - Ensuring changes remain **Safe from bugs**, **Easy to understand**, **Ready for change**.

Specifications are thus the **common language** between:

- Implementers,
- Test writers, and
- Code reviewers.

---

## Module-Level Specifications

The reading also talks about **modules** as units with their own specifications.

In modern TypeScript:

- Each file is a **module**.
- A module’s **specification** is:
  - The set of exported functions, types, and constants, plus
  - Their individual function specs.

In this repository:

- `lib/prompt-loader.ts`:
  - Exports functions to load prompt templates.
  - Its module spec is: “given a logical prompt name, load a corresponding template string or throw a clear error.”
- `lib/llm-client.ts`:
  - Exports a client abstraction around the underlying LLM.
  - Its module spec is: “given prompts and parameters, return or reject with structured data matching the expected types.”
- `ai/*.ts`:
  - Each generator module has a conceptual spec:
    - Input: subject, chapter, or context.
    - Output: a structured object (roadmap, notes, questions, resources).
- `app/api/*/route.ts`:
  - Each route module’s spec is:
    - HTTP verb + path.
    - Request contract (body/query).
    - Response status and body shape.

Even when these specs are not fully written out as comments, they are implied by:

- TypeScript types,
- Usage in tests, and
- How other modules import and rely on them.

---

## Concrete Examples from This Repository

Below are *actual* specifications that now appear directly in the codebase, using explicit **Requires/Effects** sections in JSDoc comments.

### Example 1: Prompt Loading (`lib/prompt-loader.ts`)

The `loadPromptTemplate` function is documented with an explicit contract:

```ts
/**
 * Loads a prompt template from the `prompts` directory.
 *
 * **Specification**:
 *
 * Requires:
 * - `templateName` is a non-empty string that corresponds to a `.txt` file
 *   under the `prompts/` directory (without the `.txt` extension).
 *
 * Effects:
 * - Attempts to read `<cwd>/prompts/${templateName}.txt`.
 * - If the file exists and is readable, returns its contents as a UTF‑8 string.
 * - If the file cannot be read for any reason (missing file, I/O error, etc.),
 *   throws an `Error` whose message includes the `templateName` and original error.
 */
```

Similarly, `replaceTemplateVariables` documents how placeholders are replaced and that it does **not** mutate its arguments.

### Example 2: Utility Function (`cn` in `lib/utils.ts`)

The `cn` helper now includes a concrete spec:

```ts
/**
 * Combines conditional Tailwind/utility class names into a single string.
 *
 * **Specification**:
 *
 * Requires:
 * - `inputs` is any number of `ClassValue` arguments accepted by `clsx`.
 *
 * Effects:
 * - Uses `clsx` to convert the inputs into a space-separated class string,
 *   filtering out falsey values according to `clsx` semantics.
 * - Uses `twMerge` to merge Tailwind CSS classes intelligently so that
 *   conflicting utilities are resolved in favor of the last occurrence.
 * - Returns the resulting merged class string.
 * - Does not mutate any of its arguments or global state.
 */
```

Tests in `lib/__tests__/utils.test.ts` already treat `cn` as if this spec were the contract; now the contract is explicitly written next to the implementation.

### Example 3: AI Roadmap Generation (`ai/roadmapGenerator.ts`)

The `generateRoadmap` function is now documented as:

```ts
/**
 * Generates a subject roadmap with ordered chapters.
 *
 * **Specification**:
 *
 * Requires:
 * - `subject` is a non-empty string describing the course subject.
 *
 * Effects:
 * - Loads the `'roadmap'` prompt template using `loadPromptTemplate`.
 * - Substitutes `{{subject}}` in the template via `replaceTemplateVariables`.
 * - Calls the LLM through `callLLM` and parses the response as `RoadmapResponse`
 *   using `parseJSONResponse`.
 * - Returns an object where:
 *   - `roadmap.subject` is a string (typically echoing the input),
 *   - `roadmap.chapters` is an array (possibly empty) of chapter descriptions.
 * - If any step fails (prompt loading, LLM call, JSON parsing, or structural
 *   validation), throws an `Error` whose message is prefixed with
 *   `"Failed to generate roadmap:"`.
 *
 * This function does not persist data or mutate external state; it is a pure
 * generator based on the current prompt templates and LLM behavior.
 */
```

This makes the contract that tests in `ai/__tests__/roadmapGenerator.test.ts` rely on **visible at the implementation site**.

### Example 4: LLM Client (`lib/llm-client.ts`)

Two key functions now carry explicit specifications:

- `callLLM(prompt, model)` documents:
  - that `GEMINI_API_KEY` must be set (otherwise it throws),
  - that it wraps the prompt with a fixed system instruction requiring JSON output,
  - that it uses streaming with retry/backoff semantics, and
  - that it returns the raw response string or throws a descriptive `Error`.
- `parseJSONResponse<T>(response)` documents:
  - how markdown code fences are stripped,
  - how incomplete JSON is detected and logged,
  - and the precise conditions under which it throws parsing/truncation errors.

---

## Specification Checklist for New Code

When adding new functionality to this project, aim to:

- **Write or infer a spec before implementation** (even briefly):
  - What are the legal inputs (preconditions)?
  - What must be true about the output (postconditions)?
  - What exceptions or special results are allowed?
- **Express as much as possible in TypeScript types**:
  - Prefer specific types over `any`.
  - Use union types for special results (e.g., `T | undefined`).
- **Document what types cannot express**:
  - “Non-empty string,” “sorted array,” “unique keys.”
- **Include emptiness in the spec**:
  - Be explicit: is `[]` allowed? Is `''` allowed?
- **Keep specs small and focused**:
  - Short, precise, easy to read before diving into code.

This matches the MIT 6.102 guidance that specs act as a **firewall** between components and are crucial to teamwork.

---

## Summary

In this project:

- **Specifications** are:
  - Expressed via TypeScript types, JSDoc comments, and module boundaries.
  - Enforced by tests and code review.
  - Grounded in **MIT 6.102 Reading 4: Specifications**.
- They make the code:
  - **Safe from bugs** by clarifying responsibilities at interfaces.
  - **Easy to understand** by providing concise contracts.
  - **Ready for change** by allowing implementation changes that preserve the contract.

All of this is documented here without modifying any existing behavior, consistent with your assignment requirements.

---

## References

- **MIT 6.102 – Reading 4: Specifications**  
  `https://web.mit.edu/6.102/www/sp25/classes/04-specifications/`

- **Related Readings**  
  - Testing: `https://web.mit.edu/6.102/www/sp25/classes/02-testing/`  
  - Code Review: `https://web.mit.edu/6.102/www/sp25/classes/03-code-review/`

- **Project Documentation in This Repo**  
  - `sc_documentation/TESTING_DOCUMENTATION.md`  
  - `sc_documentation/CODE_REVIEW_DOCUMENTATION.md`  
  - `sc_documentation/TEST_INTEGRATION_SUMMARY.md`

These resources together show how **Testing**, **Code Review**, and **Specifications** from MIT 6.102 are all applied coherently within the AI Learning Route Builder project.


