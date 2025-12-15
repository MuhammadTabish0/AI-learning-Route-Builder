# Debugging & Avoiding Debugging - MIT 6.102 Reading 13 Integration

## Table of Contents

1. [Overview](#overview)
2. [Avoiding Debugging: Making Bugs Impossible or Easy to Find](#avoiding-debugging-making-bugs-impossible-or-easy-to-find)
3. [Assertions and Failing Fast](#assertions-and-failing-fast)
4. [Localizing Bugs in This Project](#localizing-bugs-in-this-project)
5. [Concrete Examples from the Codebase](#concrete-examples-from-the-codebase)
6. [Debugging Workflow in This Repo](#debugging-workflow-in-this-repo)
7. [Guidelines for New Code](#guidelines-for-new-code)
8. [Summary](#summary)
9. [References](#references)

---

## Overview

This document explains how **MIT 6.102 Reading 13: (Avoiding) Debugging**  
([link](https://web.mit.edu/6.102/www/sp25/classes/13-debugging/))  
is applied to the **AI Learning Route Builder** project.

The reading emphasizes:

- **Avoiding debugging** where possible, by:
  - Making bugs impossible or unlikely (static typing, immutability, good specs).
  - Making bugs easy to find (assertions, failing fast, localization).
- **Debugging systematically** when bugs do happen:
  - Reproducing bugs with tests,
  - Using the scientific method,
  - Fixing the underlying cause.

This project already integrates:

- **Specifications** ([Reading 4](https://web.mit.edu/6.102/www/sp25/classes/04-specifications/)),
- **Designing Specifications** ([Reading 5](https://web.mit.edu/6.102/www/sp25/classes/05-designing-specs/)),
- **Testing** (Reading 2),
- **Code Review** (Reading 3).

This document adds a **Debugging** perspective on top of that, focusing on:

- Where we rely on **static and dynamic checking** to avoid bugs.
- How we use **assertions** and clear errors to localize bugs quickly.
- How we integrate debugging with the existing testing and spec infrastructure.

### Quick Reference: Where Debugging Principles Show Up in the Code

For your instructor, here is a concrete list of where **(Avoiding) Debugging, assertions, and localizing bugs** are applied in this repo:

- **LLM client & JSON parsing (defensive boundary)**  
  - `lib/llm-client.ts`  
    - `parseJSONResponse<T>(response: string)` – strips markdown fences, checks for likely truncation, logs diagnostics, and throws detailed errors instead of letting malformed JSON propagate.  
    - `callLLM(prompt: string, model: string)` – validates `GEMINI_API_KEY`, wraps the prompt in a fixed system instruction, and wraps low-level errors with clearer messages.
- **AI generators (structural assertions over LLM output)**  
  - `ai/roadmapGenerator.ts`  
    - `generateRoadmap(subject: string)` – validates that `roadmap.subject` is truthy and `roadmap.chapters` is an array, throwing `"Invalid roadmap structure returned from LLM"` if not.  
  - `ai/fullCourseGenerator.ts`  
    - `generateFullCourse(courseName: string, ...)` – checks that `courseData.roadmap`, `courseData.resources`, and their nested fields have the expected structure, throwing `"Invalid course structure returned from LLM"` / `"Invalid roadmap/resources structure returned from LLM"` when assumptions fail.  
    - `saveCourseIncrementally(...)` – confines file I/O errors to logging so they don’t masquerade as generation bugs.
- **API routes (localizing bugs at the HTTP boundary)**  
  - `app/api/generate-roadmap/route.ts`  
    - `POST` handler – validates the request body (`subject` must be a non-empty string) and returns a `400` with a clear message instead of calling the generator with bad input; wraps generator failures into `500` responses with error messages for easier localization.
- **Tests as executable debugging tools**  
  - `lib/__tests__/llm-client.test.ts` – exercises `parseJSONResponse` over many partitions (valid JSON, markdown-wrapped JSON, malformed/truncated JSON, real-world structures), turning potential parsing/debugging scenarios into **systematic regression tests**.

These specific functions and files are the main “practical” embodiments of the Reading 13 ideas in this project.

All code changes made for this principle are either:

- **Documentation-only**, or
- **Invariant-style assertions** that do not change behavior for valid inputs, but fail fast if an internal assumption is violated.

---

## Avoiding Debugging: Making Bugs Impossible or Easy to Find

Following Reading 13, the project uses several techniques to *avoid* expensive debugging:

- **Static checking** with TypeScript:
  - Types for AI responses (`RoadmapResponse`, `CourseRoadmapResponse`, etc.) catch many shape/type bugs at compile time.
  - Strict typing in `lib/` and `ai/` modules reduces whole classes of errors (e.g., mis-typed fields).
- **Dynamic checking** at module boundaries:
  - API routes validate request bodies and return structured error responses instead of silently proceeding with invalid data.
  - JSON parsing and structure validation (`parseJSONResponse`, extra checks in generators) prevent malformed LLM outputs from silently corrupting the system.
- **Immutability and limited mutation**:
  - Many values passed between modules are treated as *immutable data* (plain objects/arrays used as values).
  - Helper functions like `cn` are pure and side-effect free, making them easier to reason about.

These patterns reflect the reading’s “first and second defenses”:

- Make certain bugs impossible by design.
- Make remaining bugs easy to detect and confine.

---

## Assertions and Failing Fast

Reading 13 emphasizes **assertions** and failing fast to keep bugs localized:

- Instead of letting incorrect state propagate, we:
  - Check important invariants as soon as possible.
  - Throw clear errors when assumptions are violated.

In this project:

- **TypeScript types + runtime checks** together act as assertions:
  - Parsing + validation after LLM calls ensures we do not continue with malformed data.
  - Structural checks in AI generators (e.g., verifying `roadmap.chapters` is an array) are runtime assertions of our specifications.
- Additional **invariant-style assertions** are introduced where useful to:
  - Check assumptions that “should never be false” if the code and prompts are correct.
  - Immediately surface bugs in prompt templates, LLM behavior, or parsing logic.

These assertions:

- Do **not** change behavior for valid, well-formed inputs.
- Only trigger when there is a genuine mismatch between our **specs** and actual behavior—exactly when debugging is needed.

---

## Localizing Bugs in This Project

Reading 13 stresses **localizing bugs**:

- Keeping them confined to a small part of the code.
- Ensuring they fail near their cause, not somewhere far downstream.

In this repository, we localize bugs via:

- **Clear module boundaries**:
  - `ai/*.ts` handles prompt construction and response interpretation.
  - `lib/llm-client.ts` encapsulates all interaction with the Gemini API.
  - `app/api/*/route.ts` deals with HTTP-specific concerns.
- **Structured data flow**:
  - LLM responses are always parsed into typed interfaces before being passed on.
  - Incremental saving (`saveCourseIncrementally`) isolates file I/O and logging concerns.
- **Targeted checks and assertions**:
  - Each layer validates its own assumptions and fails with descriptive errors if they are violated.

When a bug occurs (e.g., malformed LLM response, bad prompt substitution, invalid API request), this design:

- Produces a clear error message with context (which function/module failed, and why).
- Helps us quickly pinpoint whether:
  - The issue is in the prompt template,
  - The LLM output,
  - The parsing/validation,
  - Or the API wiring.

---

## Concrete Examples from the Codebase

This section highlights how the debugging principles show up concretely.

### 1. `parseJSONResponse` in `lib/llm-client.ts` – Defensive Parsing

- **Goal**: turn a potentially messy LLM string into reliable JSON or fail loudly.
- **Debugging-related behavior**:
  - Strips markdown code fences (` ``` `, ` ```json `) before parsing.
  - Checks for likely truncation (unbalanced braces/brackets, very long responses).
  - Logs detailed diagnostics (preview, length, tail of response) on failure.
  - Throws errors that explicitly mention truncation or parse failures.
- **Effect on debugging**:
  - When the LLM returns invalid JSON, the bug is **localized** to parsing and surfaced with a clear error.
  - Downstream generators never see half-parsed or undefined data.

This closely follows Reading 13’s advice:

- Fail fast when assumptions are violated.
- Provide rich information to help understand and fix the root cause.

### 2. AI Generators (`ai/roadmapGenerator.ts`, `ai/fullCourseGenerator.ts`) – Structural Assertions

- **Existing defenses**:
  - Use `parseJSONResponse` to obtain typed results from the LLM.
  - Explicitly validate the structure of parsed objects, e.g.:
    - `roadmap.subject` is non-empty,
    - `roadmap.chapters` is an array,
    - `courseData.roadmap` and `courseData.resources` exist and have the right shapes.
- **Role in debugging**:
  - These checks act as **assertions** of our specifications about AI responses.
  - If a prompt change or model update breaks the contract, the error appears right where the data is produced and interpreted.
  - Error messages are prefixed (e.g., `"Failed to generate roadmap: ..."`, `"Failed to generate course roadmap: ..."`), making it easy to trace which generator failed.

This embodies the reading’s idea of **localizing bugs to a module** and not letting them silently flow into later stages like file saving or UI rendering.

### 3. Incremental Saving in `ai/fullCourseGenerator.ts`

- `saveCourseIncrementally`:
  - Wraps its logic in a `try/catch` and logs errors, but **does not throw**, since saving is best-effort.
  - This localizes I/O errors to the persistence layer, without breaking the generation pipeline.
- From a debugging perspective:
  - When a save fails (e.g., permissions, corrupted JSON), the issue is confined and logged.
  - The rest of the system (generation logic, returned result to caller) can still succeed.

This follows Reading 13’s guidance to:

- Confine bugs (e.g., file system issues) so they don’t masquerade as logic or LLM problems.

### 4. TypeScript Types as Debugging Aids

- Interfaces like `CourseRoadmapResponse`, `ChapterContent`, `FinalExamQuestion` act as:
  - **Static contracts** checked at compile time.
  - A form of “always-on assertion” that ensures fields exist and have the right types wherever they are used.
- When refactoring or extending the system:
  - Type errors act as early warnings of potential bugs, before runtime debugging is needed.

This matches Reading 13’s “first defense”: use static checking to eliminate bugs before they occur.

---

## Debugging Workflow in This Repo

When a bug is suspected, a typical workflow consistent with Reading 13 looks like:

1. **Reproduce as a test case**:
   - Add or update tests in `ai/__tests__` or `lib/__tests__` to capture the failing behavior.
   - Use minimal, focused inputs to isolate the bug.
2. **Localize using module boundaries**:
   - Check whether the failure arises:
     - At the API boundary (`app/api/*/route.ts`),
     - In the AI generator (`ai/*.ts`),
     - In the LLM client or parsing (`lib/llm-client.ts`),
     - Or in utility code (`lib/utils.ts`).
3. **Use logging and assertions**:
   - Rely on existing error messages and logs from parsing and structure checks.
   - Temporarily add small, targeted logging if necessary (then remove before committing).
4. **Fix the cause, not just the symptom**:
   - Adjust prompt templates, parsing logic, or type definitions as needed.
   - Update tests to cover the bug scenario so it doesn’t regress.

This workflow tightly couples **debugging** with:

- The **specifications** (what should happen),
- The **tests** (what is checked automatically),
- And the **code review** process (ensuring fixes maintain safety and clarity).

---

## Guidelines for New Code

When adding new features or modules, apply Reading 13’s principles in this project as follows:

- **Prefer designs that avoid bugs**:
  - Use TypeScript types generously.
  - Keep functions small and single-purpose.
  - Avoid unnecessary mutation; use pure functions where possible.
- **Add assertions at boundaries**:
  - After parsing external input (LLM responses, HTTP requests), assert the expected structure.
  - Use clear error messages that include enough context to debug (module name, what assumption failed).
- **Fail fast on impossible states**:
  - If a path “should never be reached” under valid specs, throw an error rather than silently defaulting.
- **Use tests to reproduce and prevent bugs**:
  - Turn found bugs into regression tests.
  - Keep tests close to the modules they exercise (`ai/__tests__`, `lib/__tests__`).
- **Remove temporary debugging probes before committing**:
  - Follow Reading 13’s advice: don’t leave stray `console.log` or commented-out code after fixing a bug.

These practices keep the system:

- **Safe from bugs** – issues are caught early and clearly.
- **Easy to understand** – assertions and types document assumptions.
- **Ready for change** – when code evolves, assumptions are rechecked automatically.

---

## Summary

- This document integrates **MIT 6.102 Reading 13: (Avoiding) Debugging** into the AI Learning Route Builder project.
- It explains how:
  - Static typing, structured parsing, and runtime assertions reduce the need for ad-hoc debugging.
  - Clear module boundaries and invariant checks help localize bugs when they do occur.
  - Testing, specifications, and debugging practices reinforce each other.
- Any code-level changes for this principle are limited to **invariant-style checks** that do not alter behavior for valid inputs, but improve error messages and localization when something goes wrong.

---

## References

- **MIT 6.102 – Reading 13: (Avoiding) Debugging**  
  [https://web.mit.edu/6.102/www/sp25/classes/13-debugging/](https://web.mit.edu/6.102/www/sp25/classes/13-debugging/)

- **Related 6.102 Principles in This Repo**  
  - Specifications: `sc_documentation/specifications/SPECIFICATIONS_DOCUMENTATION.md`  
  - Designing Specifications: `sc_documentation/designing_specifications/DESIGNING_SPECS_DOCUMENTATION.md`  
  - Testing: `sc_documentation/testing/TESTING_DOCUMENTATION.md`  
  - Code Review: `sc_documentation/code_review/CODE_REVIEW_DOCUMENTATION.md`


