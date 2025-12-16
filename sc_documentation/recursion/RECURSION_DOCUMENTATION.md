# Recursion Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Choosing the Right Recursive Subproblem](#choosing-the-right-recursive-subproblem)
3. [Structure of Recursive Implementations](#structure-of-recursive-implementations)
4. [Common Mistakes in Recursive Implementations](#common-mistakes-in-recursive-implementations)
5. [Recursive Data Types](#recursive-data-types)
6. [Regular Expressions & Grammars (Relation to Recursion)](#regular-expressions--grammars-relation-to-recursion)
7. [Why This Matters for This Project](#why-this-matters-for-this-project)
8. [Examples & Patterns Applied Here](#examples--patterns-applied-here)
9. [Testing and Review Recommendations](#testing-and-review-recommendations)
10. [Summary Checklist](#summary-checklist)
11. [References](#references)

---

## Overview

Recursion is a foundational technique where a function solves a problem by calling itself on smaller subproblems. Used correctly, recursion produces clear, correct, and often elegant solutions for tree-like data, grammars, and divide-and-conquer algorithms. This document describes how to choose subproblems, structure recursive code, common pitfalls, recursive data types, and the relation between recursion and grammars — with advice tailored to the AI Learning Route Builder.

---

## Choosing the Right Recursive Subproblem

Good recursive design starts with identifying a smaller, similar subproblem and a base case.

- **Find the natural decomposition**: Look for data that is naturally smaller (one fewer chapter, one fewer token, a subtree). Example: process chapters one-by-one, or traverse nested chapter structures.
- **Make progress explicit**: Each recursive call must operate on strictly smaller input (length, depth, or an index) to guarantee termination.
- **Minimize shared state**: Prefer passing explicit parameters rather than depending on mutable globals.
- **Tailor the subproblem to the result**: If building an aggregated result, return the partial result from each call rather than mutating a shared accumulator unless ownership is clear.

Example subproblems in this project:

- Generate content per chapter (subproblem = single chapter).
- Walk nested outline structures (subproblem = node and its remaining children).

---

## Structure of Recursive Implementations

Follow a clear shape for recursive functions:

1. **Base case(s)** — handle smallest inputs directly (empty list, leaf node).
2. **Recursive case** — reduce the problem and combine results.
3. **Combine step** — merge recursive results into the final answer.

Pattern (pseudo-TS):

```ts
function process(xs: T[]): R {
  if (xs.length === 0) return baseResult;
  const [head, ...tail] = xs;
  const headResult = handleSingle(head);
  const tailResult = process(tail);
  return combine(headResult, tailResult);
}
```

Prefer returning values over mutating shared accumulators. If using an accumulator, clearly document ownership and consider turning the accumulator into an explicit parameter (`process(xs, acc)`).

---

## Common Mistakes in Recursive Implementations

- **Missing or incorrect base case** — leads to infinite recursion or runtime errors.
- **Non-decreasing recursion** — failing to reduce the input size
- **Unbounded depth (stack safety)** — deep recursion may overflow the call stack; consider iterative alternatives or tail recursion optimizations (where JavaScript engines support them poorly).
- **Excessive recomputation** — naive recursion can recompute the same subproblem many times; use memoization when needed.
- **Implicit mutation across calls** — mutating shared data from recursive calls causes subtle bugs (see `Mutability` guidance).
- **Not thinking about complexity** — exponential algorithms (e.g., naive Fibonacci) should be rewritten with memoization or iterative DP.

---

## Recursive Data Types

Recursive algorithms often operate on recursive data types. Document and use clear TypeScript types:

```ts
type Chapter = { title: string; children?: Chapter[] };

function flatten(ch: Chapter): FlatChapter[] { ... }
```

Using explicit recursive types helps reasoning about termination and correctness.

---

## Regular Expressions & Grammars (Relation to Recursion)

- **Regular expressions** capture regular languages and are not truly recursive; they are implemented with finite-state machinery.
- **Context-free grammars** are naturally recursive (a production can reference itself); parsing such grammars typically requires recursive descent or parser generators.
- For template parsing or LLM output parsing, prefer small recursive-descent parsers when grammar is hierarchical (e.g., nested lists or bracketed structures) and use regex for flat token replacement only.

Example: parsing nested bullet lists in LLM output often requires recursion to reconstruct a tree of items.

---

## Why This Matters for This Project

Recursion appears in several places:

- **Generators (`ai/*Generator.ts`)**: transforming nested course outlines or composing chapter content.
- **Parsing LLM outputs**: reconstructing nested structures returned by the model.
- **Template handling**: generating repeated sections (iterate chapters recursively).

Bad recursion usage could cause slow generation, stack overflows on deeply nested outlines, or subtle correctness issues when combined with mutation.

---

## Examples & Patterns Applied Here

1. **Tree traversal (outline flattening)**

   - Use recursion to traverse `Chapter.children` and return a new flattened array. Avoid pushing into a shared array; instead, concatenate returned arrays.

   ```ts
   function flatten(ch: Chapter): FlatChapter[] {
     const self = [toFlat(ch)];
     const children = (ch.children ?? []).flatMap(flatten);
     return [...self, ...children];
   }
   ```

2. **Memoization for expensive subproblems**

   - When generators compute the same subtree repeatedly, memoize by input key to avoid exponential work.

3. **Safe parsing of nested LLM responses**

   - Parse hierarchical responses with a small recursive-descent function that validates base cases and reports helpful parse errors.

4. **Avoid deep recursion where outlines may be unbounded**

   - If outlines can be extremely deep (user-supplied), convert to an explicit stack-based traversal.

---

## Testing and Review Recommendations

- **Unit tests for base and typical recursive cases**: include empty, singleton, and several-level nested inputs.
- **Property tests**: check invariants (e.g., flatten followed by reconstruct yields equivalent structure) when feasible.
- **Edge-case tests for deep structures**: ensure functions either handle depth or fail gracefully with meaningful errors.
- **Review checklist**:
  - Is there a clear base case?
  - Does the recursion reduce the problem size?
  - Is mutation avoided across recursive calls?
  - Is memoization used where recomputation is likely?

---

## Summary Checklist

- [ ] Identify a natural subproblem and base case.
- [ ] Ensure each recursive call makes measurable progress.
- [ ] Prefer returning new values; avoid shared mutable accumulators.
- [ ] Add memoization for repeated subproblems.
- [ ] Replace deep recursion with iterative approaches for unbounded depth.
- [ ] Test base, typical, and deep cases.

---

## References

- MIT 6.102: Recursion and recursive data structures
- Sedgewick & Wayne: Recursion patterns
- Parser design: recursive-descent parsing basics
