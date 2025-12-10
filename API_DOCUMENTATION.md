# AI Backend API Documentation

This document describes the AI backend API endpoints for the educational learning platform.

## Setup

1. **Install dependencies** (if not already done):

   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Get your API key from: https://makersuite.google.com/app/apikey

## API Endpoints

All endpoints are located under `/api/` and accept POST requests with JSON bodies.

### 1. Generate Roadmap

**Endpoint:** `POST /api/generate-roadmap`

**Description:** Generates a complete subject roadmap with ordered chapters.

**Request Body:**

```json
{
  "subject": "Linear Algebra"
}
```

**Response:**

```json
{
  "subject": "Linear Algebra",
  "chapters": [
    "Vectors and Operations",
    "Matrices",
    "Determinants",
    "Vector Spaces",
    "Linear Transformations",
    "Eigenvalues and Eigenvectors",
    "Inner Product Spaces",
    "Orthogonality"
  ]
}
```

**Error Response:**

```json
{
  "error": "Error message"
}
```

---

### 2. Generate Notes

**Endpoint:** `POST /api/generate-notes`

**Description:** Generates detailed chapter-wise notes including definitions, concepts, theorems, examples, and summaries.

**Request Body:**

```json
{
  "subject": "Linear Algebra",
  "chapter": "Determinants"
}
```

**Response:**

```json
{
  "chapter": "Determinants",
  "subject": "Linear Algebra",
  "notes": {
    "definitions": [
      {
        "term": "Determinant",
        "definition": "A scalar value that can be computed from the elements of a square matrix..."
      }
    ],
    "concepts": [
      {
        "title": "Properties of Determinants",
        "explanation": "Determinants have several important properties..."
      }
    ],
    "theorems": [
      {
        "name": "Cramer's Rule",
        "statement": "If det(A) ≠ 0, then the system Ax = b has a unique solution...",
        "explanation": "This theorem provides a method for solving linear systems..."
      }
    ],
    "examples": [
      {
        "title": "Calculating a 2x2 Determinant",
        "problem": "Find the determinant of [[a, b], [c, d]]",
        "solution": "det = ad - bc",
        "explanation": "For a 2x2 matrix, the determinant is calculated as..."
      }
    ],
    "summary": "This chapter covered determinants, their properties, and applications..."
  }
}
```

---

### 3. Generate Questions

**Endpoint:** `POST /api/generate-questions`

**Description:** Generates practice questions including MCQs, short questions, and numerical problems with solutions.

**Request Body:**

```json
{
  "subject": "Linear Algebra",
  "chapter": "Determinants"
}
```

**Response:**

```json
{
  "chapter": "Determinants",
  "subject": "Linear Algebra",
  "questions": {
    "mcqs": [
      {
        "id": 1,
        "question": "What is the determinant of a 2x2 identity matrix?",
        "options": {
          "a": "0",
          "b": "1",
          "c": "2",
          "d": "-1"
        },
        "correctAnswer": "b",
        "explanation": "The identity matrix has 1s on the diagonal and 0s elsewhere, so det = 1*1 - 0*0 = 1"
      }
    ],
    "short": [
      {
        "id": 1,
        "question": "Explain the geometric interpretation of a determinant.",
        "answer": "The determinant of a 2x2 matrix represents the signed area of the parallelogram formed by its column vectors..."
      }
    ],
    "numerical": [
      {
        "id": 1,
        "problem": "Calculate the determinant of [[3, 2], [1, 4]]",
        "solution": "det = (3)(4) - (2)(1) = 12 - 2 = 10",
        "answer": "10"
      }
    ]
  }
}
```

---

### 4. Generate Resources

**Endpoint:** `POST /api/generate-resources`

**Description:** Generates a curated list of external learning resources (videos, articles, books) for a subject.

**Request Body:**

```json
{
  "subject": "Linear Algebra"
}
```

**Response:**

```json
{
  "subject": "Linear Algebra",
  "resources": {
    "videos": [
      {
        "title": "Introduction to Linear Algebra",
        "url": "https://www.youtube.com/watch?v=...",
        "description": "Comprehensive introduction to linear algebra concepts",
        "channel": "3Blue1Brown"
      }
    ],
    "articles": [
      {
        "title": "Understanding Vector Spaces",
        "url": "https://example.com/article",
        "description": "Deep dive into vector space theory",
        "source": "Khan Academy"
      }
    ],
    "books": [
      {
        "title": "Introduction to Linear Algebra",
        "author": "Gilbert Strang",
        "description": "Classic textbook on linear algebra",
        "isbn": "978-0980232776",
        "note": "Available on library platforms"
      }
    ]
  }
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing or invalid parameters)
- `500`: Internal Server Error (LLM API errors, parsing errors, etc.)

Error responses follow this format:

```json
{
  "error": "Descriptive error message"
}
```

## Architecture

### Directory Structure

```
/
├── ai/                    # AI generator modules
│   ├── roadmapGenerator.ts
│   ├── notesGenerator.ts
│   ├── questionGenerator.ts
│   └── resourcesGenerator.ts
├── app/
│   └── api/              # Next.js API routes
│       ├── generate-roadmap/
│       ├── generate-notes/
│       ├── generate-questions/
│       └── generate-resources/
├── lib/                   # Utility functions
│   ├── prompt-loader.ts
│   └── llm-client.ts
└── prompts/               # Prompt templates
    ├── roadmap.txt
    ├── notes.txt
    ├── questions.txt
    └── resources.txt
```

### Key Components

1. **Prompt Templates** (`/prompts`): Template files with `{{variable}}` placeholders
2. **LLM Client** (`lib/llm-client.ts`): Handles Google Gemini API calls and JSON parsing
3. **Prompt Loader** (`lib/prompt-loader.ts`): Loads and processes prompt templates
4. **Generators** (`/ai`): Modular functions for each AI capability
5. **API Routes** (`/app/api`): Next.js API route handlers

## Usage Examples

### Using cURL

```bash
# Generate roadmap
curl -X POST http://localhost:3000/api/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{"subject": "Calculus"}'

# Generate notes
curl -X POST http://localhost:3000/api/generate-notes \
  -H "Content-Type: application/json" \
  -d '{"subject": "Calculus", "chapter": "Derivatives"}'
```

### Using JavaScript/TypeScript

```typescript
// Generate roadmap
const response = await fetch("/api/generate-roadmap", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subject: "Calculus" }),
});
const roadmap = await response.json();

// Generate notes
const notesResponse = await fetch("/api/generate-notes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject: "Calculus",
    chapter: "Derivatives",
  }),
});
const notes = await notesResponse.json();
```

## Configuration

The system uses `gemini-1.5-flash` by default for cost efficiency. To change the model, modify the `callLLM` function in `lib/llm-client.ts`. Available models include:

- `gemini-1.5-flash` (default, fast and cost-effective)
- `gemini-1.5-pro` (higher quality, more expensive)
- `gemini-pro` (legacy model)

## Notes

- All responses are guaranteed to be valid JSON
- The LLM is configured to return JSON only (no markdown or prose)
- All inputs are validated before processing
- Error messages are descriptive and helpful for debugging
