# Code Review Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Code Review Principles Applied](#code-review-principles-applied)
3. [Code Review Process for This Project](#code-review-process-for-this-project)
4. [What to Look For in Reviews](#what-to-look-for-in-reviews)
5. [Examples from This Repository](#examples-from-this-repository)
6. [How to Run a Review Locally](#how-to-run-a-review-locally)
7. [Refactoring Under Code Review](#refactoring-under-code-review)
8. [Summary Checklist](#summary-checklist)
9. [References](#references)

---

## Overview

This document explains how **Code Review** as taught in **MIT 6.102: Software Construction – Reading 3: Code Review** is applied to the AI Learning Route Builder project  
([Reference](https://web.mit.edu/6.102/www/sp25/classes/03-code-review/)).

The goal is to make the code:

- **Safe from bugs** – more people looking at the code catch more defects.
- **Easy to understand** – code is written for future readers, not just for the compiler.
- **Ready for change** – designs and abstractions are reviewed for flexibility.

### What Was Added

- ✅ **Documentation only** in `sc_documentation/` describing how to do code review in this project.
- ✅ **Project-specific review checklists** grounded in the MIT 6.102 reading.
- ✅ **Guidelines for reviewers and authors** (what good review comments look like, what good PRs look like).
- ✅ **Examples of review targets** in this repo (tests, AI generators, utility modules, API routes).

### No Functionality Changed

**Important:** As with the testing principle, this Code Review integration is **non-invasive**:

- No source files in `app/`, `ai/`, `lib/`, or `components/` have been modified.
- No runtime behavior, API contracts, or database behavior has been changed.
- Only **documentation** has been added to explain *how* code should be reviewed.

---

## Code Review Principles Applied

This project adopts the general practices discussed in the MIT 6.102 Code Review reading  
([Reading 3: Code Review](https://web.mit.edu/6.102/www/sp25/classes/03-code-review/)).

### 1. Code Review Has Two Purposes

1. **Improving the code**
   - Find bugs and potential bugs before they ship.
   - Check clarity, style, and consistency.
   - Ensure modules remain **Safe from bugs, Easy to understand, Ready for change**.

2. **Improving the programmers**
   - Share idioms and project conventions.
   - Spread knowledge of parts of the codebase.
   - Practice giving and receiving constructive feedback.

In this repository, both goals are explicit: every review should include at least **one concrete improvement to the code** *or* **one documented learning/takeaway for the author**.

### 2. Style Standards & Consistency

The reading emphasizes that a project should follow its own conventions:

- This project already has consistent patterns in:
  - `lib/utils.ts` and its tests
  - `lib/prompt-loader.ts`
  - `ai/*Generator.ts` modules
  - API route handlers in `app/api/*/route.ts`
- Code review checks for:
  - Consistent use of TypeScript features (e.g., `async/await`, `Promise` types).
  - Consistent testing style (partitioning, boundary tests, black-box focus).
  - Consistent React/Next.js patterns in `app/*/page.tsx` files.

The **goal is not to reformat code to personal taste**, but to keep it consistent with the *existing* style of this repository, in line with the reading’s warning that “the programmer who reformats every module will be hated.”

### 3. High-Level Practices From the Reading

The MIT 6.102 reading highlights several “smells” and rules of thumb. In reviews for this project, we particularly look for:

- **Don’t Repeat Yourself (DRY)** – duplicated logic between:
  - AI generator modules (`fullCourseGenerator`, `roadmapGenerator`, etc.).
  - API route handlers in `app/api`.
- **Comment where needed** – when non-obvious invariants or assumptions exist.
- **Fail fast** – validate inputs early in route handlers and library functions.
- **Avoid magic numbers** – especially in prompts, scoring rules, and limits.
- **One purpose per variable** – name and scope variables clearly.
- **Use good names** – especially for AI-related data structures and types.
- **Avoid unnecessary global state** – keep things local or use explicit providers.
- **Functions should return results, not print them** – already followed here; reviewers ensure it stays that way.
- **Code at the right length** – pull out helpers when functions grow too large.

---

## Code Review Process for This Project

### 1. When to Require Code Review

For this course project, the following kinds of changes should go through code review:

- Changes to **core logic**:
  - `ai/*.ts` generators
  - `lib/*.ts` utilities, prompt loading, and LLM client
  - `app/api/*/route.ts` server handlers
- Changes to **data contracts**:
  - New or modified TypeScript types/interfaces that cross module boundaries.
- Changes to **tests of critical behavior**:
  - Any edits to `lib/__tests__/*.test.ts` or `ai/__tests__/*.test.ts`.
- Changes to **configuration that affects behavior**:
  - `next.config.mjs`, `tsconfig.json`, or environment variable usage.

Pure documentation changes (like this file) can be self-reviewed, but still benefit from a quick skim by another person when possible.

### 2. Suggested Workflow (Simulated for Course Purposes)

1. **Author**
   - Creates a small, focused change (e.g., edits in 1–3 files).
   - Runs tests locally (`npm test` or targeted test file).
   - Writes a clear description:
     - What changed
     - Why it changed
     - How it was tested

2. **Reviewer**
   - Reads the description first (understands intent).
   - Skims high-level structure (files, functions touched).
   - Dives into details, asking:
     - Is it **safe from bugs**?
     - Is it **easy to understand**?
     - Is it **ready for change**?

3. **Conversation**
   - Reviewer leaves **specific** comments (see below).
   - Author responds, clarifies, or makes changes.
   - Both agree on final version.

4. **Merge / Accept**
   - Tests still pass.
   - No new lints or type errors.
   - Changes are small enough to be understandable as a unit.

This mimics the professional process (GitHub pull requests, Gerrit, etc.) described in the reading.

---

## What to Look For in Reviews

The MIT 6.102 reading suggests looking for **general principles** in every review. Here is the project-specific checklist.

### 1. Safe From Bugs

- **Branch coverage logic**: Did the change add new branches or special cases?
- **Edge cases**: Are edge cases surfaced in tests (or at least mentioned)?
- **Error handling**:
  - Do functions fail fast with useful errors?
  - Are rejected promises handled or propagated clearly?
- **Type safety**:
  - Are types too broad (`any`, `unknown`) where stricter types are possible?
  - Are null/undefined cases handled explicitly?

### 2. Easy to Understand

- **Names**:
  - Are function and variable names descriptive and consistent?
  - Do AI-related functions reflect what they actually generate (roadmap, notes, etc.)?
- **Structure**:
  - Are functions and components kept to a reasonable length?
  - Are helpers extracted when logic is complex?
- **Comments**:
  - Are there comments where the code would otherwise be surprising?
  - Are comments accurate (not misleading)?

### 3. Ready for Change

- **Modularity**:
  - Is logic grouped in reusable modules (`lib`, `ai`) rather than duplicated in routes?
  - Are prompts and templates centralized via `prompt-loader`?
- **Abstraction boundaries**:
  - Does the change respect existing module boundaries?
  - Are new dependencies introduced thoughtfully?
- **DRY**:
  - Could similar logic in tests, generators, or routes be factored out?

---

## Examples from This Repository

These are **places where code review is particularly valuable** in this project.

### 1. Utility Functions (`lib/utils.ts`)

Reviewers can:

- Check that utilities are **small, single-purpose** functions.
- Ensure new utilities are **tested in `lib/__tests__/utils.test.ts`**.
- Watch out for:
  - Magic numbers.
  - Overly generic helpers with unclear semantics.

### 2. Prompt Handling & LLM Client (`lib/prompt-loader.ts`, `lib/llm-client.ts`)

- Ensure **prompt loading** stays robust:
  - Clear errors when a prompt file is missing.
  - No hidden magic file paths.
- Ensure **LLM client** usage is:
  - Properly typed.
  - Centralized rather than scattered across modules.
- Review tests in:
  - `lib/__tests__/prompt-loader.test.ts`
  - `lib/__tests__/llm-client.test.ts`

### 3. AI Generators (`ai/*.ts`)

For generators such as `roadmapGenerator`, `notesGenerator`, and `fullCourseGenerator`:

- Ensure **clear data shapes**:
  - Interfaces/types for roadmaps, chapters, resources, questions.
- Ensure **behavior is tested** in:
  - `ai/__tests__/*Generator.test.ts`.
- Look for **unnecessary special-casing**:
  - The reading warns that special-case code can hide bugs.
  - Prefer a clean general-case algorithm plus tests.

### 4. API Routes (`app/api/*/route.ts`)

Review should focus on:

- Input validation and fail-fast behavior.
- Clear mapping from HTTP request to internal functions.
- Keeping route handlers **thin**, delegating logic to `lib`/`ai`.

---

## How to Run a Review Locally

Even without a real PR system, you can simulate code review for this course:

1. **Diff inspection**
   - Use `git diff` (or your IDE’s diff view) to see exactly what changed.
2. **Run tests**
   - `npm test` to ensure changes are safe.
3. **Static checks**
   - `npm run lint` (if configured) to catch style/type issues.
4. **Read code like an essay**
   - Pretend you have never seen this code before.
   - Ask: would future-you understand this in 6 months?

All of these match the reading’s analogy of code review to **proofreading a paper**.

---

## Refactoring Under Code Review

The reading emphasizes **refactoring**: changing internal structure without changing behavior.

In this project:

- Refactoring candidates include:
  - Extracting shared logic between AI generators.
  - Extracting validation logic from API routes into utilities.
  - Simplifying overly long functions or React components.
- Code review should ensure:
  - Refactors are **small and incremental**.
  - Tests are run after each step.
  - Behavior is unchanged (existing tests continue to pass).

When proposing a refactor in a review, authors should:

- Clearly state: “This is a refactor only; behavior should not change.”
- Point reviewers to tests that guard the behavior.

---

## Summary Checklist

Use this checklist when reviewing changes in this repository:

- **General**
  - [ ] Do I understand what the change is trying to do?
  - [ ] Is the change small and focused?
  - [ ] Are there accompanying or updated tests?

- **Safe from bugs**
  - [ ] Are edge cases considered (empty inputs, long names, unusual subjects)?
  - [ ] Are errors handled or propagated clearly?
  - [ ] Are types accurate and non-misleading?

- **Easy to understand**
  - [ ] Are names descriptive and consistent with existing code?
  - [ ] Are functions and components of reasonable length?
  - [ ] Are surprising parts commented and explained?

- **Ready for change**
  - [ ] Is logic placed in the right module (`lib`, `ai`, `app/api`)?
  - [ ] Is duplicated code avoided where practical?
  - [ ] Does the change preserve or improve abstraction boundaries?

If you can check most of these boxes, the change is likely in good shape according to the **Code Review** principles from MIT 6.102.

---

## References

- **MIT 6.102 – Reading 3: Code Review**  
  `https://web.mit.edu/6.102/www/sp25/classes/03-code-review/`

- **MIT 6.102 – Testing (for connection to existing docs)**  
  `https://web.mit.edu/6.102/www/sp25/classes/02-testing/`

- **Testing Documentation in This Repo**  
  - `sc_documentation/TESTING_DOCUMENTATION.md`
  - `sc_documentation/TESTING_CHANGES.md`
  - `sc_documentation/TEST_INTEGRATION_SUMMARY.md`

All Code Review material here is aligned with the MIT 6.102 course guidance and adapted to the structure and patterns of this specific project, without changing any existing functionality.


