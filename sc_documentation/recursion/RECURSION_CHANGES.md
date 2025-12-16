# Recursion Integration - MIT 6.102 Software Construction Principles

## Quick Summary

This document summarizes the documentation added for **Recursion** and where the guidance applies in the AI Learning Route Builder project.

### What Was Added

- ✅ `sc_documentation/recursion/RECURSION_DOCUMENTATION.md` — detailed guidance on choosing subproblems, recursive structure, common mistakes, recursive data types, and grammar relations.
- ✅ `sc_documentation/recursion/RECURSION_CHANGES.md` — this quick summary.

### No Code Modified

All additions are documentation-only and confined to `sc_documentation/recursion/`.

---

## Where To Look in The Project

- Generators: `ai/*Generator.ts` — use recursion for nested outlines but prefer safe patterns described.
- Parsing: `lib/llm-client.ts` — use recursive parsers for nested structures returned by the LLM when necessary.
- Template generation: `lib/prompt-loader.ts` and `ai/` modules — prefer functional concatenation over mutating loops.

---

## Recommended Follow-ups

- Add unit tests for recursive utilities (flattening, traversal) including deep-case tests.
- Add memoization helpers for expensive recursive calculations.
