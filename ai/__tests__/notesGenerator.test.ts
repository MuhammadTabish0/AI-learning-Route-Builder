/**
 * Test Suite for notesGenerator.ts
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. PARTITIONING
 *    Input combinations:
 *      - Various subject and chapter combinations
 *      - Edge cases: empty strings, special characters
 *    Response validation:
 *      - Complete structure with all sections
 *      - Missing or invalid sections
 *      - Empty arrays vs populated arrays
 * 
 * 2. BOUNDARY VALUE ANALYSIS
 *    - Empty arrays for each section (definitions, concepts, theorems, examples)
 *    - Large arrays (many items)
 *    - Empty summary string
 * 
 * 3. SPECIFICATION-BASED TESTING
 *    - Tests ensure NotesResponse matches the interface contract
 *    - Validates all required fields are present and correct types
 */

import { generateNotes, NotesResponse } from '../notesGenerator';
import * as promptLoader from '@/lib/prompt-loader';
import * as llmClient from '@/lib/llm-client';

jest.mock('@/lib/prompt-loader');
jest.mock('@/lib/llm-client');

const mockLoadPromptTemplate = promptLoader.loadPromptTemplate as jest.MockedFunction<
  typeof promptLoader.loadPromptTemplate
>;
const mockReplaceTemplateVariables = promptLoader.replaceTemplateVariables as jest.MockedFunction<
  typeof promptLoader.replaceTemplateVariables
>;
const mockCallLLM = llmClient.callLLM as jest.MockedFunction<typeof llmClient.callLLM>;
const mockParseJSONResponse = llmClient.parseJSONResponse as jest.MockedFunction<
  typeof llmClient.parseJSONResponse
>;

