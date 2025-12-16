# Parsing Documentation - MIT 6.102 Software Construction Principles

## Table of Contents

1. [Overview](#overview)
2. [What Is Parsing?](#what-is-parsing)
3. [Parsing in This Project](#parsing-in-this-project)
4. [JSON Parser: parseJSONResponse](#json-parser-parsejsonresponse)
5. [Template Variable Parser: replaceTemplateVariables](#template-variable-parser-replacetemplatevariables)
6. [Abstract Syntax Trees (AST)](#abstract-syntax-trees-ast)
7. [Error Handling Strategies](#error-handling-strategies)
8. [Parser Generators and Grammar Definitions](#parser-generators-and-grammar-definitions)
9. [Parse Tree Traversal](#parse-tree-traversal)
10. [Testing Parsers](#testing-parsers)
11. [Extending Parsing Capabilities](#extending-parsing-capabilities)

---

## Overview

This document explains how the **Parsing** principle from **MIT 6.102: Software Construction** is applied in the AI Learning Route Builder project through JSON parsing and template variable parsing.

### What Was Documented

The project already implements several parsing mechanisms. This documentation:

- ✅ **Explains** how JSON parsing works (lexical analysis, syntax validation, error handling)
- ✅ **Documents** template variable parsing using regex (pattern matching, grammar)
- ✅ **Describes** how TypeScript types serve as Abstract Syntax Tree (AST) definitions
- ✅ **Demonstrates** error handling strategies (truncation detection, graceful degradation)
- ✅ **Shows** how parsing principles ensure reliability and type safety

### No Functionality Changed

**Important:** This is documentation-only. No code was modified. The documentation explains how existing parsing code embodies parsing principles.

---

## What Is Parsing?

**Parsing** is the process of analyzing a sequence of tokens (characters, words, symbols) to determine its grammatical structure according to a formal grammar. Parsing typically involves:

1. **Lexical Analysis (Tokenization)**: Breaking input into tokens
2. **Syntax Analysis**: Building a parse tree according to grammar rules
3. **Semantic Analysis**: Validating meaning and constructing an AST
4. **Error Handling**: Detecting and reporting syntax errors

### Parsing Concepts

- **Parser Generators**: Tools that generate parsers from grammar specifications (e.g., ANTLR, Yacc, Bison)
- **Grammar Definitions**: Formal specifications of language syntax (BNF, EBNF)
- **Parse Trees**: Tree structures representing the syntactic structure of input
- **Abstract Syntax Trees (AST)**: Simplified tree structures focusing on essential syntax
- **Error Handling**: Strategies for detecting, reporting, and recovering from parse errors

### Examples of Parsing

- **JSON Parsers**: Parse JSON strings into JavaScript objects
- **Template Engines**: Parse template syntax (e.g., `{{variable}}`) and replace placeholders
- **Language Compilers**: Parse source code into ASTs
- **Configuration Parsers**: Parse configuration files (YAML, TOML, INI)

In this project, **JSON parsing** and **template variable parsing** demonstrate parsing principles.

---

## Parsing in This Project

### Two Main Parsers

1. **JSON Parser** (`parseJSONResponse` in `lib/llm-client.ts`)
   - Parses LLM responses (JSON strings) into TypeScript objects
   - Handles markdown code blocks, validates structure, detects truncation
   - Returns type-safe results

2. **Template Variable Parser** (`replaceTemplateVariables` in `lib/prompt-loader.ts`)
   - Parses `{{VARIABLE}}` placeholders in template strings
   - Uses regex for pattern matching and replacement
   - Gracefully handles unmatched variables

### Why Parsing Matters

- ✅ **Reliability**: Validates LLM responses before use
- ✅ **Type Safety**: Ensures data structures match specifications
- ✅ **Error Detection**: Catches malformed data early
- ✅ **Maintainability**: Clear separation between parsing and business logic

---

## JSON Parser: parseJSONResponse

### Location

`lib/llm-client.ts` - `parseJSONResponse<T>(response: string): T`

### Grammar (Implicit)

The JSON parser uses JavaScript's built-in `JSON.parse`, which follows the JSON grammar:

```
JSON → Value
Value → Object | Array | String | Number | Boolean | Null
Object → '{' (Pair (',' Pair)*)? '}'
Pair → String ':' Value
Array → '[' (Value (',' Value)*)? ']'
```

### Lexical Analysis

**Step 1: Clean Input**

```typescript
// Remove markdown code blocks if present
let cleaned = response.trim();
if (cleaned.startsWith('```json')) {
  cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
} else if (cleaned.startsWith('```')) {
  cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
}
```

This step:
- **Strips whitespace**: Removes leading/trailing spaces
- **Removes markdown fences**: Handles ` ```json ` and ` ``` ` code blocks
- **Normalizes input**: Prepares string for parsing

### Syntax Validation

**Step 2: Pre-Parse Validation**

```typescript
// Check for unclosed brackets/braces (signs of truncation)
const openBraces = (trimmedCleaned.match(/{/g) || []).length;
const closeBraces = (trimmedCleaned.match(/}/g) || []).length;
const openBrackets = (trimmedCleaned.match(/\[/g) || []).length;
const closeBrackets = (trimmedCleaned.match(/\]/g) || []).length;

if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
  console.warn(`JSON appears incomplete...`);
}
```

This validation:
- **Checks structural integrity**: Ensures balanced braces/brackets
- **Detects truncation**: Warns if JSON appears incomplete
- **Provides diagnostics**: Logs helpful information for debugging

### Parse Tree Construction

**Step 3: Parsing**

```typescript
return JSON.parse(cleaned) as T;
```

- **Builds parse tree**: JavaScript's `JSON.parse` constructs the parse tree
- **Type assertion**: Casts to generic type `T` for type safety
- **Returns AST**: The parsed object serves as the AST

### Error Handling

**Step 4: Error Detection and Reporting**

```typescript
catch (error) {
  // Check if response was truncated
  const isTruncated = response.length > 10000 && (
    !response.trim().endsWith('}') && 
    !response.trim().endsWith(']')
  );
  
  if (isTruncated) {
    throw new Error(`JSON response appears to be truncated...`);
  }
  
  throw new Error(`Failed to parse JSON response: ${errorMessage}...`);
}
```

Error handling includes:
- **Truncation detection**: Identifies incomplete responses
- **Detailed diagnostics**: Logs response preview, length, tail
- **Helpful error messages**: Guides developers to the issue

### Example Usage

```typescript
const response = '{"roadmap": {"course": "Linear Algebra", "chapters": []}}';
const courseData = parseJSONResponse<CourseRoadmapResponse>(response);
// courseData is now a type-safe CourseRoadmapResponse object
```

---

## Template Variable Parser: replaceTemplateVariables

### Location

`lib/prompt-loader.ts` - `replaceTemplateVariables(template: string, variables: Record<string, string>): string`

### Grammar (Implicit)

The template variable syntax follows this grammar:

```
Template → (Text | Variable)*
Variable → '{{' Identifier '}}'
Identifier → [A-Z_][A-Z0-9_]*
Text → Any character except '{'
```

**Example**: `"Hello {{NAME}}, welcome to {{COURSE_NAME}}!"`

### Lexical Analysis

**Pattern Matching with Regex**

```typescript
for (const [key, value] of Object.entries(variables)) {
  const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  result = result.replace(regex, value);
}
```

This step:
- **Tokenizes variables**: Uses regex to find `{{VARIABLE}}` patterns
- **Case-sensitive matching**: Variable names must match exactly
- **Global replacement**: Replaces all occurrences of each variable

### Parse Tree Traversal

**Iterative Replacement**

```typescript
let result = template;
for (const [key, value] of Object.entries(variables)) {
  const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  result = result.replace(regex, value);
}
return result;
```

The traversal:
- **Visits each variable**: Iterates through provided variables
- **Replaces matches**: Substitutes `{{key}}` with `value`
- **Preserves structure**: Leaves unmatched variables unchanged

### Error Handling

**Graceful Degradation**

- **Unmatched variables**: Left unchanged (not an error)
- **Missing values**: Variables without values remain as `{{VARIABLE}}`
- **No exceptions**: Function never throws (always returns a string)

### Example Usage

```typescript
const template = "Generate course for {{COURSE_NAME}}";
const prompt = replaceTemplateVariables(template, {
  COURSE_NAME: "Linear Algebra"
});
// Result: "Generate course for Linear Algebra"
```

---

## Abstract Syntax Trees (AST)

### TypeScript Types as AST Definitions

In this project, **TypeScript interfaces** serve as AST definitions:

```typescript
export interface CourseRoadmapResponse {
  roadmap: CourseRoadmap;
  resources: ChapterResource[];
}

export interface CourseRoadmap {
  course: string;
  chapters: ChapterRoadmap[];
}

export interface ChapterRoadmap {
  chapterNumber: number;
  title: string;
}
```

### AST Construction

When JSON is parsed, it's validated against these types:

```typescript
const response = await callLLM(prompt);
const courseData = parseJSONResponse<CourseRoadmapResponse>(response);
// courseData conforms to CourseRoadmapResponse AST
```

### AST Benefits

- ✅ **Type Safety**: Compile-time checking ensures structure matches AST
- ✅ **Documentation**: Types document expected structure
- ✅ **IDE Support**: Autocomplete and type hints
- ✅ **Refactoring Safety**: Type errors catch breaking changes

### AST Validation

After parsing, the code validates the AST:

```typescript
if (!courseData.roadmap || !courseData.resources) {
  throw new Error('Invalid course structure - missing roadmap or resources');
}

if (!courseData.roadmap.course || !Array.isArray(courseData.roadmap.chapters)) {
  throw new Error('Invalid roadmap structure');
}
```

This ensures the parsed AST matches the specification.

---

## Error Handling Strategies

### 1. **Pre-Parse Validation**

Check for structural issues before parsing:

```typescript
// Check for unbalanced braces/brackets
if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
  console.warn('JSON appears incomplete...');
}
```

### 2. **Truncation Detection**

Detect incomplete responses:

```typescript
const isTruncated = response.length > 10000 && (
  !response.trim().endsWith('}') && 
  !response.trim().endsWith(']')
);
```

### 3. **Detailed Diagnostics**

Provide helpful error messages:

```typescript
console.error('JSON Parse Error:', errorMessage);
console.error('Response preview (first 1000 chars):', responsePreview);
console.error('Full response length:', response.length);
console.error('Last 500 chars:', response.slice(-500));
```

### 4. **Graceful Degradation**

Handle errors without crashing:

```typescript
try {
  const chapterResources = await generateResourcesForChapter(courseName, chapter.title);
  resources.push(chapterResources);
} catch (error) {
  console.warn(`Failed to generate resources for chapter "${chapter.title}":`, error);
  // Add empty resources as fallback
  resources.push({
    chapterTitle: chapter.title,
    textbooks: [],
    freeVideosOrLectures: [],
    articlesOrDocs: [],
  });
}
```

### 5. **Type-Safe Error Messages**

Errors include context:

```typescript
throw new Error(`Failed to parse JSON response: ${errorMessage}. Response length: ${response.length} characters. Preview: ${responsePreview.substring(0, 500)}`);
```

---

## Parser Generators and Grammar Definitions

### Built-in Parsers

This project uses:

1. **JSON.parse** (JavaScript built-in)
   - Generated by JavaScript engine
   - Follows JSON grammar specification (RFC 7159)
   - Handles lexical analysis, syntax analysis, and AST construction

2. **Regex Parser** (JavaScript RegExp)
   - Pattern matching for template variables
   - Implicit grammar: `{{VARIABLE}}` syntax

### Grammar Definitions (Implicit)

**JSON Grammar** (simplified):

```
JSON → Value
Value → Object | Array | String | Number | Boolean | Null
Object → '{' (Pair (',' Pair)*)? '}'
Pair → String ':' Value
Array → '[' (Value (',' Value)*)? ']'
String → '"' (Char)* '"'
```

**Template Variable Grammar**:

```
Template → (Text | Variable)*
Variable → '{{' Identifier '}}'
Identifier → [A-Z_][A-Z0-9_]*
Text → Any character except '{'
```

### Extending with Parser Generators

If more complex parsing is needed, parser generators like **ANTLR** could be used:

**Example ANTLR Grammar** (hypothetical):

```antlr
grammar Template;

template: (text | variable)* EOF;
variable: OPEN_BRACE IDENTIFIER CLOSE_BRACE;
text: TEXT+;

OPEN_BRACE: '{{';
CLOSE_BRACE: '}}';
IDENTIFIER: [A-Z_][A-Z0-9_]*;
TEXT: ~'{'+;
```

This would generate a parser with:
- **Lexer**: Tokenizes input
- **Parser**: Builds parse tree
- **Visitor**: Traverses parse tree

---

## Parse Tree Traversal

### JSON Parse Tree

When `JSON.parse` parses JSON, it constructs a parse tree:

```json
{
  "roadmap": {
    "course": "Linear Algebra",
    "chapters": [
      {"chapterNumber": 1, "title": "Introduction"}
    ]
  }
}
```

**Parse Tree Structure**:
```
Object
├── Pair ("roadmap": ...)
│   └── Value (Object)
│       ├── Pair ("course": "Linear Algebra")
│       └── Pair ("chapters": ...)
│           └── Value (Array)
│               └── Value (Object)
│                   ├── Pair ("chapterNumber": 1)
│                   └── Pair ("title": "Introduction")
```

### Traversal in Code

After parsing, code traverses the AST:

```typescript
// Validate structure (traverses AST)
if (!courseData.roadmap || !courseData.resources) {
  throw new Error('Invalid structure');
}

// Access nested properties (traverses AST)
const chapterCount = courseData.roadmap.chapters.length;

// Iterate over arrays (traverses AST)
for (const chapter of courseData.roadmap.chapters) {
  console.log(chapter.title);
}
```

### Template Variable Traversal

Template variable replacement traverses the template string:

```typescript
// Traverse template string
let result = template;
for (const [key, value] of Object.entries(variables)) {
  // Find all occurrences of {{key}}
  const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  // Replace each occurrence
  result = result.replace(regex, value);
}
```

---

## Testing Parsers

### JSON Parser Tests

Located in `lib/__tests__/llm-client.test.ts`:

**Test Categories**:

1. **Valid JSON Parsing**
   ```typescript
   it('parses simple JSON object', () => {
     const json = '{"key": "value"}';
     const result = parseJSONResponse<{ key: string }>(json);
     expect(result.key).toBe('value');
   });
   ```

2. **Markdown Code Block Handling**
   ```typescript
   it('strips markdown code blocks', () => {
     const markdown = '```json\n{"key": "value"}\n```';
     const result = parseJSONResponse<{ key: string }>(markdown);
     expect(result.key).toBe('value');
   });
   ```

3. **Error Handling**
   ```typescript
   it('throws on invalid JSON', () => {
     const invalid = '{"key": invalid}';
     expect(() => parseJSONResponse(invalid)).toThrow('Failed to parse JSON');
   });
   ```

4. **Truncation Detection**
   ```typescript
   it('detects truncated JSON', () => {
     const truncated = '{"key": "value"'; // Missing closing brace
     expect(() => parseJSONResponse(truncated)).toThrow();
   });
   ```

### Template Parser Tests

Located in `lib/__tests__/prompt-loader.test.ts`:

**Test Categories**:

1. **Variable Replacement**
   ```typescript
   it('replaces single variable', () => {
     const template = 'Hello {{NAME}}';
     const result = replaceTemplateVariables(template, { NAME: 'Alice' });
     expect(result).toBe('Hello Alice');
   });
   ```

2. **Multiple Variables**
   ```typescript
   it('replaces multiple variables', () => {
     const template = '{{A}} and {{B}}';
     const result = replaceTemplateVariables(template, { A: 'X', B: 'Y' });
     expect(result).toBe('X and Y');
   });
   ```

3. **Unmatched Variables**
   ```typescript
   it('leaves unmatched variables unchanged', () => {
     const template = '{{A}} and {{B}}';
     const result = replaceTemplateVariables(template, { A: 'X' });
     expect(result).toBe('X and {{B}}');
   });
   ```

### Running Tests

```bash
npm test lib/__tests__/llm-client.test.ts
npm test lib/__tests__/prompt-loader.test.ts
```

---

## Extending Parsing Capabilities

### Adding New Parsers

**Example: URL Parser**

```typescript
interface ParsedURL {
  protocol: string;
  host: string;
  path: string;
  query?: Record<string, string>;
}

function parseURL(urlString: string): ParsedURL {
  try {
    const url = new URL(urlString);
    return {
      protocol: url.protocol,
      host: url.host,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
    };
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}
```

### Using Parser Generators

For complex grammars, consider parser generators:

**Example with ANTLR** (hypothetical):

1. **Define Grammar** (`CourseGrammar.g4`):
   ```antlr
   grammar CourseGrammar;
   
   course: 'COURSE' name chapters;
   name: STRING;
   chapters: 'CHAPTERS' chapter+;
   chapter: NUMBER STRING;
   ```

2. **Generate Parser**:
   ```bash
   antlr4 CourseGrammar.g4
   ```

3. **Use Generated Parser**:
   ```typescript
   const parser = new CourseGrammarParser(input);
   const tree = parser.course();
   const ast = new CourseASTBuilder().visit(tree);
   ```

### Best Practices

1. **Validate Early**: Check structure before deep parsing
2. **Type Safety**: Use TypeScript types as AST definitions
3. **Error Messages**: Provide detailed, helpful error messages
4. **Graceful Degradation**: Handle errors without crashing
5. **Testing**: Test edge cases, invalid input, truncation

---

## Conclusion

The **Parsing** principles in the AI Learning Route Builder demonstrate:

- ✅ **Reliability**: JSON parsing validates LLM responses
- ✅ **Type Safety**: TypeScript types serve as AST definitions
- ✅ **Error Handling**: Robust detection and reporting of parse errors
- ✅ **Maintainability**: Clear separation between parsing and business logic
- ✅ **Extensibility**: Easy to add new parsers or extend existing ones

Parsing serves as the foundation for reliable data processing, ensuring that external data (LLM responses, templates) is validated and type-safe before use.

---

## References

- **MIT 6.102 Software Construction**: [Course Website](https://web.mit.edu/6.102/www/sp25/)
- **Parsing Reading**: Parser Generators, ANTLR, Parse Trees, ASTs
- **Project Files**:
  - `lib/llm-client.ts` - JSON parser
  - `lib/prompt-loader.ts` - Template variable parser
  - `lib/__tests__/llm-client.test.ts` - JSON parser tests
  - `lib/__tests__/prompt-loader.test.ts` - Template parser tests

