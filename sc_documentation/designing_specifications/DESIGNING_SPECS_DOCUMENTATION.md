# Designing Specifications - MIT 6.102 Reading 5 Integration

## Table of Contents

1. [Overview](#overview)
2. [Deterministic vs. Underdetermined Specifications](#deterministic-vs-underdetermined-specifications)
3. [Declarative vs. Operational Specifications](#declarative-vs-operational-specifications)
4. [Stronger vs. Weaker Specs](#stronger-vs-weaker-specs)
5. [Designing Specs for Different Contexts](#designing-specs-for-different-contexts)
6. [Examples from This Codebase](#examples-from-this-codebase)
7. [Guidelines for New Specs in This Project](#guidelines-for-new-specs-in-this-project)
8. [Summary](#summary)
9. [References](#references)

---

## Overview

This document explains how **MIT 6.102 Reading 5: Designing Specifications**  
([link](https://web.mit.edu/6.102/www/sp25/classes/05-designing-specs/))  
is applied in the **AI Learning Route Builder** project.

The earlier document [`SPECIFICATIONS_DOCUMENTATION.md`](./SPECIFICATIONS_DOCUMENTATION.md) focuses on:

- **What** specifications are (preconditions, postconditions, module specs).
- How specs are expressed in this TypeScript codebase (types, JSDoc, tests).

This document builds on that by focusing on **how we design good specifications** along three axes highlighted in Reading 5:

- **Deterministic vs. underdetermined** specs.
- **Declarative vs. operational** specs.
- **Stronger vs. weaker** specs.

Throughout, the goal is to keep the software:

- **Safe from bugs** – specs that are coherent and non-contradictory.
- **Easy to understand** – concise, declarative contracts.
- **Ready for change** – specs that leave room for implementation evolution.

All of the integration here is **documentation-only** and does **not** change any runtime behavior.

---

## Deterministic vs. Underdetermined Specifications

Reading 5 distinguishes:

- **Deterministic specs** – for each legal input, exactly one allowed output.
- **Underdetermined specs** – for some legal inputs, multiple outputs are allowed.

In this project:

- Some functions are deliberately **deterministic**, e.g.:
  - Utility helpers like `cn` in `lib/utils.ts`:
    - Given a particular set of `ClassValue` inputs and the same `clsx`/`twMerge` implementations, the output class string is uniquely determined.
- Some higher-level behaviors are intentionally **underdetermined**, especially around AI output:
  - Generators in `ai/*.ts` (roadmap, notes, questions, resources) specify:
    - The **shape** of the result (e.g., fields present, types, and invariants like “chapters is an array of chapter-like objects”),
    - But not the **exact wording** or number of items produced by the LLM.

This follows Reading 5’s guidance:

- We allow **implementation freedom** where it does not harm clients, e.g.:
  - Any roadmap that satisfies the structural spec is acceptable.
- We keep specs **deterministic where predictability matters**, e.g.:
  - API routes must always use the same status codes for the same situations.
  - JSON parsing helpers must either succeed with a well-typed result or throw an error with clear conditions.

By being explicit about which parts of a spec are deterministic (structure, types) and which are underdetermined (natural language content, exact counts), we avoid misleading clients into over-constraining their expectations.

---

## Declarative vs. Operational Specifications

Reading 5 strongly prefers **declarative** specifications over **operational** ones:

- **Declarative**: describe *what* is true of the result, not *how* it is computed.
- **Operational**: describe intermediate algorithm steps.

In this project, we design specs to be **primarily declarative**:

- JSDoc comments for key functions (e.g., `callLLM`, `parseJSONResponse`, `generateRoadmap`) describe:
  - Preconditions (legal inputs),
  - Postconditions (shape and properties of outputs),
  - When and why errors are thrown,
  - Without freezing a particular algorithm.
- For example:
  - The spec for `parseJSONResponse` describes:
    - That markdown fences are removed if present,
    - That it attempts to parse JSON and throws on failure,
    - But it does **not** promise a particular logging strategy or internal helper order.

Implications:

- **Clients** depend only on *visible* behavior (types, thrown errors), not internal control flow.
- **Implementers** are free to:
  - Change retry strategies,
  - Adjust prompt templates,
  - Optimize parsing logic,
  - As long as the high-level declarative contract remains satisfied.

This matches Reading 5’s advice to avoid implementing the code “in the spec text” and instead use specs as an abstract contract.

---

## Stronger vs. Weaker Specs

Reading 5 defines **strength** of specs in terms of:

- **Preconditions**: weaker preconditions admit *more* legal inputs.
- **Postconditions**: stronger postconditions guarantee *more* about the result.

### How This Applies Here

- For **library-like helpers** (e.g., `cn`, `parseJSONResponse`):
  - We try to keep **preconditions relatively weak**:
    - `cn` allows any arguments accepted by `clsx`.
    - `parseJSONResponse` allows any string that *might* contain JSON (possibly wrapped in markdown fences).
  - We keep **postconditions strong**:
    - Either a correctly typed return value or a clearly documented error.
- For **AI generators** (`ai/*.ts`) and API routes:
  - We accept that some aspects are inherently underdetermined, so:
    - Postconditions are strong about **structure** (e.g., fields must exist, must be arrays of a certain shape),
    - But intentionally weaker about **deep semantic content** (exact questions, wording).

This tradeoff aligns with the “Ready for change” goal:

- We avoid preconditions that are stronger than necessary (e.g., we typically do not require that subjects be from a predefined fixed set).
- We avoid postconditions that pin down incidental details (e.g., exact phrasing from the LLM) that might change as prompts evolve.

---

## Designing Specs for Different Contexts

Reading 5 discusses context:

- **Helper functions** – private to a module.
- **Exported functions** – visible within the project.
- **Library functions** – used by many clients across projects.
- **Standards** – many clients *and* many independent implementations.

Mapping to this project:

- **Helper functions** (private, internal):
  - Example: `retryWithBackoff` in `lib/llm-client.ts`.
  - Specs can assume more about their environment (e.g., how errors are shaped) because they are only used internally.
  - We document them briefly but expect fewer external clients.
- **Exported functions** within the repo:
  - Examples:
    - `callLLM`, `parseJSONResponse` in `lib/llm-client.ts`.
    - `generateRoadmap` and other generators in `ai/*.ts`.
  - Specs are written to be stable contracts because multiple modules (and tests) call them.
- **API route handlers** (`app/api/*/route.ts`):
  - Act like a small **library** for frontend pages and external clients.
  - Their specs are expressed via:
    - HTTP method + path,
    - Request body/query schema,
    - Response types and status codes,
    - Explicit error conditions.
- **External standards**:
  - This project **consumes**, rather than defines, standards (e.g., HTTP, JSON, Supabase API, Google Gemini API).
  - Our specs reference those external standards where appropriate (e.g., JSON response formats, HTTP status semantics).

Design decisions for spec strength and determinism depend on this context:

- Internal helpers may rely on stronger assumptions (because fewer clients).
- Public API endpoints and library-like utilities must keep preconditions weaker and contracts stable to avoid breaking callers.

---

## Examples from This Codebase

This section ties specific Reading 5 ideas to concrete functions and modules.

### 1. `cn` in `lib/utils.ts` – Deterministic, Declarative, Strong Postcondition

- **Determinism**:
  - For a fixed set of arguments and fixed `clsx`/`twMerge` versions, `cn` always produces the same merged class string.
- **Declarative spec**:
  - The JSDoc describes:
    - That it combines class names,
    - Filters falsey values,
    - Merges Tailwind conflicts in favor of later classes,
    - Without describing the internal loop/algorithm.
- **Strength**:
  - Precondition: any `ClassValue` allowed by `clsx` (relatively weak).
  - Postcondition: guarantees a merged class string with no mutations (strong).

This matches Reading 5’s recommendation for a small, deterministic utility: strong, declarative spec; simple to test and reason about.

### 2. `parseJSONResponse` in `lib/llm-client.ts` – Safety over Underlying Nondeterminism

- **Context**:
  - The LLM is inherently nondeterministic.
  - However, `parseJSONResponse` is a **deterministic** function of its input string.
- **Specification choices**:
  - Declaratively describes:
    - How markdown fences are treated,
    - That it either returns parsed JSON or throws an error with diagnostics,
    - That it warns about likely truncation.
  - Does **not** commit to a particular logging format or exact error message text beyond the key conditions.
- **Strength**:
  - Precondition: “string that is expected to contain JSON” – relatively weak.
  - Postcondition: either a well-typed value of `T` or a thrown `Error` that signals parsing/truncation issues.

The spec is **designed** so many internal strategies (e.g., more heuristics, different logging) could be substituted later without breaking clients.

### 3. `generateRoadmap` and Other `ai/*.ts` Generators – Underdetermined but Structured

- **Underdetermined aspects**:
  - Number of chapters, titles, descriptions, question phrasings are not fixed.
  - Multiple valid outputs exist for the same subject, and that is **intentional**.
- **Deterministic aspects**:
  - The function must:
    - Return an object of the right **shape** (subject, `chapters` array, etc.).
    - Satisfy invariants like “chapters is an array of chapter-like objects.”
    - Throw clear errors when prompt loading or parsing fails.
- **Declarative spec**:
  - Describes required structure and error behavior, *not* token-by-token content of the LLM output.

This is a textbook example of **under\-determined** specs from Reading 5: many implementations (or LLM prompt variants) are acceptable, as long as the declarative structural constraints are met.

### 4. API Routes in `app/api/*/route.ts` – Contract for Clients

- Each route’s spec (implicit in implementation and tests) includes:
  - Allowed HTTP verb and path (e.g., `POST /api/generate-roadmap`).
  - Required body fields (e.g., `subject` must be a non-empty string).
  - Response format and status codes:
    - `200` on success with a structured JSON body.
    - `4xx` on invalid input or authentication issues.
- **Design decisions**:
  - Specs are written to be **declarative** (“returns this JSON shape”) rather than operational (“first we check X, then we query Supabase, then we call the AI, ...”).
  - Precondition strength is chosen carefully:
    - Clients are allowed to send a wide range of valid subjects.
    - The server is responsible for validating minimal structure and returning helpful error responses.

In Reading 5’s terms, these are **exported / library-like** specs: they are stable, declarative, and focus on externally visible behavior only.

---

## Guidelines for New Specs in This Project

When adding or revising specs here, use these Reading 5–inspired guidelines:

- **Be explicit about determinism**:
  - If multiple outputs are acceptable for the same input (e.g., AI-generated content), state that the spec only guarantees structure or certain properties.
  - If a function is meant to be fully deterministic, make sure the spec reflects a single allowed outcome for each legal input.
- **Prefer declarative wording**:
  - Focus on what must be true of inputs and outputs.
  - Avoid encoding the algorithm in the spec unless absolutely necessary.
- **Right-size preconditions and postconditions**:
  - Avoid unnecessarily strong preconditions that make clients’ lives harder.
  - Prefer strong postconditions that give clients useful guarantees.
- **Consider the context**:
  - Internal helpers: can have more specific assumptions but should still be coherent.
  - Exported utilities and API handlers: need stable, well-documented contracts that tolerate refactoring.
- **Design for change**:
  - Avoid promising incidental behavior (ordering, exact wording, logging details) unless clients truly need it.
  - Leave implementation freedom where it doesn’t harm safety or clarity.

These guidelines help keep future specifications aligned with the 6.102 goals: **Safe from bugs**, **Easy to understand**, and **Ready for change**.

---

## Summary

- This document integrates **MIT 6.102 Reading 5: Designing Specifications** into the AI Learning Route Builder project.
- It explains how we:
  - Treat some modules as **deterministic** and others as intentionally **under\-determined**,
  - Emphasize **declarative** specs over operational ones,
  - Choose spec **strength** deliberately based on context,
  - And design specs that support refactoring and evolution of the implementation.
- All changes are **documentation-only** and do not modify any existing behavior.

---

## References

- **MIT 6.102 – Reading 5: Designing Specifications**  
  [https://web.mit.edu/6.102/www/sp25/classes/05-designing-specs/](https://web.mit.edu/6.102/www/sp25/classes/05-designing-specs/)

- **Earlier Specs Documentation in This Repo**  
  - [`SPECIFICATIONS_DOCUMENTATION.md`](./SPECIFICATIONS_DOCUMENTATION.md)  
  - [`SPECIFICATIONS_CHANGES.md`](./SPECIFICATIONS_CHANGES.md)

- **Related 6.102 Principles Already Integrated**  
  - Testing: `sc_documentation/testing/TESTING_DOCUMENTATION.md`  
  - Code Review: `sc_documentation/code_review/CODE_REVIEW_DOCUMENTATION.md`


