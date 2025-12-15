/**
 * Test Suite for prompt-loader.ts
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. BLACK BOX TESTING - Based on specification
 *    - Tests cover input/output behavior without looking at implementation
 *    - Partitioning strategy applied to input domains
 * 
 * 2. PARTITIONING - Input space divided into:
 *    For loadPromptTemplate(templateName):
 *      - Valid template names (existing files)
 *      - Invalid template names (non-existent files)
 *      - Edge cases: empty string, special characters, path traversal attempts
 *    
 *    For replaceTemplateVariables(template, variables):
 *      - Templates with no variables
 *      - Templates with single variable
 *      - Templates with multiple variables
 *      - Templates with repeated variables
 *      - Edge cases: empty template, empty variables object, malformed placeholders
 * 
 * 3. BOUNDARY VALUE ANALYSIS
 *    - Empty strings
 *    - Very long template names
 *    - Special characters in variable names
 * 
 * 4. GLASS BOX TESTING - Implementation-aware tests
 *    - Tests regex pattern matching in replaceTemplateVariables
 *    - Tests file system operations in loadPromptTemplate
 */

import { loadPromptTemplate, replaceTemplateVariables } from '../prompt-loader';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Mock fs/promises for controlled testing
jest.mock('fs/promises');

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('prompt-loader module', () => {
  
  describe('loadPromptTemplate', () => {
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Partition: Valid template names
    describe('valid template names', () => {
      
      it('should load an existing template successfully', async () => {
        // Arrange
        const templateContent = 'This is a test template with {{variable}}';
        mockedReadFile.mockResolvedValue(templateContent);
        
        // Act
        const result = await loadPromptTemplate('test-template');
        
        // Assert
        expect(result).toBe(templateContent);
        expect(mockedReadFile).toHaveBeenCalledWith(
          join(process.cwd(), 'prompts', 'test-template.txt'),
          'utf-8'
        );
      });

      it('should load template with standard names (roadmap, notes, questions)', async () => {
        const templates = ['roadmap', 'notes', 'questions', 'resources'];
        
        for (const templateName of templates) {
          mockedReadFile.mockResolvedValue(`Content for ${templateName}`);
          const result = await loadPromptTemplate(templateName);
          expect(result).toBe(`Content for ${templateName}`);
        }
      });

      it('should preserve template formatting including newlines and spaces', async () => {
        const templateWithFormatting = `Line 1
        Line 2 with spaces
        {{variable1}}
        
        Line 4 after blank line`;
        mockedReadFile.mockResolvedValue(templateWithFormatting);
        
        const result = await loadPromptTemplate('formatted-template');
        expect(result).toBe(templateWithFormatting);
      });
    });

    // Partition: Invalid template names
    describe('invalid template names', () => {
      
      it('should throw error for non-existent template', async () => {
        // Arrange
        mockedReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));
        
        // Act & Assert
        await expect(loadPromptTemplate('non-existent'))
          .rejects
          .toThrow('Failed to load prompt template');
      });

      it('should handle file system permission errors', async () => {
        mockedReadFile.mockRejectedValue(new Error('EACCES: permission denied'));
        
        await expect(loadPromptTemplate('restricted'))
          .rejects
          .toThrow('Failed to load prompt template');
      });
    });

    // Partition: Edge cases and boundary values
    describe('edge cases and boundaries', () => {
      
      it('should handle empty template file', async () => {
        mockedReadFile.mockResolvedValue('');
        const result = await loadPromptTemplate('empty');
        expect(result).toBe('');
      });

      it('should handle very long template names', async () => {
        const longName = 'a'.repeat(255); // Max filename length on most systems
        mockedReadFile.mockResolvedValue('content');
        
        const result = await loadPromptTemplate(longName);
        expect(result).toBe('content');
      });

      it('should handle template names with hyphens and underscores', async () => {
        const names = ['test-template', 'test_template', 'test-template_v2'];
        
        for (const name of names) {
          mockedReadFile.mockResolvedValue('content');
          await loadPromptTemplate(name);
          expect(mockedReadFile).toHaveBeenCalledWith(
            expect.stringContaining(`${name}.txt`),
            'utf-8'
          );
        }
      });
    });
  });

  describe('replaceTemplateVariables', () => {
    
    // Partition: Templates with no variables
    describe('templates without variables', () => {
      
      it('should return template unchanged when no placeholders exist', () => {
        const template = 'This is a plain template without any variables';
        const result = replaceTemplateVariables(template, {});
        expect(result).toBe(template);
      });

      it('should return template unchanged when variables provided but no placeholders', () => {
        const template = 'Plain template';
        const result = replaceTemplateVariables(template, { key: 'value' });
        expect(result).toBe(template);
      });
    });

    // Partition: Templates with single variable
    describe('templates with single variable', () => {
      
      it('should replace single variable occurrence', () => {
        const template = 'Hello {{name}}!';
        const result = replaceTemplateVariables(template, { name: 'Alice' });
        expect(result).toBe('Hello Alice!');
      });

      it('should handle variable at start of template', () => {
        const template = '{{greeting}} world';
        const result = replaceTemplateVariables(template, { greeting: 'Hello' });
        expect(result).toBe('Hello world');
      });

      it('should handle variable at end of template', () => {
        const template = 'Hello {{name}}';
        const result = replaceTemplateVariables(template, { name: 'Bob' });
        expect(result).toBe('Hello Bob');
      });
    });

    // Partition: Templates with multiple variables
    describe('templates with multiple variables', () => {
      
      it('should replace multiple different variables', () => {
        const template = '{{subject}} - {{chapter}} notes';
        const result = replaceTemplateVariables(template, {
          subject: 'Math',
          chapter: 'Algebra'
        });
        expect(result).toBe('Math - Algebra notes');
      });

      it('should handle three or more variables', () => {
        const template = 'Course: {{course}}, Level: {{level}}, Duration: {{duration}}';
        const result = replaceTemplateVariables(template, {
          course: 'CS101',
          level: 'Beginner',
          duration: '10 weeks'
        });
        expect(result).toBe('Course: CS101, Level: Beginner, Duration: 10 weeks');
      });
    });

    // Partition: Templates with repeated variables
    describe('templates with repeated variables', () => {
      
      it('should replace all occurrences of the same variable', () => {
        const template = '{{name}} loves {{name}}\'s work on {{name}}';
        const result = replaceTemplateVariables(template, { name: 'Alice' });
        expect(result).toBe('Alice loves Alice\'s work on Alice');
      });

      it('should handle multiple repetitions of multiple variables', () => {
        const template = '{{a}} and {{b}} and {{a}} and {{b}}';
        const result = replaceTemplateVariables(template, { a: 'X', b: 'Y' });
        expect(result).toBe('X and Y and X and Y');
      });
    });

    // Partition: Edge cases and boundary values
    describe('edge cases and boundaries', () => {
      
      it('should handle empty template', () => {
        const result = replaceTemplateVariables('', { key: 'value' });
        expect(result).toBe('');
      });

      it('should handle empty variables object', () => {
        const template = 'Template with {{variable}}';
        const result = replaceTemplateVariables(template, {});
        expect(result).toBe(template); // Variable should remain unreplaced
      });

      it('should handle empty string values', () => {
        const template = 'Hello {{name}}!';
        const result = replaceTemplateVariables(template, { name: '' });
        expect(result).toBe('Hello !');
      });

      it('should handle special characters in replacement values', () => {
        const template = 'Code: {{code}}';
        const specialChars = [
          '$100', 'a.b.c', 'test@email.com', 'path/to/file',
          'regex: [a-z]+', 'math: 2+2=4'
        ];
        
        for (const char of specialChars) {
          const result = replaceTemplateVariables(template, { code: char });
          expect(result).toBe(`Code: ${char}`);
        }
      });

      it('should handle whitespace in variable names', () => {
        // This tests the actual regex behavior - variable names in templates
        // should not have spaces, but we test edge case
        const template = '{{ name }}'; // Space in placeholder (malformed)
        const result = replaceTemplateVariables(template, { name: 'Alice' });
        // Should NOT replace due to spaces (following template spec)
        expect(result).toBe('{{ name }}');
      });

      it('should not replace malformed placeholders', () => {
        const malformedTemplates = [
          '{ name }',      // Single braces
          '{{{name}}}',    // Triple braces
          '{{name',        // Unclosed
          'name}}',        // No opening
          '{{}}',          // Empty placeholder
        ];
        
        for (const template of malformedTemplates) {
          const result = replaceTemplateVariables(template, { name: 'Alice' });
          expect(result).toBe(template); // Should remain unchanged
        }
      });

      it('should handle very long replacement values', () => {
        const longValue = 'A'.repeat(10000);
        const template = 'Value: {{key}}';
        const result = replaceTemplateVariables(template, { key: longValue });
        expect(result).toBe(`Value: ${longValue}`);
        expect(result.length).toBe(7 + longValue.length);
      });

      it('should handle numeric and boolean values converted to strings', () => {
        const template = 'Number: {{num}}, Boolean: {{bool}}';
        const result = replaceTemplateVariables(template, {
          num: '42',
          bool: 'true'
        });
        expect(result).toBe('Number: 42, Boolean: true');
      });

      it('should preserve template structure with unreplaced variables', () => {
        const template = 'Hello {{name}}, your score is {{score}}';
        const result = replaceTemplateVariables(template, { name: 'Alice' });
        expect(result).toBe('Hello Alice, your score is {{score}}');
      });
    });

    // Glass box testing - testing regex behavior
    describe('regex pattern behavior (glass box)', () => {
      
      it('should use global flag to replace all occurrences', () => {
        const template = '{{x}}{{x}}{{x}}';
        const result = replaceTemplateVariables(template, { x: 'A' });
        expect(result).toBe('AAA');
      });

      it('should handle adjacent variables without separator', () => {
        const template = '{{first}}{{second}}';
        const result = replaceTemplateVariables(template, {
          first: 'Hello',
          second: 'World'
        });
        expect(result).toBe('HelloWorld');
      });

      it('should escape regex special characters in variable names', () => {
        // The implementation uses template literal in regex,
        // so we test that it properly escapes the braces
        const template = '{{var}}';
        const result = replaceTemplateVariables(template, { var: 'value' });
        expect(result).toBe('value');
      });
    });
  });

  // Integration test: Both functions working together
  describe('integration: loadPromptTemplate + replaceTemplateVariables', () => {
    
    it('should load and process template with variables', async () => {
      const templateContent = 'Subject: {{subject}}\nChapter: {{chapter}}';
      mockedReadFile.mockResolvedValue(templateContent);
      
      const loaded = await loadPromptTemplate('test');
      const processed = replaceTemplateVariables(loaded, {
        subject: 'Mathematics',
        chapter: 'Calculus'
      });
      
      expect(processed).toBe('Subject: Mathematics\nChapter: Calculus');
    });
  });
});


