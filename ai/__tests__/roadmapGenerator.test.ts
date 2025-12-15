/**
 * Test Suite for roadmapGenerator.ts
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. BLACK BOX TESTING
 *    - Tests based on function specification
 *    - generateRoadmap(subject) returns RoadmapResponse
 *    - Response validation according to spec
 * 
 * 2. PARTITIONING
 *    Input space for subject parameter:
 *      - Common academic subjects (Math, Science, etc.)
 *      - Technical subjects (Programming, Engineering)
 *      - Edge cases: short names, long names, special characters
 *      - Boundary: empty string, very long string
 *    
 *    Expected behavior partitions:
 *      - Successful generation with valid structure
 *      - Error cases: LLM failure, invalid response structure
 *      - Validation failures: missing fields, wrong types
 * 
 * 3. BOUNDARY VALUE ANALYSIS
 *    - Empty subject string
 *    - Single character subject
 *    - Very long subject names
 *    - Empty chapters array
 *    - Large number of chapters
 * 
 * 4. GLASS BOX TESTING
 *    - Tests error handling paths
 *    - Tests validation logic for response structure
 *    - Tests integration with prompt-loader and llm-client
 */

import { generateRoadmap, RoadmapResponse } from '../roadmapGenerator';
import * as promptLoader from '@/lib/prompt-loader';
import * as llmClient from '@/lib/llm-client';

// Mock dependencies
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

