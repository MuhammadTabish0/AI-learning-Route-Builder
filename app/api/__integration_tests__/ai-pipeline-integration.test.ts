/**
 * INTEGRATION TESTS: AI Generation Pipeline
 * Covers IT-008, IT-009, IT-010, IT-011
 *
 * Integration scope: Tests how API route handlers wire into AI generator modules
 * (roadmapGenerator, notesGenerator) and how the generate-questions route chains
 * prompt-loader → llm-client → parseJSONResponse together as a pipeline.
 * Only the LLM SDK and filesystem are mocked (true external dependencies).
 */

import { NextRequest } from 'next/server'
import { POST as postRoadmap } from '../generate-roadmap/route'
import { POST as postNotes } from '../generate-notes/route'
import { POST as postQuestions } from '../generate-questions/route'

// ── Mock AI generators (simulate LLM boundary) ────────────────────────────────
jest.mock('@/ai/roadmapGenerator', () => ({
  generateRoadmap: jest.fn(),
}))

jest.mock('@/ai/notesGenerator', () => ({
  generateNotes: jest.fn(),
}))

// For generate-questions: mock the LLM client and prompt loader
// (testing the route → prompt-loader → llm-client → parseJSONResponse chain)
jest.mock('@/lib/prompt-loader', () => ({
  loadPromptTemplate: jest.fn(),
  replaceTemplateVariables: jest.fn(),
}))

jest.mock('@/lib/llm-client', () => ({
  callLLM: jest.fn(),
  parseJSONResponse: jest.fn(),
}))

import { generateRoadmap } from '@/ai/roadmapGenerator'
import { generateNotes } from '@/ai/notesGenerator'
import { loadPromptTemplate, replaceTemplateVariables } from '@/lib/prompt-loader'
import { callLLM, parseJSONResponse } from '@/lib/llm-client'

function makePost(url: string, body: object): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── IT-008 ────────────────────────────────────────────────────────────────────
describe('IT-008: POST /api/generate-roadmap → roadmapGenerator → LLM pipeline', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should pass trimmed subject to generator and return structured roadmap JSON', async () => {
    const mockRoadmap = {
      subject: 'Python Programming',
      chapters: [
        { id: 1, title: 'Basics', description: 'Variables and data types' },
        { id: 2, title: 'Functions', description: 'Defining and calling functions' },
        { id: 3, title: 'OOP', description: 'Object oriented programming' },
      ],
    };
    (generateRoadmap as jest.Mock).mockResolvedValue(mockRoadmap)

    const res = await postRoadmap(
      makePost('http://localhost/api/generate-roadmap', { subject: '  Python Programming  ' })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.subject).toBe('Python Programming')
    expect(json.chapters).toHaveLength(3)
    expect(json.chapters[2].title).toBe('OOP')

    // Verify the generator was called with TRIMMED subject (not the padded input)
    expect(generateRoadmap).toHaveBeenCalledWith('Python Programming')
    expect(generateRoadmap).toHaveBeenCalledTimes(1)
  })

  it('should propagate LLM error as a controlled 500 JSON response', async () => {
    (generateRoadmap as jest.Mock).mockRejectedValue(new Error('Gemini quota exceeded'))

    const res = await postRoadmap(
      makePost('http://localhost/api/generate-roadmap', { subject: 'Python' })
    )
    const json = await res.json()

    // Error from AI module propagates through route as 500
    expect(res.status).toBe(500)
    expect(json.error).toBe('Gemini quota exceeded')
  })
})

