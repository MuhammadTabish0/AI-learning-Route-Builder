/**
 * Test Suite for resourcesGenerator.ts
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. PARTITIONING
 *    Resource types:
 *      - Video resources (with URL, channel)
 *      - Article resources (with URL, source)
 *      - Book resources (with author, optional ISBN)
 *    Input subjects:
 *      - Common subjects
 *      - Technical subjects
 *      - Edge cases
 * 
 * 2. BOUNDARY ANALYSIS
 *    - Empty resource arrays
 *    - Large number of resources
 *    - Missing optional fields (ISBN, note)
 */

import { generateResources, ResourcesResponse } from '../resourcesGenerator';
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

describe('resourcesGenerator module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLoadPromptTemplate.mockResolvedValue('Template');
    mockReplaceTemplateVariables.mockReturnValue('Prompt');
    mockCallLLM.mockResolvedValue('{}');
    mockParseJSONResponse.mockReturnValue({
      subject: 'Subject',
      resources: {
        videos: [],
        articles: [],
        books: []
      }
    });
  });

  describe('generateResources', () => {
    
    describe('valid responses', () => {
      
      it('should generate resources with all types', async () => {
        const validResources: ResourcesResponse = {
          subject: 'Mathematics',
          resources: {
            videos: [{
              title: 'Linear Algebra Course',
              url: 'https://youtube.com/watch?v=123',
              description: 'Complete course on linear algebra',
              channel: '3Blue1Brown'
            }],
            articles: [{
              title: 'Introduction to Vectors',
              url: 'https://example.com/article',
              description: 'Beginner-friendly guide',
              source: 'Math Academy'
            }],
            books: [{
              title: 'Linear Algebra Done Right',
              author: 'Sheldon Axler',
              description: 'Comprehensive textbook',
              isbn: '978-3-319-11080-6'
            }]
          }
        };
        mockParseJSONResponse.mockReturnValue(validResources);
        
        const result = await generateResources('Mathematics');
        expect(result.resources.videos).toHaveLength(1);
        expect(result.resources.articles).toHaveLength(1);
        expect(result.resources.books).toHaveLength(1);
      });

      it('should validate video resource structure', async () => {
        const resources: ResourcesResponse = {
          subject: 'CS',
          resources: {
            videos: [{
              title: 'Python Tutorial',
              url: 'https://youtube.com/watch?v=abc',
              description: 'Learn Python',
              channel: 'Corey Schafer'
            }],
            articles: [],
            books: []
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('CS');
        expect(result.resources.videos[0].channel).toBe('Corey Schafer');
      });

      it('should validate article resource structure', async () => {
        const resources: ResourcesResponse = {
          subject: 'Physics',
          resources: {
            videos: [],
            articles: [{
              title: 'Quantum Mechanics',
              url: 'https://physics.org/article',
              description: 'Introduction to quantum mechanics',
              source: 'Physics Today'
            }],
            books: []
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('Physics');
        expect(result.resources.articles[0].source).toBe('Physics Today');
      });

      it('should handle book resources with optional fields', async () => {
        const resources: ResourcesResponse = {
          subject: 'Literature',
          resources: {
            videos: [],
            articles: [],
            books: [
              {
                title: 'Book with ISBN',
                author: 'Author 1',
                description: 'Description',
                isbn: '978-1-234-56789-0'
              },
              {
                title: 'Book without ISBN',
                author: 'Author 2',
                description: 'Description'
              },
              {
                title: 'Book with note',
                author: 'Author 3',
                description: 'Description',
                note: 'Available online'
              }
            ]
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('Literature');
        expect(result.resources.books[0].isbn).toBeDefined();
        expect(result.resources.books[1].isbn).toBeUndefined();
        expect(result.resources.books[2].note).toBe('Available online');
      });
    });

    describe('structure validation', () => {
      
      it('should reject missing subject', async () => {
        mockParseJSONResponse.mockReturnValue({
          resources: { videos: [], articles: [], books: [] }
        } as any);
        
        await expect(generateResources('Test')).rejects.toThrow('Invalid resources structure');
      });

      it('should reject missing resources object', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test'
        } as any);
        
        await expect(generateResources('Test')).rejects.toThrow('Invalid resources structure');
      });

      it('should reject non-array videos', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          resources: {
            videos: 'not-array',
            articles: [],
            books: []
          }
        } as any);
        
        await expect(generateResources('Test')).rejects.toThrow('Invalid resources content structure');
      });

      it('should reject non-array articles', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          resources: {
            videos: [],
            articles: null,
            books: []
          }
        } as any);
        
        await expect(generateResources('Test')).rejects.toThrow('Invalid resources content structure');
      });

      it('should reject non-array books', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          resources: {
            videos: [],
            articles: [],
            books: {}
          }
        } as any);
        
        await expect(generateResources('Test')).rejects.toThrow('Invalid resources content structure');
      });

      it('should accept empty resource arrays', async () => {
        mockParseJSONResponse.mockReturnValue({
          subject: 'New Subject',
          resources: {
            videos: [],
            articles: [],
            books: []
          }
        });
        
        const result = await generateResources('New Subject');
        expect(result.resources.videos).toHaveLength(0);
        expect(result.resources.articles).toHaveLength(0);
        expect(result.resources.books).toHaveLength(0);
      });
    });

    describe('multiple resources', () => {
      
      it('should handle many video resources', async () => {
        const videos = Array.from({ length: 15 }, (_, i) => ({
          title: `Video ${i + 1}`,
          url: `https://youtube.com/watch?v=${i}`,
          description: `Description ${i + 1}`,
          channel: `Channel ${i + 1}`
        }));
        
        mockParseJSONResponse.mockReturnValue({
          subject: 'Test',
          resources: { videos, articles: [], books: [] }
        });
        
        const result = await generateResources('Test');
        expect(result.resources.videos).toHaveLength(15);
      });

      it('should handle mixed resource counts', async () => {
        const resources: ResourcesResponse = {
          subject: 'Test',
          resources: {
            videos: Array.from({ length: 5 }, (_, i) => ({
              title: `V${i}`,
              url: `url${i}`,
              description: `d${i}`,
              channel: `c${i}`
            })),
            articles: Array.from({ length: 3 }, (_, i) => ({
              title: `A${i}`,
              url: `url${i}`,
              description: `d${i}`,
              source: `s${i}`
            })),
            books: Array.from({ length: 10 }, (_, i) => ({
              title: `B${i}`,
              author: `Author${i}`,
              description: `d${i}`
            }))
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('Test');
        expect(result.resources.videos).toHaveLength(5);
        expect(result.resources.articles).toHaveLength(3);
        expect(result.resources.books).toHaveLength(10);
      });
    });

    describe('URL validation scenarios', () => {
      
      it('should handle various URL formats', async () => {
        const resources: ResourcesResponse = {
          subject: 'Test',
          resources: {
            videos: [{
              title: 'Video',
              url: 'https://youtube.com/watch?v=abc123&t=100',
              description: 'Desc',
              channel: 'Channel'
            }],
            articles: [{
              title: 'Article',
              url: 'https://medium.com/@user/article-slug-123',
              description: 'Desc',
              source: 'Medium'
            }],
            books: []
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('Test');
        expect(result.resources.videos[0].url).toContain('youtube.com');
        expect(result.resources.articles[0].url).toContain('medium.com');
      });
    });

    describe('error handling', () => {
      
      it('should handle template loading errors', async () => {
        mockLoadPromptTemplate.mockRejectedValue(new Error('Template error'));
        await expect(generateResources('Test')).rejects.toThrow('Failed to generate resources');
      });

      it('should handle API errors', async () => {
        mockCallLLM.mockRejectedValue(new Error('API error'));
        await expect(generateResources('Test')).rejects.toThrow('Failed to generate resources');
      });

      it('should preserve error messages', async () => {
        mockCallLLM.mockRejectedValue(new Error('Rate limit'));
        await expect(generateResources('Test')).rejects.toThrow('Rate limit');
      });

      it('should handle unknown errors', async () => {
        mockCallLLM.mockRejectedValue('String error');
        await expect(generateResources('Test')).rejects.toThrow('Unknown error');
      });
    });

    describe('integration', () => {
      
      it('should use correct template', async () => {
        await generateResources('Test');
        expect(mockLoadPromptTemplate).toHaveBeenCalledWith('resources');
      });

      it('should replace subject variable', async () => {
        const template = 'Generate resources for {{subject}}';
        mockLoadPromptTemplate.mockResolvedValue(template);
        
        await generateResources('Machine Learning');
        
        expect(mockReplaceTemplateVariables).toHaveBeenCalledWith(
          template,
          { subject: 'Machine Learning' }
        );
      });

      it('should call dependencies in order', async () => {
        const order: string[] = [];
        
        mockLoadPromptTemplate.mockImplementation(async () => {
          order.push('load');
          return 'template';
        });
        mockReplaceTemplateVariables.mockImplementation(() => {
          order.push('replace');
          return 'prompt';
        });
        mockCallLLM.mockImplementation(async () => {
          order.push('call');
          return 'response';
        });
        mockParseJSONResponse.mockImplementation(() => {
          order.push('parse');
          return { subject: 'Test', resources: { videos: [], articles: [], books: [] } };
        });
        
        await generateResources('Test');
        expect(order).toEqual(['load', 'replace', 'call', 'parse']);
      });
    });

    describe('edge cases', () => {
      
      it('should handle special characters in subject', async () => {
        const subject = 'C++ & Data Structures';
        mockParseJSONResponse.mockReturnValue({
          subject: subject,
          resources: { videos: [], articles: [], books: [] }
        });
        
        const result = await generateResources(subject);
        expect(result.subject).toBe(subject);
      });

      it('should handle unicode in resource content', async () => {
        const resources: ResourcesResponse = {
          subject: 'Test',
          resources: {
            videos: [{
              title: 'Tutorial 教程',
              url: 'https://example.com',
              description: 'Learn 学习',
              channel: 'Channel 频道'
            }],
            articles: [],
            books: []
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('Test');
        expect(result.resources.videos[0].title).toContain('教程');
      });

      it('should handle very long descriptions', async () => {
        const longDescription = 'A'.repeat(1000);
        const resources: ResourcesResponse = {
          subject: 'Test',
          resources: {
            videos: [],
            articles: [],
            books: [{
              title: 'Book',
              author: 'Author',
              description: longDescription
            }]
          }
        };
        mockParseJSONResponse.mockReturnValue(resources);
        
        const result = await generateResources('Test');
        expect(result.resources.books[0].description.length).toBe(1000);
      });
    });
  });
});