describe('roadmapGenerator module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful mock implementations
    mockLoadPromptTemplate.mockResolvedValue('Template for {{subject}}');
    mockReplaceTemplateVariables.mockReturnValue('Template for Test Subject');
    mockCallLLM.mockResolvedValue('{"subject":"Test","chapters":["Ch1"]}');
    mockParseJSONResponse.mockReturnValue({
      subject: 'Test Subject',
      chapters: ['Chapter 1', 'Chapter 2']
    });
  });

  describe('generateRoadmap', () => {
    
    // Partition: Valid subject inputs
    describe('valid subject inputs', () => {
      
      it('should generate roadmap for common academic subject', async () => {
        const subjects = [
          'Linear Algebra',
          'Calculus',
          'Physics',
          'Chemistry',
          'Biology'
        ];
        
        for (const subject of subjects) {
          mockParseJSONResponse.mockReturnValue({
            subject: subject,
            chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3']
          });
          
          const result = await generateRoadmap(subject);
          
          expect(result).toBeDefined();
          expect(result.subject).toBe(subject);
          expect(Array.isArray(result.chapters)).toBe(true);
        }
      });

      it('should generate roadmap for technical subjects', async () => {
        const technicalSubjects = [
          'Machine Learning',
          'Data Structures',
          'Web Development',
          'System Design'
        ];
        
        for (const subject of technicalSubjects) {
          mockParseJSONResponse.mockReturnValue({
            subject: subject,
            chapters: ['Introduction', 'Advanced Topics']
          });
          
          const result = await generateRoadmap(subject);
          expect(result.subject).toBe(subject);
        }
      });

      it('should handle subjects with numbers', async () => {
        const subject = 'CS 101';
        mockParseJSONResponse.mockReturnValue({
          subject: subject,
          chapters: ['Week 1', 'Week 2']
        });
        
        const result = await generateRoadmap(subject);
        expect(result.subject).toBe(subject);
      });

      it('should handle subjects with special characters', async () => {
        const subject = 'C++ Programming';
        mockParseJSONResponse.mockReturnValue({
          subject: subject,
          chapters: ['Basics', 'Advanced']
        });
        
        const result = await generateRoadmap(subject);
        expect(result.subject).toBe(subject);
      });
    });

    // Partition: Response structure validation
    describe('response structure validation', () => {
      
      it('should accept valid response with subject and chapters', async () => {
        const validResponse: RoadmapResponse = {
          subject: 'Mathematics',
          chapters: ['Algebra', 'Geometry', 'Calculus']
        };
        mockParseJSONResponse.mockReturnValue(validResponse);
        
        const result = await generateRoadmap('Mathematics');
        expect(result).toEqual(validResponse);
      });

      it('should accept response with many chapters', async () => {
        const manyChapters = Array.from({ length: 20 }, (_, i) => `Chapter ${i + 1}`);
        mockParseJSONResponse.mockReturnValue({
          subject: 'Comprehensive Course',
          chapters: manyChapters
        });
        
        const result = await generateRoadmap('Comprehensive Course');
        expect(result.chapters).toHaveLength(20);
      });

      it('should accept response with single chapter', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Short Course',
          chapters: ['Single Chapter']
        });
        
        const result = await generateRoadmap('Short Course');
        expect(result.chapters).toHaveLength(1);
      });

      it('should throw error when subject is missing', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: '',
          chapters: ['Chapter 1']
        } as any);
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Invalid roadmap structure returned from LLM');
      });

      it('should throw error when chapters is not an array', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          chapters: 'Not an array'
        } as any);
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Invalid roadmap structure returned from LLM');
      });

      it('should throw error when chapters is missing', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test'
        } as any);
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Invalid roadmap structure returned from LLM');
      });

      it('should throw error when subject is null', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: null,
          chapters: []
        } as any);
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Invalid roadmap structure returned from LLM');
      });

      it('should accept empty chapters array (edge case)', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Empty Course',
          chapters: []
        });
        
        const result = await generateRoadmap('Empty Course');
        expect(result.chapters).toHaveLength(0);
      });
    });

    // Partition: Integration with dependencies
    describe('integration with dependencies', () => {
      
      it('should call loadPromptTemplate with correct template name', async () => {
        await generateRoadmap('Test Subject');
        expect(mockLoadPromptTemplate).toHaveBeenCalledWith('roadmap');
      });

      it('should replace template variables correctly', async () => {
        const subject = 'Test Subject';
        const template = 'Generate roadmap for {{subject}}';
        mockLoadPromptTemplate.mockResolvedValue(template);
        
        await generateRoadmap(subject);
        
        expect(mockReplaceTemplateVariables).toHaveBeenCalledWith(
          template,
          { subject }
        );
      });

      it('should call LLM with prepared prompt', async () => {
        const preparedPrompt = 'Generate roadmap for Test Subject';
        mockReplaceTemplateVariables.mockReturnValue(preparedPrompt);
        
        await generateRoadmap('Test Subject');
        
        expect(mockCallLLM).toHaveBeenCalledWith(preparedPrompt);
      });

      it('should parse LLM response as JSON', async () => {
        const llmResponse = '{"subject":"Test","chapters":["Ch1"]}';
        mockCallLLM.mockResolvedValue(llmResponse);
        
        await generateRoadmap('Test Subject');
        
        expect(mockParseJSONResponse).toHaveBeenCalledWith(llmResponse);
      });

      it('should execute steps in correct order', async () => {
        const callOrder: string[] = [];
        
        mockLoadPromptTemplate.mockImplementation(async () => {
          callOrder.push('load');
          return 'template';
        });
        mockReplaceTemplateVariables.mockImplementation(() => {
          callOrder.push('replace');
          return 'prompt';
        });
        mockCallLLM.mockImplementation(async () => {
          callOrder.push('call');
          return 'response';
        });
        mockParseJSONResponse.mockImplementation(() => {
          callOrder.push('parse');
          return { subject: 'Test', chapters: [] };
        });
        
        await generateRoadmap('Test');
        
        expect(callOrder).toEqual(['load', 'replace', 'call', 'parse']);
      });
    });

    // Partition: Error handling
    describe('error handling', () => {
      
      it('should handle template loading failure', async () => {
        mockLoadPromptTemplate.mockRejectedValue(new Error('Template not found'));
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Failed to generate roadmap');
      });

      it('should handle LLM API failure', async () => {
        mockCallLLM.mockRejectedValue(new Error('API Error'));
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Failed to generate roadmap');
      });

      it('should handle JSON parsing failure', async () => {
        mockParseJSONResponse.mockImplementation(() => {
          throw new Error('Invalid JSON');
        });
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Failed to generate roadmap');
      });

      it('should preserve error messages in wrapped errors', async () => {
        const originalError = new Error('Specific API problem');
        mockCallLLM.mockRejectedValue(originalError);
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Specific API problem');
      });

      it('should handle unknown error types', async () => {
        mockCallLLM.mockRejectedValue('String error');
        
        await expect(generateRoadmap('Test'))
          .rejects
          .toThrow('Failed to generate roadmap: Unknown error');
      });
    });

    // Partition: Edge cases and boundaries
    describe('edge cases and boundaries', () => {
      
      it('should handle single character subject', async () => {
        const subject = 'X';
        mockParseJSONResponse.mockReturnValue({
          subject: subject,
          chapters: ['Chapter 1']
        });
        
        const result = await generateRoadmap(subject);
        expect(result.subject).toBe(subject);
      });

      it('should handle very long subject name', async () => {
        const longSubject = 'A'.repeat(500);
        mockParseJSONResponse.mockReturnValue({
          subject: longSubject,
          chapters: ['Chapter 1']
        });
        
        const result = await generateRoadmap(longSubject);
        expect(result.subject).toBe(longSubject);
      });

      it('should handle subject with unicode characters', async () => {
        const unicodeSubject = '数学 (Mathematics) 🎓';
        mockParseJSONResponse.mockReturnValue({
          subject: unicodeSubject,
          chapters: ['第一章']
        });
        
        const result = await generateRoadmap(unicodeSubject);
        expect(result.subject).toBe(unicodeSubject);
      });

      it('should handle chapters with long titles', async () => {
        const longChapterTitle = 'A'.repeat(200);
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          chapters: [longChapterTitle]
        });
        
        const result = await generateRoadmap('Test');
        expect(result.chapters[0]).toBe(longChapterTitle);
      });

      it('should handle chapters with special characters', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          chapters: [
            'Chapter 1: Introduction & Overview',
            'Chapter 2: Advanced Topics (Part 1)',
            'Chapter 3: Real-world Applications - Case Studies'
          ]
        });
        
        const result = await generateRoadmap('Test');
        expect(result.chapters[0]).toContain('&');
        expect(result.chapters[1]).toContain('(');
        expect(result.chapters[2]).toContain('-');
      });
    });

    // Glass box testing - implementation-specific behavior
    describe('implementation behavior (glass box)', () => {
      
      it('should validate response structure before returning', async () => {
        // Testing the validation logic path
        const invalidResponses = [
          { subject: '', chapters: ['Ch1'] },
          { subject: 'Test', chapters: null },
          { subject: 'Test', chapters: 'not-array' },
        ];
        
        for (const invalidResponse of invalidResponses) {
          mockParseJSONResponse.mockReturnValue(invalidResponse as any);
          await expect(generateRoadmap('Test')).rejects.toThrow();
        }
      });

      it('should check both subject and chapters in validation', async () => {
        // Test that validation checks all fields
        mockParseJSONResponse.mockReturnValue({
          subject: 'Valid',
          chapters: []
        });
        
        // This should pass validation even with empty chapters array
        const result = await generateRoadmap('Test');
        expect(result).toBeDefined();
      });

      it('should use Array.isArray for chapters validation', async () => {
        // Testing the specific validation method used
        const arrayLike = { 0: 'Ch1', 1: 'Ch2', length: 2 };
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          chapters: arrayLike as any
        });
        
        // Should fail because it's not a true array
        await expect(generateRoadmap('Test')).rejects.toThrow();
      });
    });
  });
});