// ── IT-009 ────────────────────────────────────────────────────────────────────
describe('IT-009: POST /api/generate-notes → notesGenerator → LLM pipeline', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should pass both subject and chapter to generator and return notes JSON', async () => {
    const mockNotes = {
      chapter: 'Object Oriented Programming',
      sections: [
        { title: 'Classes', content: 'A class is a blueprint...' },
        { title: 'Inheritance', content: 'Inheritance allows...' },
      ],
    };
    (generateNotes as jest.Mock).mockResolvedValue(mockNotes)

    const res = await postNotes(
      makePost('http://localhost/api/generate-notes', {
        subject: 'Python Programming',
        chapter: 'Object Oriented Programming',
      })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.chapter).toBe('Object Oriented Programming')
    expect(json.sections).toHaveLength(2)

    // Verify both arguments were passed to the generator (subject + chapter integration)
    expect(generateNotes).toHaveBeenCalledWith('Python Programming', 'Object Oriented Programming')
  })

  it('should propagate generator error to caller as a 500 JSON response', async () => {
    (generateNotes as jest.Mock).mockRejectedValue(new Error('Token limit exceeded'))

    const res = await postNotes(
      makePost('http://localhost/api/generate-notes', {
        subject: 'Physics',
        chapter: 'Thermodynamics',
      })
    )
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe('Token limit exceeded')
  })
})

// ── IT-010 ────────────────────────────────────────────────────────────────────
describe('IT-010: POST /api/generate-questions → prompt-loader → LLM → parseJSONResponse pipeline', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should chain prompt-loader, LLM call, and JSON parsing together correctly', async () => {
    // Step 1: prompt-loader returns raw template
    const rawTemplate = 'Generate questions for {{COURSE_NAME}}';;
    (loadPromptTemplate as jest.Mock).mockResolvedValue(rawTemplate)

    // Step 2: replaceTemplateVariables injects course name  
    const filledPrompt = 'Generate questions for Machine Learning';
    (replaceTemplateVariables as jest.Mock).mockReturnValue(filledPrompt)

    // Step 3: LLM returns a raw JSON string
    const rawLLMResponse = JSON.stringify({
      questions: [
        { questionId: 'q1', question: 'What is supervised learning?', type: 'single', options: ['A', 'B', 'C', 'D'] },
        { questionId: 'q2', question: 'What is overfitting?', type: 'multiple', options: ['A', 'B'] },
      ],
    });
    (callLLM as jest.Mock).mockResolvedValue(rawLLMResponse)

    // Step 4: parseJSONResponse converts string → JS object
    const parsedData = {
      questions: [
        { questionId: 'q1', question: 'What is supervised learning?', type: 'single', options: ['A', 'B', 'C', 'D'] },
        { questionId: 'q2', question: 'What is overfitting?', type: 'multiple', options: ['A', 'B'] },
      ],
    };
    (parseJSONResponse as jest.Mock).mockReturnValue(parsedData)

    const res = await postQuestions(
      makePost('http://localhost/api/generate-questions', { courseName: 'Machine Learning' })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.questions).toHaveLength(2)
    expect(json.questions[0].questionId).toBe('q1')
    expect(json.questions[1].type).toBe('multiple')

    // Verify all pipeline stages were called in order
    expect(loadPromptTemplate).toHaveBeenCalledWith('custom-course-questions')
    expect(replaceTemplateVariables).toHaveBeenCalledWith(rawTemplate, { COURSE_NAME: 'Machine Learning' })
    expect(callLLM).toHaveBeenCalledWith(filledPrompt, 'gemini-2.5-flash')
    expect(parseJSONResponse).toHaveBeenCalledWith(rawLLMResponse)
  })
})

// ── IT-011 ────────────────────────────────────────────────────────────────────
describe('IT-011: POST /api/generate-questions → prompt-loader file-not-found → controlled 500', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return 500 when prompt template file is missing, before LLM is called', async () => {
    // Simulate missing prompt file
    (loadPromptTemplate as jest.Mock).mockRejectedValue(
      new Error('Failed to load prompt template: custom-course-questions. Error: ENOENT')
    )

    const res = await postQuestions(
      makePost('http://localhost/api/generate-questions', { courseName: 'Data Science' })
    )
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toMatch(/Failed to load prompt template/)

    // LLM should NEVER be called if template loading fails
    expect(callLLM).not.toHaveBeenCalled()
    expect(parseJSONResponse).not.toHaveBeenCalled()
  })
})