describe('notesGenerator module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLoadPromptTemplate.mockResolvedValue('Template for {{subject}} {{chapter}}');
    mockReplaceTemplateVariables.mockReturnValue('Prepared prompt');
    mockCallLLM.mockResolvedValue('{}');
    mockParseJSONResponse.mockReturnValue({
      chapter: 'Test Chapter',
      subject: 'Test Subject',
      notes: {
        definitions: [],
        concepts: [],
        theorems: [],
        examples: [],
        summary: 'Test summary'
      }
    });
  });

  describe('generateNotes', () => {
    
    describe('valid inputs', () => {
      
      it('should generate notes for valid subject and chapter', async () => {
        const validNotes: NotesResponse = {
          chapter: 'Vectors',
          subject: 'Linear Algebra',
          notes: {
            definitions: [{ term: 'Vector', definition: 'A quantity with magnitude and direction' }],
            concepts: [{ title: 'Vector Space', explanation: 'A set of vectors...' }],
            theorems: [{ name: 'Theorem 1', statement: 'Statement', explanation: 'Explanation' }],
            examples: [{ title: 'Example 1', problem: 'Problem', solution: 'Solution', explanation: 'Explanation' }],
            summary: 'Chapter summary'
          }
        };
        mockParseJSONResponse.mockReturnValue(validNotes);
        
        const result = await generateNotes('Linear Algebra', 'Vectors');
        expect(result).toEqual(validNotes);
      });

      it('should call prompt loader with correct template name', async () => {
        await generateNotes('Math', 'Chapter 1');
        expect(mockLoadPromptTemplate).toHaveBeenCalledWith('notes');
      });

      it('should replace both subject and chapter variables', async () => {
        const template = 'Generate notes for {{subject}} - {{chapter}}';
        mockLoadPromptTemplate.mockResolvedValue(template);
        
        await generateNotes('Physics', 'Mechanics');
        
        expect(mockReplaceTemplateVariables).toHaveBeenCalledWith(
          template,
          { subject: 'Physics', chapter: 'Mechanics' }
        );
      });
    });

    describe('response structure validation', () => {
      
      it('should validate all required top-level fields', async () => {
        const missingFields = [
          { subject: 'Test', notes: {} },  // missing chapter
          { chapter: 'Test', notes: {} },   // missing subject
          { chapter: 'Test', subject: 'Test' },  // missing notes
        ];
        
        for (const invalid of missingFields) {
          mockParseJSONResponse.mockReturnValue(invalid as any);
          await expect(generateNotes('S', 'C')).rejects.toThrow('Invalid notes structure');
        }
      });

      it('should validate notes object has all array fields', async () => {
        const invalidNotes = [
          { chapter: 'C', subject: 'S', notes: { concepts: [], theorems: [], examples: [], summary: 'S' } },  // missing definitions
          { chapter: 'C', subject: 'S', notes: { definitions: [], theorems: [], examples: [], summary: 'S' } },  // missing concepts
          { chapter: 'C', subject: 'S', notes: { definitions: [], concepts: [], examples: [], summary: 'S' } },  // missing theorems
          { chapter: 'C', subject: 'S', notes: { definitions: [], concepts: [], theorems: [], summary: 'S' } },  // missing examples
        ];
        
        for (const invalid of invalidNotes) {
          mockParseJSONResponse.mockReturnValue(invalid as any);
          await expect(generateNotes('S', 'C')).rejects.toThrow('Invalid notes content structure');
        }
      });

      it('should validate summary is present', async () => {
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: []
          }
        } as any);
        
        await expect(generateNotes('S', 'C')).rejects.toThrow('Invalid notes content structure');
      });

      it('should accept empty arrays for all note sections', async () => {
        const emptyNotes: NotesResponse = {
          chapter: 'Empty',
          subject: 'Test',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'No content yet'
          }
        };
        mockParseJSONResponse.mockReturnValue(emptyNotes);
        
        const result = await generateNotes('Test', 'Empty');
        expect(result.notes.definitions).toHaveLength(0);
      });

      it('should validate arrays are actually arrays', async () => {
        const notArrays = {
          chapter: 'C',
          subject: 'S',
          notes: {
            definitions: 'not-array',
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'S'
          }
        };
        mockParseJSONResponse.mockReturnValue(notArrays as any);
        
        await expect(generateNotes('S', 'C')).rejects.toThrow();
      });
    });

    describe('complex note structures', () => {
      
      it('should handle multiple definitions', async () => {
        const notes: NotesResponse = {
          chapter: 'C',
          subject: 'S',
          notes: {
            definitions: [
              { term: 'Term 1', definition: 'Def 1' },
              { term: 'Term 2', definition: 'Def 2' },
              { term: 'Term 3', definition: 'Def 3' },
            ],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'Summary'
          }
        };
        mockParseJSONResponse.mockReturnValue(notes);
        
        const result = await generateNotes('S', 'C');
        expect(result.notes.definitions).toHaveLength(3);
      });

      it('should handle complex theorem structures', async () => {
        const notes: NotesResponse = {
          chapter: 'C',
          subject: 'S',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [
              {
                name: 'Pythagorean Theorem',
                statement: 'a² + b² = c²',
                explanation: 'In a right triangle...'
              }
            ],
            examples: [],
            summary: 'Summary'
          }
        };
        mockParseJSONResponse.mockReturnValue(notes);
        
        const result = await generateNotes('S', 'C');
        expect(result.notes.theorems[0].name).toBe('Pythagorean Theorem');
      });

      it('should handle detailed examples with all fields', async () => {
        const notes: NotesResponse = {
          chapter: 'C',
          subject: 'S',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [
              {
                title: 'Example: Solving Quadratic Equation',
                problem: 'Solve x² - 5x + 6 = 0',
                solution: 'x = 2 or x = 3',
                explanation: 'Using factoring method...'
              }
            ],
            summary: 'Summary'
          }
        };
        mockParseJSONResponse.mockReturnValue(notes);
        
        const result = await generateNotes('S', 'C');
        expect(result.notes.examples[0].solution).toBe('x = 2 or x = 3');
      });

      it('should handle long summary text', async () => {
        const longSummary = 'A'.repeat(1000);
        const notes: NotesResponse = {
          chapter: 'C',
          subject: 'S',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: longSummary
          }
        };
        mockParseJSONResponse.mockReturnValue(notes);
        
        const result = await generateNotes('S', 'C');
        expect(result.notes.summary.length).toBe(1000);
      });
    });

    describe('error handling', () => {
      
      it('should handle template loading errors', async () => {
        mockLoadPromptTemplate.mockRejectedValue(new Error('Template error'));
        await expect(generateNotes('S', 'C')).rejects.toThrow('Failed to generate notes');
      });

      it('should handle LLM API errors', async () => {
        mockCallLLM.mockRejectedValue(new Error('API error'));
        await expect(generateNotes('S', 'C')).rejects.toThrow('Failed to generate notes');
      });

      it('should preserve error messages', async () => {
        mockCallLLM.mockRejectedValue(new Error('Rate limit exceeded'));
        await expect(generateNotes('S', 'C')).rejects.toThrow('Rate limit exceeded');
      });
    });

    describe('edge cases', () => {
      
      it('should handle special characters in subject and chapter', async () => {
        const notes: NotesResponse = {
          chapter: 'C++ Basics',
          subject: 'Programming & CS',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'Summary'
          }
        };
        mockParseJSONResponse.mockReturnValue(notes);
        
        const result = await generateNotes('Programming & CS', 'C++ Basics');
        expect(result.chapter).toContain('++');
        expect(result.subject).toContain('&');
      });

      it('should handle unicode in notes content', async () => {
        const notes: NotesResponse = {
          chapter: 'Chapter',
          subject: 'Subject',
          notes: {
            definitions: [{ term: '向量', definition: 'Vector in Chinese' }],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'Summary with emoji 📚'
          }
        };
        mockParseJSONResponse.mockReturnValue(notes);
        
        const result = await generateNotes('Subject', 'Chapter');
        expect(result.notes.definitions[0].term).toBe('向量');
        expect(result.notes.summary).toContain('📚');
      });
    });
  });
});


