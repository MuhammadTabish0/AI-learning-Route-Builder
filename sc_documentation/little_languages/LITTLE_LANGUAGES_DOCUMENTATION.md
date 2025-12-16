# Little Languages Documentation - MIT 6.102 Software Construction Principles

## Table of Contents

1. [Overview](#overview)
2. [What Are Little Languages?](#what-are-little-languages)
3. [Little Languages in This Project](#little-languages-in-this-project)
4. [Prompt Template DSL: Syntax and Semantics](#prompt-template-dsl-syntax-and-semantics)
5. [DSL Interpreter: prompt-loader.ts](#dsl-interpreter-prompt-loaderts)
6. [Template Examples](#template-examples)
7. [Benefits of the DSL Approach](#benefits-of-the-dsl-approach)
8. [Extending the DSL](#extending-the-dsl)
9. [Best Practices](#best-practices)
10. [Testing the DSL](#testing-the-dsl)

---

## Overview

This document explains how the **Little Languages** (Domain-Specific Languages) principle from **MIT 6.102: Software Construction** is applied in the AI Learning Route Builder project through the **Prompt Template System**.

### What Was Documented

The project already implements a Domain-Specific Language (DSL) for course generation through its prompt template system. This documentation:

- ✅ **Explains** how prompt templates function as a DSL
- ✅ **Documents** the syntax (`{{VARIABLE}}` placeholders) and semantics (structured LLM instructions)
- ✅ **Describes** the interpreter (`lib/prompt-loader.ts`)
- ✅ **Demonstrates** benefits: expressiveness, maintainability, separation of concerns
- ✅ **Provides** examples and best practices for extending the DSL

### No Functionality Changed

**Important:** This is documentation-only. No code was modified. The documentation explains how the existing prompt template system embodies the Little Languages principle.

---

## What Are Little Languages?

**Little Languages** (also called **Domain-Specific Languages** or **DSLs**) are specialized programming languages designed for a specific problem domain. Unlike general-purpose languages (like TypeScript or Python), DSLs:

- **Express domain concepts directly**: Syntax matches the problem domain
- **Hide implementation complexity**: Users focus on "what" not "how"
- **Improve maintainability**: Domain logic separated from execution logic
- **Enable non-programmers**: Domain experts can use the language

### Examples of Little Languages

- **SQL**: Language for database queries
- **HTML/CSS**: Languages for web structure and styling
- **Regular Expressions**: Pattern matching language
- **Makefiles**: Build configuration language
- **LaTeX**: Document formatting language

In this project, **prompt templates** function as a DSL for **course generation instructions**.

---

## Little Languages in This Project

### The Prompt Template DSL

The AI Learning Route Builder uses a **Prompt Template DSL** where:

1. **Templates** (`prompts/*.txt`) define structured instructions for LLM course generation
2. **Variables** (`{{VARIABLE}}`) allow dynamic content injection
3. **Interpreter** (`lib/prompt-loader.ts`) loads and processes templates
4. **Output Schema** (JSON structures) ensures consistent results

### Why This Is a Little Language

The prompt template system qualifies as a DSL because:

- ✅ **Domain-Specific**: Designed specifically for course generation, not general-purpose
- ✅ **Declarative Syntax**: Templates describe _what_ to generate, not _how_
- ✅ **Separation of Concerns**: Generation logic (templates) separated from execution (code)
- ✅ **Expressiveness**: Natural language instructions with structured placeholders
- ✅ **Composability**: Multiple templates can be combined for different generation tasks

---

## Prompt Template DSL: Syntax and Semantics

### Syntax: Template Variables

Templates use **double curly braces** for variable placeholders:

```
{{VARIABLE_NAME}}
```

**Rules:**

- Variable names are case-sensitive
- Variables can appear multiple times in a template
- Unmatched variables remain unchanged in output
- Variables are replaced with string values

**Example:**

```text
Generate a course roadmap for {{COURSE_NAME}}.
The student's responses are: {{STUDENT_RESPONSES}}
```

### Semantics: Structured Instructions

Templates define **semantic meaning** through:

1. **Role Definition**: "You are an expert curriculum designer..."
2. **Task Specification**: "Generate a complete course roadmap..."
3. **Output Format**: JSON schema definitions
4. **Constraints**: "Only cite real textbooks..."
5. **Examples**: Sample outputs or formatting

### Template Structure

A typical template follows this structure:

```text
# Title

Role and context definition

## Task

What to generate

## Output Format

{
  "field": "{{VARIABLE}}",
  ...
}

## Rules

Constraints and guidelines
```

---

## DSL Interpreter: prompt-loader.ts

The **interpreter** for the Prompt Template DSL is `lib/prompt-loader.ts`, which provides two key functions:

### 1. `loadPromptTemplate(templateName: string)`

**Purpose**: Loads a template file from the `prompts/` directory.

**Specification**:

- Reads `<cwd>/prompts/${templateName}.txt`
- Returns template content as UTF-8 string
- Throws error if file not found or unreadable

**Example Usage**:

```typescript
const template = await loadPromptTemplate("roadmap-only");
// Loads prompts/roadmap-only.txt
```

### 2. `replaceTemplateVariables(template: string, variables: Record<string, string>)`

**Purpose**: Replaces `{{VARIABLE}}` placeholders with actual values.

**Specification**:

- Replaces all occurrences of `{{key}}` with `variables[key]`
- Uses global regex replacement
- Returns new string (does not mutate input)
- Leaves unmatched variables unchanged

**Example Usage**:

```typescript
const prompt = replaceTemplateVariables(template, {
  COURSE_NAME: "Linear Algebra",
  STUDENT_RESPONSES: "Question 1: Beginner...",
});
```

### Interpreter Pattern

The interpreter follows a classic **template method pattern**:

1. **Load** template from file system
2. **Parse** template (implicitly, as string)
3. **Substitute** variables with actual values
4. **Return** instantiated prompt

This separation allows:

- Templates to be edited without code changes
- Multiple templates to share common patterns
- Easy testing of template loading and substitution

---

## Template Examples

### Example 1: Simple Template (`roadmap-only.txt`)

**Template**:

```text
Generate a course roadmap for {{COURSE_NAME}}.

Output format:
{
  "roadmap": {
    "course": "{{COURSE_NAME}}",
    "chapters": [...]
  }
}
```

**Usage**:

```typescript
const template = await loadPromptTemplate("roadmap-only");
const prompt = replaceTemplateVariables(template, {
  COURSE_NAME: "Data Structures",
});
// Result: "Generate a course roadmap for Data Structures..."
```

### Example 2: Complex Template (`custom-course-generation.txt`)

**Template**:

```text
Generate a personalized course for {{COURSE_NAME}}.

Student responses:
{{STUDENT_RESPONSES}}

Customize based on:
- Knowledge level
- Learning goals
- Topic interests
```

**Usage**:

```typescript
const template = await loadPromptTemplate("custom-course-generation");
const prompt = replaceTemplateVariables(template, {
  COURSE_NAME: "Machine Learning",
  STUDENT_RESPONSES: "Question 1: Intermediate\nQuestion 2: Career focus...",
});
```

### Example 3: Template Composition

Multiple templates can be used together:

```typescript
// Generate roadmap
const roadmapTemplate = await loadPromptTemplate("roadmap-only");
const roadmapPrompt = replaceTemplateVariables(roadmapTemplate, {
  COURSE_NAME: courseName,
});

// Generate resources (uses roadmap output)
const resourcesTemplate = await loadPromptTemplate("resources-only");
const resourcesPrompt = replaceTemplateVariables(resourcesTemplate, {
  COURSE_NAME: courseName,
  CHAPTERS: JSON.stringify(roadmap.chapters),
});
```

---

## Benefits of the DSL Approach

### 1. **Expressiveness**

Templates use natural language to express course generation requirements:

```text
Generate a complete, academically accurate course roadmap
```

This is more readable than equivalent code:

```typescript
// Less expressive alternative
const instruction = `Create ${courseType} for ${subject} with ${chapterCount} chapters...`;
```

### 2. **Maintainability**

Changes to generation logic are isolated to template files:

- **Before DSL**: Prompt strings scattered throughout code
- **After DSL**: All prompts in `prompts/` directory
- **Benefit**: Easy to find, edit, and version control prompts

### 3. **Separation of Concerns**

- **Templates** (`prompts/`): Define _what_ to generate
- **Interpreter** (`lib/prompt-loader.ts`): Handles _how_ to load/process
- **Application** (`app/api/`, `ai/`): Determines _when_ to use which template

### 4. **Reusability**

Templates can be reused across different contexts:

```typescript
// Same template, different courses
const prompt1 = replaceTemplateVariables(template, { COURSE_NAME: "Calculus" });
const prompt2 = replaceTemplateVariables(template, { COURSE_NAME: "Physics" });
```

### 5. **Testability**

Template loading and variable replacement are easily testable:

```typescript
// Test template loading
expect(await loadPromptTemplate("roadmap-only")).toContain("{{COURSE_NAME}}");

// Test variable replacement
const result = replaceTemplateVariables("Hello {{NAME}}", { NAME: "World" });
expect(result).toBe("Hello World");
```

### 6. **Non-Programmer Friendly**

Domain experts (curriculum designers) can edit templates without touching code:

- Templates are plain text files
- Natural language instructions
- No programming knowledge required

---

## Extending the DSL

### Adding a New Template

1. **Create** `prompts/new-template.txt`:

```text
# New Template

Generate {{OUTPUT_TYPE}} for {{COURSE_NAME}}.

Output:
{
  "field": "{{VARIABLE}}"
}
```

2. **Use** in code:

```typescript
const template = await loadPromptTemplate("new-template");
const prompt = replaceTemplateVariables(template, {
  OUTPUT_TYPE: "assessment",
  COURSE_NAME: "Linear Algebra",
  VARIABLE: "value",
});
```

3. **Test** template loading:

```typescript
it("loads new-template", async () => {
  const template = await loadPromptTemplate("new-template");
  expect(template).toContain("{{COURSE_NAME}}");
});
```

### Adding New Variable Types

Currently, all variables are strings. To extend:

1. **Keep simple**: Continue using strings (most flexible)
2. **Add validation**: Validate variable values before substitution
3. **Type system**: Create TypeScript types for template variables

**Example with validation**:

```typescript
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
  validator?: (key: string, value: string) => boolean
): string {
  // Validate before replacement
  if (validator) {
    for (const [key, value] of Object.entries(variables)) {
      if (!validator(key, value)) {
        throw new Error(`Invalid value for ${key}`);
      }
    }
  }
  // ... rest of implementation
}
```

### Template Inheritance/Composition

Templates can reference other templates:

```typescript
// Load base template
const baseTemplate = await loadPromptTemplate("base-instructions");

// Load specific template
const specificTemplate = await loadPromptTemplate("roadmap-only");

// Compose
const composedPrompt = baseTemplate + "\n\n" + specificTemplate;
const finalPrompt = replaceTemplateVariables(composedPrompt, variables);
```

---

## Best Practices

### 1. **Clear Variable Names**

Use descriptive, uppercase variable names:

✅ **Good**:

```text
{{COURSE_NAME}}
{{STUDENT_RESPONSES}}
{{CHAPTER_TITLE}}
```

❌ **Bad**:

```text
{{name}}
{{data}}
{{x}}
```

### 2. **Document Template Purpose**

Include comments in templates:

```text
# Course Roadmap Generator
# Purpose: Generate structured course outline with chapters
# Variables: COURSE_NAME (required)
```

### 3. **Consistent Output Format**

Define JSON schema clearly:

```text
Output format (MANDATORY):
{
  "roadmap": {
    "course": "{{COURSE_NAME}}",
    "chapters": [
      { "chapterNumber": 1, "title": "..." }
    ]
  }
}
```

### 4. **Error Handling**

Handle missing templates gracefully:

```typescript
try {
  const template = await loadPromptTemplate("missing-template");
} catch (error) {
  console.error("Template not found:", error);
  // Fallback or default template
}
```

### 5. **Version Control**

- Keep templates in version control
- Use descriptive commit messages when updating templates
- Consider template versioning if breaking changes needed

### 6. **Testing**

Test both template loading and variable replacement:

```typescript
describe("Template DSL", () => {
  it("loads template successfully", async () => {
    const template = await loadPromptTemplate("roadmap-only");
    expect(template).toBeTruthy();
  });

  it("replaces variables correctly", () => {
    const result = replaceTemplateVariables("Hello {{NAME}}", {
      NAME: "World",
    });
    expect(result).toBe("Hello World");
  });

  it("handles multiple occurrences", () => {
    const result = replaceTemplateVariables("{{VAR}} and {{VAR}}", {
      VAR: "test",
    });
    expect(result).toBe("test and test");
  });
});
```

---

## Testing the DSL

The DSL interpreter is tested in `lib/__tests__/prompt-loader.test.ts`. Key test categories:

### 1. **Template Loading Tests**

- ✅ Loads existing templates
- ✅ Throws error for missing templates
- ✅ Handles file system errors

### 2. **Variable Replacement Tests**

- ✅ Replaces single variable
- ✅ Replaces multiple variables
- ✅ Handles multiple occurrences
- ✅ Leaves unmatched variables unchanged
- ✅ Case-sensitive replacement

### 3. **Integration Tests**

- ✅ Templates work with actual LLM calls
- ✅ Generated prompts produce valid JSON
- ✅ Variable substitution produces correct output

### Running Tests

```bash
npm test lib/__tests__/prompt-loader.test.ts
```

---

## Conclusion

The **Prompt Template DSL** in the AI Learning Route Builder demonstrates how **Little Languages** improve:

- ✅ **Expressiveness**: Natural language templates
- ✅ **Maintainability**: Isolated prompt logic
- ✅ **Separation of Concerns**: Templates vs. code
- ✅ **Testability**: Easy to test loading and substitution
- ✅ **Extensibility**: Easy to add new templates

This DSL follows Software Construction principles by providing a clean abstraction for course generation, making the system more maintainable and easier to extend.

---

## References

- **MIT 6.102 Software Construction**: [Course Website](https://web.mit.edu/6.102/www/sp25/)
- **Little Languages Reading**: Domain-Specific Languages in Software Construction
- **Project Files**:
  - `lib/prompt-loader.ts` - DSL interpreter
  - `prompts/*.txt` - Template files
  - `lib/__tests__/prompt-loader.test.ts` - DSL tests
