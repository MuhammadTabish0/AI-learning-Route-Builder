/**
 * Integration Test Suite for Course Generation Flow
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. INTEGRATION TESTING
 *    - Tests how multiple modules work together
 *    - Tests end-to-end workflows
 *    - Validates data flow between components
 * 
 * 2. REGRESSION TESTING
 *    - These tests serve as regression tests
 *    - Automated execution ensures bugs don't reappear
 *    - Tests critical user paths through the system
 * 
 * 3. BLACK BOX TESTING
 *    - Tests complete workflows from user perspective
 *    - Validates business logic and use cases
 * 
 * Note: These tests use mocks for external dependencies (LLM API)
 * to ensure fast, reliable, and repeatable testing.
 */

import { generateRoadmap } from '@/ai/roadmapGenerator';
import { generateNotes } from '@/ai/notesGenerator';
import { generateQuestions } from '@/ai/questionGenerator';
import { generateResources } from '@/ai/resourcesGenerator';
import * as llmClient from '@/lib/llm-client';

jest.mock('@/lib/llm-client');

const mockCallLLM = llmClient.callLLM as jest.MockedFunction<typeof llmClient.callLLM>;

describe('Course Generation Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Course Generation Workflow', () => {
    
    it('should generate complete course with roadmap, notes, questions, and resources', async () => {
      // Mock LLM responses for each step
      mockCallLLM
        .mockResolvedValueOnce(JSON.stringify({
          subject: 'Linear Algebra',
          chapters: ['Vectors', 'Matrices', 'Determinants']
        }))
        .mockResolvedValueOnce(JSON.stringify({
          chapter: 'Vectors',
          subject: 'Linear Algebra',
          notes: {
            definitions: [{ term: 'Vector', definition: 'A quantity with magnitude and direction' }],
            concepts: [{ title: 'Vector Space', explanation: 'A set of vectors...' }],
            theorems: [],
            examples: [],
            summary: 'Vectors are fundamental'
          }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          chapter: 'Vectors',
          subject: 'Linear Algebra',
          questions: {
            mcqs: [{
              id: 1,
              question: 'What is a vector?',
              options: { a: 'Scalar', b: 'Vector', c: 'Matrix', d: 'Tensor' },
              correctAnswer: 'b',
              explanation: 'A vector has magnitude and direction'
            }],
            short: [],
            numerical: []
          }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          subject: 'Linear Algebra',
          resources: {
            videos: [{
              title: '3Blue1Brown Linear Algebra',
              url: 'https://youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
              description: 'Visual introduction to linear algebra',
              channel: '3Blue1Brown'
            }],
            articles: [],
            books: []
          }
        }));
      
      // Step 1: Generate roadmap
      const roadmap = await generateRoadmap('Linear Algebra');
      expect(roadmap.subject).toBe('Linear Algebra');
      expect(roadmap.chapters).toContain('Vectors');
      
      // Step 2: Generate notes for first chapter
      const notes = await generateNotes('Linear Algebra', 'Vectors');
      expect(notes.chapter).toBe('Vectors');
      expect(notes.notes.definitions).toHaveLength(1);
      
      // Step 3: Generate questions for chapter
      const questions = await generateQuestions('Linear Algebra', 'Vectors');
      expect(questions.questions.mcqs).toHaveLength(1);
      
      // Step 4: Generate resources
      const resources = await generateResources('Linear Algebra');
      expect(resources.resources.videos).toHaveLength(1);
      
      // Verify all components are consistent
      expect(roadmap.subject).toBe(notes.subject);
      expect(roadmap.subject).toBe(questions.subject);
      expect(roadmap.subject).toBe(resources.subject);
      expect(notes.chapter).toBe(questions.chapter);
    });

    it('should handle multi-chapter course generation', async () => {
      const chapters = ['Chapter 1', 'Chapter 2', 'Chapter 3'];
      
      // Mock roadmap response
      mockCallLLM.mockResolvedValueOnce(JSON.stringify({
        subject: 'Course',
        chapters: chapters
      }));
      
      // Mock notes responses for each chapter
      for (let i = 0; i < chapters.length; i++) {
        mockCallLLM.mockResolvedValueOnce(JSON.stringify({
          chapter: chapters[i],
          subject: 'Course',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: `Summary for ${chapters[i]}`
          }
        }));
      }
      
      const roadmap = await generateRoadmap('Course');
      expect(roadmap.chapters).toHaveLength(3);
      
      // Generate notes for all chapters
      const allNotes = [];
      for (const chapter of roadmap.chapters) {
        const notes = await generateNotes('Course', chapter);
        allNotes.push(notes);
      }
      
      expect(allNotes).toHaveLength(3);
      expect(allNotes[0].notes.summary).toContain('Chapter 1');
      expect(allNotes[2].notes.summary).toContain('Chapter 3');
    });
  });

  describe('Error Propagation and Recovery', () => {
    
    it('should handle error in roadmap generation gracefully', async () => {
      mockCallLLM.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(generateRoadmap('Test')).rejects.toThrow('Failed to generate roadmap');
    });

    it('should handle error in notes generation without affecting other chapters', async () => {
      // First chapter succeeds
      mockCallLLM.mockResolvedValueOnce(JSON.stringify({
        chapter: 'Chapter 1',
        subject: 'Test',
        notes: {
          definitions: [],
          concepts: [],
          theorems: [],
          examples: [],
          summary: 'Summary'
        }
      }));
      
      const notes1 = await generateNotes('Test', 'Chapter 1');
      expect(notes1.chapter).toBe('Chapter 1');
      
      // Second chapter fails
      mockCallLLM.mockRejectedValueOnce(new Error('API Error'));
      await expect(generateNotes('Test', 'Chapter 2')).rejects.toThrow();
      
      // First chapter result is still valid
      expect(notes1.chapter).toBe('Chapter 1');
    });
  });

  describe('Data Consistency Validation', () => {
    
    it('should maintain subject consistency across all components', async () => {
      const subject = 'Data Structures';
      
      mockCallLLM
        .mockResolvedValueOnce(JSON.stringify({
          subject: subject,
          chapters: ['Arrays']
        }))
        .mockResolvedValueOnce(JSON.stringify({
          chapter: 'Arrays',
          subject: subject,
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'Summary'
          }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          chapter: 'Arrays',
          subject: subject,
          questions: { mcqs: [], short: [], numerical: [] }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          subject: subject,
          resources: { videos: [], articles: [], books: [] }
        }));
      
      const roadmap = await generateRoadmap(subject);
      const notes = await generateNotes(subject, 'Arrays');
      const questions = await generateQuestions(subject, 'Arrays');
      const resources = await generateResources(subject);
      
      expect(roadmap.subject).toBe(subject);
      expect(notes.subject).toBe(subject);
      expect(questions.subject).toBe(subject);
      expect(resources.subject).toBe(subject);
    });

    it('should maintain chapter consistency between notes and questions', async () => {
      const chapter = 'Introduction to Algorithms';
      
      mockCallLLM
        .mockResolvedValueOnce(JSON.stringify({
          chapter: chapter,
          subject: 'CS',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'Summary'
          }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          chapter: chapter,
          subject: 'CS',
          questions: { mcqs: [], short: [], numerical: [] }
        }));
      
      const notes = await generateNotes('CS', chapter);
      const questions = await generateQuestions('CS', chapter);
      
      expect(notes.chapter).toBe(chapter);
      expect(questions.chapter).toBe(chapter);
    });
  });

  describe('Performance and Scalability', () => {
    
    it('should handle large roadmaps efficiently', async () => {
      const largeChapterList = Array.from({ length: 50 }, (_, i) => `Chapter ${i + 1}`);
      
      mockCallLLM.mockResolvedValueOnce(JSON.stringify({
        subject: 'Comprehensive Course',
        chapters: largeChapterList
      }));
      
      const roadmap = await generateRoadmap('Comprehensive Course');
      expect(roadmap.chapters).toHaveLength(50);
    });

    it('should handle complex notes with many sections', async () => {
      const complexNotes = {
        chapter: 'Complex Chapter',
        subject: 'Advanced Topics',
        notes: {
          definitions: Array.from({ length: 20 }, (_, i) => ({
            term: `Term ${i}`,
            definition: `Definition ${i}`
          })),
          concepts: Array.from({ length: 15 }, (_, i) => ({
            title: `Concept ${i}`,
            explanation: `Explanation ${i}`
          })),
          theorems: Array.from({ length: 10 }, (_, i) => ({
            name: `Theorem ${i}`,
            statement: `Statement ${i}`,
            explanation: `Explanation ${i}`
          })),
          examples: Array.from({ length: 25 }, (_, i) => ({
            title: `Example ${i}`,
            problem: `Problem ${i}`,
            solution: `Solution ${i}`,
            explanation: `Explanation ${i}`
          })),
          summary: 'Comprehensive summary'
        }
      };
      
      mockCallLLM.mockResolvedValueOnce(JSON.stringify(complexNotes));
      
      const notes = await generateNotes('Advanced Topics', 'Complex Chapter');
      expect(notes.notes.definitions).toHaveLength(20);
      expect(notes.notes.examples).toHaveLength(25);
    });

    it('should handle many questions efficiently', async () => {
      const manyQuestions = {
        chapter: 'Test Chapter',
        subject: 'Test',
        questions: {
          mcqs: Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            question: `Question ${i + 1}`,
            options: { a: 'A', b: 'B', c: 'C', d: 'D' },
            correctAnswer: 'a' as const,
            explanation: `Explanation ${i + 1}`
          })),
          short: Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            question: `Short ${i + 1}`,
            answer: `Answer ${i + 1}`
          })),
          numerical: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            problem: `Problem ${i + 1}`,
            solution: `Solution ${i + 1}`,
            answer: `${i + 1}`
          }))
        }
      };
      
      mockCallLLM.mockResolvedValueOnce(JSON.stringify(manyQuestions));
      
      const questions = await generateQuestions('Test', 'Test Chapter');
      expect(questions.questions.mcqs).toHaveLength(50);
      expect(questions.questions.short).toHaveLength(30);
      expect(questions.questions.numerical).toHaveLength(20);
    });
  });

  describe('Edge Cases in Integration', () => {
    
    it('should handle course with single chapter', async () => {
      mockCallLLM
        .mockResolvedValueOnce(JSON.stringify({
          subject: 'Short Course',
          chapters: ['Only Chapter']
        }))
        .mockResolvedValueOnce(JSON.stringify({
          chapter: 'Only Chapter',
          subject: 'Short Course',
          notes: {
            definitions: [],
            concepts: [],
            theorems: [],
            examples: [],
            summary: 'Summary'
          }
        }));
      
      const roadmap = await generateRoadmap('Short Course');
      expect(roadmap.chapters).toHaveLength(1);
      
      const notes = await generateNotes('Short Course', 'Only Chapter');
      expect(notes.chapter).toBe('Only Chapter');
    });

    it('should handle empty content sections gracefully', async () => {
      mockCallLLM.mockResolvedValueOnce(JSON.stringify({
        chapter: 'Chapter',
        subject: 'Subject',
        notes: {
          definitions: [],
          concepts: [],
          theorems: [],
          examples: [],
          summary: ''
        }
      }));
      
      const notes = await generateNotes('Subject', 'Chapter');
      expect(notes.notes.definitions).toHaveLength(0);
      expect(notes.notes.summary).toBe('');
    });
  });
});


