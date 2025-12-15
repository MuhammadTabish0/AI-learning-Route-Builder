/**
 * Test Suite for questionGenerator.ts
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. PARTITIONING
 *    Question types:
 *      - MCQs (multiple choice questions)
 *      - Short answer questions
 *      - Numerical problems
 *    Validation:
 *      - Complete structures
 *      - Missing fields
 *      - Invalid data types
 * 
 * 2. BOUNDARY VALUE ANALYSIS
 *    - Empty question arrays
 *    - Large number of questions
 *    - MCQ answer validation ('a', 'b', 'c', 'd')
 */

import { generateQuestions, QuestionsResponse, MCQ } from '../questionGenerator';
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

describe('questionGenerator module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLoadPromptTemplate.mockResolvedValue('Template');
    mockReplaceTemplateVariables.mockReturnValue('Prompt');
    mockCallLLM.mockResolvedValue('{}');
    mockParseJSONResponse.mockReturnValue({
      chapter: 'Chapter',
      subject: 'Subject',
      questions: {
        mcqs: [],
        short: [],
        numerical: []
      }
    });
  });

  describe('generateQuestions', () => {
    
    describe('valid responses', () => {
      
      it('should generate questions with all types', async () => {
        const validQuestions: QuestionsResponse = {
          chapter: 'Algebra',
          subject: 'Math',
          questions: {
            mcqs: [{
              id: 1,
              question: 'What is 2+2?',
              options: { a: '3', b: '4', c: '5', d: '6' },
              correctAnswer: 'b',
              explanation: 'Basic arithmetic'
            }],
            short: [{
              id: 1,
              question: 'Define algebra',
              answer: 'Branch of mathematics'
            }],
            numerical: [{
              id: 1,
              problem: 'Solve x+2=5',
              solution: 'x=3',
              answer: '3'
            }]
          }
        };
        mockParseJSONResponse.mockReturnValue(validQuestions);
        
        const result = await generateQuestions('Math', 'Algebra');
        expect(result.questions.mcqs).toHaveLength(1);
        expect(result.questions.short).toHaveLength(1);
        expect(result.questions.numerical).toHaveLength(1);
      });

      it('should validate MCQ structure', async () => {
        const mcq: MCQ = {
          id: 1,
          question: 'Test question?',
          options: {
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D'
          },
          correctAnswer: 'a',
          explanation: 'Explanation text'
        };
        
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S',
          questions: { mcqs: [mcq], short: [], numerical: [] }
        });
        
        const result = await generateQuestions('S', 'C');
        expect(result.questions.mcqs[0]).toEqual(mcq);
      });

      it('should accept valid correctAnswer values', async () => {
        const answers: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
        
        for (const answer of answers) {
          const mcq: MCQ = {
            id: 1,
            question: 'Q',
            options: { a: 'A', b: 'B', c: 'C', d: 'D' },
            correctAnswer: answer,
            explanation: 'E'
          };
          
          mockParseJSONResponse.mockReturnValue({
            chapter: 'C',
            subject: 'S',
            questions: { mcqs: [mcq], short: [], numerical: [] }
          });
          
          const result = await generateQuestions('S', 'C');
          expect(result.questions.mcqs[0].correctAnswer).toBe(answer);
        }
      });
    });

    describe('structure validation', () => {
      
      it('should reject missing chapter', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'S',
          questions: { mcqs: [], short: [], numerical: [] }
        } as any);
        
        await expect(generateQuestions('S', 'C')).rejects.toThrow('Invalid questions structure');
      });

      it('should reject missing subject', async () => {
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          questions: { mcqs: [], short: [], numerical: [] }
        } as any);
        
        await expect(generateQuestions('S', 'C')).rejects.toThrow('Invalid questions structure');
      });

      it('should reject missing questions object', async () => {
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S'
        } as any);
        
        await expect(generateQuestions('S', 'C')).rejects.toThrow('Invalid questions structure');
      });

      it('should reject non-array mcqs', async () => {
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S',
          questions: {
            mcqs: 'not-array',
            short: [],
            numerical: []
          }
        } as any);
        
        await expect(generateQuestions('S', 'C')).rejects.toThrow('Invalid questions content structure');
      });

      it('should reject non-array short questions', async () => {
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S',
          questions: {
            mcqs: [],
            short: null,
            numerical: []
          }
        } as any);
        
        await expect(generateQuestions('S', 'C')).rejects.toThrow('Invalid questions content structure');
      });

      it('should accept empty arrays', async () => {
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S',
          questions: {
            mcqs: [],
            short: [],
            numerical: []
          }
        });
        
        const result = await generateQuestions('S', 'C');
        expect(result.questions.mcqs).toHaveLength(0);
      });
    });

    describe('multiple questions', () => {
      
      it('should handle multiple MCQs', async () => {
        const mcqs: MCQ[] = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          question: `Question ${i + 1}?`,
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'a' as const,
          explanation: `Explanation ${i + 1}`
        }));
        
        mockParseJSONResponse.mockReturnValue({
          chapter: 'C',
          subject: 'S',
          questions: { mcqs, short: [], numerical: [] }
        });
        
        const result = await generateQuestions('S', 'C');
        expect(result.questions.mcqs).toHaveLength(10);
      });

      it('should maintain question IDs', async () => {
        const questions: QuestionsResponse = {
          chapter: 'C',
          subject: 'S',
          questions: {
            mcqs: [
              { id: 1, question: 'Q1', options: { a: 'A', b: 'B', c: 'C', d: 'D' }, correctAnswer: 'a', explanation: 'E' },
              { id: 2, question: 'Q2', options: { a: 'A', b: 'B', c: 'C', d: 'D' }, correctAnswer: 'b', explanation: 'E' },
            ],
            short: [
              { id: 1, question: 'SQ1', answer: 'A1' },
              { id: 2, question: 'SQ2', answer: 'A2' },
            ],
            numerical: [
              { id: 1, problem: 'P1', solution: 'S1', answer: '1' },
              { id: 2, problem: 'P2', solution: 'S2', answer: '2' },
            ]
          }
        };
        mockParseJSONResponse.mockReturnValue(questions);
        
        const result = await generateQuestions('S', 'C');
        expect(result.questions.mcqs[0].id).toBe(1);
        expect(result.questions.mcqs[1].id).toBe(2);
        expect(result.questions.short[0].id).toBe(1);
        expect(result.questions.numerical[1].id).toBe(2);
      });
    });

    describe('error handling', () => {
      
      it('should handle API errors', async () => {
        mockCallLLM.mockRejectedValue(new Error('API failed'));
        await expect(generateQuestions('S', 'C')).rejects.toThrow('Failed to generate questions');
      });

      it('should preserve error messages', async () => {
        mockParseJSONResponse.mockImplementation(() => {
          throw new Error('JSON parse error');
        });
        await expect(generateQuestions('S', 'C')).rejects.toThrow('JSON parse error');
      });
    });

    describe('integration', () => {
      
      it('should use correct template', async () => {
        await generateQuestions('S', 'C');
        expect(mockLoadPromptTemplate).toHaveBeenCalledWith('questions');
      });

      it('should replace subject and chapter variables', async () => {
        const template = 'Generate questions for {{subject}} - {{chapter}}';
        mockLoadPromptTemplate.mockResolvedValue(template);
        
        await generateQuestions('Physics', 'Mechanics');
        
        expect(mockReplaceTemplateVariables).toHaveBeenCalledWith(
          template,
          { subject: 'Physics', chapter: 'Mechanics' }
        );
      });
    });
  });
});


