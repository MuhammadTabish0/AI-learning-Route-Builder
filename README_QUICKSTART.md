# AI Learning Route Builder — Quick Start & Instructor Cheat Sheet

## Quick Start (developers)

1. One-line summary

- Generates personalized learning roadmaps, chapter notes, quizzes, and curated resources using prompt templates and an LLM backend.

2. Prerequisites

- Node.js (LTS) and a package manager (pnpm recommended)
- Environment variables: `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `APIFY_TOKEN` for web crawling

3. Install

```bash
pnpm install
```

4. Environment

- Create a `.env` at project root with required keys (do not commit it).

Example:

```
GEMINI_API_KEY=your_gemini_key_here
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
# Optional
APIFY_TOKEN=apify_api_...
```

5. Run (development)

```bash
pnpm dev
```

6. Common commands

- Run tests: `pnpm test` (if tests configured)
- Build: `pnpm build`
- Start production: `pnpm start`

7. Generate content (typical flow)

- Prepare or select a prompt template with `{{VARIABLE}}` placeholders.
- Call the generation API or local handler with `courseName` / variables.
- System calls the model, parses returned JSON, validates structure, and persists results.

8. Fail-fast pattern (use in routes)

```ts
const raw = await callLLM(prompt);
const parsed = parseJSONResponse<MyType>(raw); // throws on invalid data
// proceed with business logic
```

## Troubleshooting (common issues)

- Empty model response: verify `GEMINI_API_KEY` and check logs for streaming fallback. Reduce prompt size if truncated.
- JSON parse errors: check logged response preview and consider chunked generation.
- Concurrency / lost updates: prefer idempotent DB ops or transactions (insert on conflict, optimistic locking).

## Security

- Never commit secrets. Use `.env` and environment management. Limit what user data is stored and set appropriate access controls.

---

# Instructor Cheat Sheet (one page)

Key idea: Use templates + LLM to produce consistent JSON-structured learning assets. The system is modular: prompt handling, model call, parsing/validation, persistence.

Quick commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Quick generate (example API): call the generation endpoint with `{ courseName: "Linear Algebra" }`.

Template tips

- Keep templates focused: one output shape per template.
- Ask the model to return strict JSON only to simplify parsing.
- Use placeholders like `{{COURSE_NAME}}` and the provided variable replacement utility.

Quality controls

- Streaming + fallback: the system first tries streaming responses; if empty, it falls back to a non-streaming call.
- Defensive parsing: the parser strips code fences, checks brace/balance, and throws clear diagnostics on errors.
- Incremental save: partial results are saved so progress is not lost during long runs.

When to disable external crawling

- If you cannot use an external crawler or want faster runs, the augmentation step can be disabled; generated resources will still be returned.

Best practices for instructors

- Design prompts that constrain output (explicit JSON schema). Example: request `{"roadmap":{...}}` only.
- Review generated content before publishing; use the API to fetch and display drafts.
- Encourage students to use generated roadmaps as a starting point and supplement with instructor-curated materials.

Contribution & support

- Report issues with logs and the failing prompt example. Include response previews when possible.
- For code changes: follow the project's code-review checklist: small PRs, tests, spec comments, and avoid exported mutable globals.

File locations (developer pointers)

- Prompt helper and variable replacement: prompt loader utility
- LLM calls: model client helper with retry/backoff and streaming
- Parsing: defensive JSON parser that strips fences and warns on truncation

---

If you want, I can add this file to the repository now as `README_QUICKSTART.md` (already created), or also produce a condensed `CHEATSHEET.pdf` for distribution. Which would you like next?
