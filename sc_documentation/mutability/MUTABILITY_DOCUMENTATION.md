# Mutability Documentation - MIT 6.102 Software Construction Principles

## Table of Contents

1. [Overview](#overview)
2. [Risks of Mutation](#risks-of-mutation)
3. [Mutations and Contracts](#mutations-and-contracts)
4. [Why This Matters for This Project](#why-this-matters-for-this-project)
5. [Practical Guidelines & Patterns Applied Here](#practical-guidelines--patterns-applied-here)
6. [Examples from This Repository](#examples-from-this-repository)
7. [Testing and Review Recommendations](#testing-and-review-recommendations)
8. [Summary Checklist](#summary-checklist)
9. [References](#references)

---

## Overview

This document explains the principle of **Mutability** (MIT 6.102) and how the project applies rules and contracts to manage mutations safely.

Mutability is about whether program state may be changed after creation. While mutation is useful and sometimes necessary (e.g., caching, incremental updates), uncontrolled mutation is a frequent source of bugs, surprising behavior, and hard-to-debug state coupling. The guidance below describes the risks, the concept of _mutations and contracts_, and project-specific recommendations to keep mutations safe and local.

### What Was Documented

- ✅ Explanation of risks introduced by mutable state.
- ✅ Definition and examples of _mutation contracts_ (preconditions, postconditions, ownership).
- ✅ Project-specific guidance: where mutation is acceptable, how to make mutations explicit, and idiomatic TypeScript patterns to enforce immutability.
- ✅ Concrete examples from the codebase and recommended code-review/test checks.

### No Functionality Changed

**Important:** This is documentation-only. No code in `app/`, `ai/`, `lib/`, `components/`, or `data/` was modified.

---

## Risks of Mutation

Common hazards when mutable state is used without discipline:

- **Hidden side-effects**: Functions that mutate shared objects cause callers' state to change unexpectedly.
- **Aliasing bugs**: Multiple references to the same mutable object lead to surprising cross-module interference.
- **Temporal coupling**: Correct behavior depends on operations occurring in a particular order.
- **Concurrency hazards**: Even in single-threaded Node/Next.js apps, async flows and callbacks can interleave mutations in unexpected ways.
- **Testing difficulty**: Tests that rely on global mutable state are brittle and order-dependent.
- **API contract violations**: Consumers assume immutability and are broken when implementers mutate inputs.

In short: prefer explicit, local, and well-documented mutations. Where mutation is necessary, make contracts clear and enforce them with types, tests, and review checks.

---

## Mutations and Contracts

We treat mutations like an operation with a contract. A mutation contract clearly documents:

- **Ownership**: Who may mutate the object? (module-local, caller-owned, single writer)
- **Preconditions**: What must be true before mutation (non-null, valid shape, not frozen)?
- **Postconditions**: What does the mutation guarantee after running (invariants preserved, fields updated)?
- **Scope**: Is mutation visible outside the module or contained?

Patterns to express mutation contracts:

- **Immutable inputs**: Treat function parameters as read-only. Use `Readonly<T>` or `readonly` arrays/tuples in TypeScript where possible.
- **Return new objects**: Prefer returning a new object rather than mutating an input, e.g., `const next = { ...prev, x: newVal }`.
- **Ownership transfer**: If a function must mutate, document that it takes ownership and callers must not reuse the object afterward.
- **Explicit mutator APIs**: Provide clearly-named mutator methods (`updateCache(...)`, `mutateUserProfile(...)`) rather than in-place helpers hidden among utility functions.
- **Contracts in tests**: Write tests that assert both preconditions (inputs unchanged unless ownership transferred) and postconditions (expected state after mutation).

TypeScript tools that help enforce mutation contracts:

- `readonly` properties and `Readonly<T>`.
- `as const` and frozen literals for configuration constants.
- Using `Object.freeze()` for small constant objects at module init.

---

## Why This Matters for This Project

The AI Learning Route Builder includes several areas where mutation risks are relevant:

- `ai/*Generator.ts` modules: produce data structures (roadmaps, chapters, question sets). Prefer returning fresh objects rather than mutating shared templates.
- `lib/prompt-loader.ts`: templates and variable replacement — be careful not to mutate shared prompt templates or global cache objects unexpectedly.
- `lib/llm-client.ts`: parsing and caching LLM responses — avoid mutating cached responses in-place; prefer storing immutable snapshots or shallow copies.
- `app/api/*/route.ts`: request handlers — avoid in-place mutation of request bodies or shared global caches without clear contracts.
- `data/*.json`: static JSON files in `data/` should be treated as immutable sources of truth; if an in-memory cache mutates them, clone first.

Mutability mistakes in these areas can cause mistaken prompt reuse, corrupted cached responses, or surprising API behavior across requests.

---

## Practical Guidelines & Patterns Applied Here

1. **Make inputs readonly by default**

   - Use `Readonly<T>` or `readonly` arrays in exported function signatures where callers should not mutate the argument.
   - Example pattern:

   ```ts
   export function generateRoadmap(input: Readonly<CourseSpec>): CourseRoadmap { ... }
   ```

2. **Return new objects (functional updates)**

   - Prefer `map`, `filter`, and array/object spread over `push`, `splice`, or mutating loops.
   - Example: `return [...oldChapters, newChapter]` instead of `oldChapters.push(newChapter)`.

3. **Document ownership when mutation is unavoidable**

   - If a function mutates an object, name it to make that explicit (e.g., `mutateCacheEntry`, `applyInPlacePatch`) and document that the caller must not reuse the object after calling.

4. **Avoid mutating imported constants**

   - Treat JSON in `data/` and exported constants as read-only; if modifications are required, copy before mutating.

5. **Use shallow or deep copy defensively**

   - For objects that may contain nested structures from LLM responses, create defensive clones before modifying:

   ```ts
   const copy = structuredClone(original); // if available, otherwise JSON or deep-copy helper
   copy.meta.updatedAt = Date.now();
   ```

6. **Prefer small, explicit caches with clear invalidation**

   - If caching LLM results, keep cached values immutable; update the cache by replacing entries rather than mutating cached objects.

7. **Use TypeScript's readonly for arrays and tuples**

   - `readonly string[]` and `ReadonlyArray<T>` make accidental mutation compile-time errors.

8. **Leverage `Object.freeze()` for small config objects**

   - Freezing prevents accidental accidental runtime mutation during development.

---

## Examples from This Repository

These examples illustrate where to apply the guidelines above.

- `ai/fullCourseGenerator.ts` and other generators

  - Recommendation: generator functions should construct and return new objects representing the course/chapters/resources. Avoid mutating shared argument objects or global templates.

- `lib/prompt-loader.ts`

  - `replaceTemplateVariables` should never mutate the source prompt on disk; always operate on a string copy and cache processed results as new values.

- `lib/llm-client.ts`

  - `parseJSONResponse` returns parsed objects — treat the returned object as an immutable snapshot. If you must enrich it for downstream use, clone before adding internal-only fields.

- `app/api/*/route.ts`

  - Request handlers must not mutate `req.body` in place — if transformations are required, create a new object used for downstream processing.

- `data/*.json`
  - Load static JSON as constants and never write back to the same in-memory object; any editing functionality should explicitly create and persist new objects instead.

### Example: Safe update of cached roadmap

Bad (mutates cached object):

```ts
// bad: modifies cached object in place
const cached = cache.get(courseId);
cached.chapters.push(newChapter);
cache.set(courseId, cached);
```

Good (replaces cached object atomically):

```ts
const cached = cache.get(courseId) ?? { chapters: [] };
const next = { ...cached, chapters: [...cached.chapters, newChapter] };
cache.set(courseId, next);
```

---

## Testing and Review Recommendations

To ensure mutations remain safe, follow these practices in tests and reviews:

- **Test that inputs are not mutated**: In unit tests, keep a copy of the input and assert it is unchanged after calling functions that should be pure.

- **Add property-based or fuzz tests** for generator functions to detect unexpected in-place changes.

- **Review checklist items**:

  - Does the function mutate any input? If so, is ownership transferred and documented?
  - Are arrays mutated in-place (`push`, `splice`) where they should be replaced?
  - Are cached objects replaced rather than mutated?
  - Are `readonly`/`Readonly<T>` used where appropriate?

- **CI checks**: Consider lint rules (ESLint plugin rules) that flag common mutation patterns (no-array-mutating-methods, prefer-immutable-operations) or TypeScript `noImplicitAny` and strictness rules to reduce mutation bugs.

---

## Summary Checklist

- [ ] Treat imported JSON/config as immutable.
- [ ] Prefer returning new objects over in-place mutation.
- [ ] Use `readonly` and `Readonly<T>` in public APIs.
- [ ] Document ownership transfer when a function mutates an argument.
- [ ] Replace cache entries instead of mutating them in-place.
- [ ] Add tests asserting inputs remain unchanged where appropriate.
- [ ] Use `Object.freeze()` for small configuration constants.

---

## References

- MIT 6.102: Lectures and readings on Mutability/Immutability
- TypeScript docs: `readonly`, `Readonly<T>`, `as const`
- MDN: `Object.freeze()` and cloning patterns
