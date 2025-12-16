# Little Languages Integration - MIT 6.102 Software Construction Principles

## Quick Summary

This document gives a **short overview** of how the **Little Languages** principle from **MIT 6.102** has been integrated into the AI Learning Route Builder project.  
For the full guide, see [`LITTLE_LANGUAGES_DOCUMENTATION.md`](./LITTLE_LANGUAGES_DOCUMENTATION.md).

---

## What Was Added

### 1. Documentation Files

- ✅ `sc_documentation/little_languages/LITTLE_LANGUAGES_DOCUMENTATION.md`  
  Comprehensive guide on how the prompt template system functions as a Domain-Specific Language (DSL), based on:

  - **Little Languages** concept from MIT 6.102 Software Construction
  - The existing prompt template infrastructure in `prompts/` and `lib/prompt-loader.ts`
  - How DSLs improve maintainability and expressiveness

- ✅ `sc_documentation/little_languages/LITTLE_LANGUAGES_CHANGES.md`  
  This quick reference file summarizing what was documented.

### 2. No Runtime Code Changes

- ⚠️ **Important**: This integration is **documentation-only**:
  - No files in `app/`, `ai/`, `lib/`, `components/`, or `prompts/` were modified.
  - No behavior, APIs, or functionality were changed.
  - The principle is integrated by **documenting how the existing prompt template system functions as a DSL**, demonstrating the concept in practice.

---

## MIT 6.102 Principle: Little Languages

The integration follows the concept of **Domain-Specific Languages (DSLs)** or "little languages" from Software Construction:

- **Expressiveness**: Specialized syntax for a specific domain (course generation)
- **Abstraction**: High-level constructs that hide implementation complexity
- **Maintainability**: Changes to generation logic isolated to template files
- **Reusability**: Templates can be composed and reused across different contexts

These principles are explicitly demonstrated in the prompt template system, where:

- Templates use `{{VARIABLE}}` syntax for placeholders
- Templates define structured instructions and JSON schemas
- The `prompt-loader.ts` module acts as the DSL interpreter
- Templates are declarative and separate from execution logic

---

## How Little Languages Are Applied in This Project

High-level integration points (described in detail in `LITTLE_LANGUAGES_DOCUMENTATION.md`):

1. **Prompt Template DSL**

   - Syntax: `{{VARIABLE}}` placeholders for dynamic content
   - Semantics: Structured instructions for LLM course generation
   - Interpreter: `lib/prompt-loader.ts` (loads and processes templates)
   - Examples: `roadmap-only.txt`, `custom-course-generation.txt`, `resources-only.txt`

2. **Template Variable System**

   - Variable replacement: `replaceTemplateVariables()` function
   - Type safety: Variables passed as `Record<string, string>`
   - Usage: Templates instantiated with course-specific data

3. **Structured Output Schema**

   - JSON schema definitions embedded in templates
   - Type-safe interfaces in TypeScript (`CourseRoadmapResponse`, etc.)
   - Validation ensures output matches expected structure

4. **Template Composition**
   - Multiple specialized templates for different generation tasks
   - Templates can reference shared patterns and structures
   - Easy to extend with new templates without code changes

This demonstrates how a **little language** (the prompt template DSL) provides a clean separation between:

- **What** to generate (defined in templates)
- **How** to generate it (handled by LLM and processing code)
- **When** to use which template (determined by application logic)

---

## Files Touched

### Files Created

- `sc_documentation/little_languages/LITTLE_LANGUAGES_DOCUMENTATION.md`  
  – Detailed guide to Little Languages in this project.

- `sc_documentation/little_languages/LITTLE_LANGUAGES_CHANGES.md`  
  – This quick summary.

### Files Modified

- None of the application, library, or prompt template files were modified.

---

## Relationship to Other Software Construction Principles

The **Little Languages** principle complements other SC principles in this project:

- **Specifications**: Templates serve as executable specifications for course generation
- **Testing**: Template loading and variable replacement are unit tested (`lib/__tests__/prompt-loader.test.ts`)
- **Code Review**: Templates are reviewed for clarity, correctness, and maintainability
- **Abstraction**: Templates abstract away LLM prompt engineering complexity

Together they demonstrate multiple Software Construction principles working together in a single project, with the prompt template DSL serving as a practical example of how little languages improve code organization and maintainability.

---

## Next Steps for a Reviewer or Instructor

- To understand the full Little Languages implementation:
  - Read [`LITTLE_LANGUAGES_DOCUMENTATION.md`](./LITTLE_LANGUAGES_DOCUMENTATION.md).
- To see how templates are used:
  - Examine `prompts/*.txt` files
  - Review `lib/prompt-loader.ts` (the DSL interpreter)
  - Check `ai/fullCourseGenerator.ts` and `app/api/generate-*/route.ts` (template usage)
- To see how it's tested:
  - Review `lib/__tests__/prompt-loader.test.ts`

No additional setup is required: this integration documents an existing pattern in the codebase, demonstrating how **Little Languages** improve expressiveness and maintainability in practice.
