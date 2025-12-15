/**
 * Test Suite for utils.ts
 * 
 * Testing Strategy (MIT 6.102 Principles):
 * ===========================================
 * 
 * 1. BLACK BOX TESTING
 *    - Tests based on function specification without implementation details
 *    - cn() function combines class names using clsx and tailwind-merge
 * 
 * 2. PARTITIONING - Input space divided into:
 *    For cn(...inputs):
 *      - No arguments (empty)
 *      - Single string argument
 *      - Multiple string arguments
 *      - Conditional classes (objects)
 *      - Arrays of classes
 *      - Mixed types
 *      - Tailwind-specific: conflicting utility classes
 * 
 * 3. BOUNDARY VALUE ANALYSIS
 *    - Empty strings
 *    - undefined and null values
 *    - Very long class names
 *    - Maximum number of arguments
 * 
 * 4. EQUIVALENCE PARTITIONING
 *    - Valid class names
 *    - Invalid/falsy values
 *    - Tailwind utility conflicts
 */

import { cn } from '../utils';

describe('utils module', () => {
  
  describe('cn (className utility)', () => {
    
    // Partition: No arguments / Empty input
    describe('empty or no arguments', () => {
      
      it('should return empty string when called with no arguments', () => {
        const result = cn();
        expect(result).toBe('');
      });

      it('should return empty string for empty string argument', () => {
        const result = cn('');
        expect(result).toBe('');
      });

      it('should filter out multiple empty strings', () => {
        const result = cn('', '', '');
        expect(result).toBe('');
      });
    });

    // Partition: Single argument
    describe('single argument', () => {
      
      it('should return the class name for single string', () => {
        const result = cn('text-center');
        expect(result).toBe('text-center');
      });

      it('should handle single Tailwind utility class', () => {
        const utilities = [
          'bg-blue-500',
          'p-4',
          'rounded-lg',
          'shadow-md',
          'hover:bg-blue-600'
        ];
        
        for (const utility of utilities) {
          expect(cn(utility)).toBe(utility);
        }
      });

      it('should handle multiple classes in single string', () => {
        const result = cn('flex items-center justify-between');
        expect(result).toBe('flex items-center justify-between');
      });
    });

    // Partition: Multiple string arguments
    describe('multiple string arguments', () => {
      
      it('should concatenate multiple class strings', () => {
        const result = cn('text-center', 'font-bold', 'text-xl');
        expect(result).toBe('text-center font-bold text-xl');
      });

      it('should handle many arguments (boundary: large number)', () => {
        const classes = Array.from({ length: 20 }, (_, i) => `class-${i}`);
        const result = cn(...classes);
        expect(result).toBe(classes.join(' '));
      });

      it('should preserve order of classes', () => {
        const result = cn('first', 'second', 'third');
        expect(result).toBe('first second third');
      });
    });

    // Partition: Conditional classes (objects and falsy values)
    describe('conditional classes', () => {
      
      it('should include class when condition is true', () => {
        const result = cn({
          'bg-blue-500': true,
          'text-white': true
        });
        expect(result).toContain('bg-blue-500');
        expect(result).toContain('text-white');
      });

      it('should exclude class when condition is false', () => {
        const result = cn({
          'bg-blue-500': true,
          'text-white': false
        });
        expect(result).toContain('bg-blue-500');
        expect(result).not.toContain('text-white');
      });

      it('should handle undefined values (should be filtered out)', () => {
        const result = cn('base-class', undefined, 'another-class');
        expect(result).toBe('base-class another-class');
      });

      it('should handle null values (should be filtered out)', () => {
        const result = cn('base-class', null, 'another-class');
        expect(result).toBe('base-class another-class');
      });

      it('should handle false boolean (should be filtered out)', () => {
        const result = cn('base-class', false, 'another-class');
        expect(result).toBe('base-class another-class');
      });

      it('should handle mixed truthy and falsy values', () => {
        const result = cn(
          'always',
          false && 'never',
          true && 'sometimes',
          undefined,
          null,
          'present'
        );
        expect(result).toContain('always');
        expect(result).toContain('sometimes');
        expect(result).toContain('present');
        expect(result).not.toContain('never');
      });
    });

    // Partition: Array inputs
    describe('array inputs', () => {
      
      it('should handle array of class names', () => {
        const result = cn(['flex', 'items-center', 'gap-2']);
        expect(result).toBe('flex items-center gap-2');
      });

      it('should handle nested arrays', () => {
        const result = cn(['flex', ['items-center', 'justify-between']]);
        expect(result).toContain('flex');
        expect(result).toContain('items-center');
        expect(result).toContain('justify-between');
      });

      it('should handle empty arrays', () => {
        const result = cn('base', [], 'end');
        expect(result).toBe('base end');
      });
    });

    // Partition: Tailwind-specific - conflicting utilities
    describe('Tailwind utility conflicts (tailwind-merge behavior)', () => {
      
      it('should resolve conflicting padding utilities (last wins)', () => {
        const result = cn('p-4', 'p-6');
        // tailwind-merge should keep only the last padding value
        expect(result).toBe('p-6');
        expect(result).not.toContain('p-4');
      });

      it('should resolve conflicting background colors', () => {
        const result = cn('bg-blue-500', 'bg-red-500');
        expect(result).toBe('bg-red-500');
        expect(result).not.toContain('bg-blue-500');
      });

      it('should resolve conflicting text sizes', () => {
        const result = cn('text-sm', 'text-lg', 'text-xl');
        expect(result).toBe('text-xl');
        expect(result).not.toContain('text-sm');
        expect(result).not.toContain('text-lg');
      });

      it('should keep non-conflicting utilities', () => {
        const result = cn('p-4', 'bg-blue-500', 'p-6', 'text-white');
        expect(result).toContain('p-6');
        expect(result).toContain('bg-blue-500');
        expect(result).toContain('text-white');
      });

      it('should handle directional conflicts (px vs p)', () => {
        const result = cn('p-4', 'px-6');
        // px-6 should override x-axis padding from p-4
        expect(result).toContain('px-6');
        // Should keep y-axis padding from p-4
        expect(result).toContain('p-4');
      });
    });

    // Partition: Complex real-world scenarios
    describe('real-world usage patterns', () => {
      
      it('should handle button variant pattern', () => {
        const variant = 'primary';
        const result = cn(
          'px-4 py-2 rounded font-semibold transition-colors',
          {
            'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
            'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary'
          }
        );
        
        expect(result).toContain('px-4');
        expect(result).toContain('py-2');
        expect(result).toContain('bg-blue-500');
        expect(result).not.toContain('bg-gray-200');
      });

      it('should handle responsive classes', () => {
        const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
        expect(result).toContain('text-sm');
        expect(result).toContain('md:text-base');
        expect(result).toContain('lg:text-lg');
      });

      it('should handle state variants (hover, focus, active)', () => {
        const result = cn(
          'bg-blue-500',
          'hover:bg-blue-600',
          'focus:ring-2',
          'active:bg-blue-700'
        );
        expect(result).toContain('bg-blue-500');
        expect(result).toContain('hover:bg-blue-600');
        expect(result).toContain('focus:ring-2');
        expect(result).toContain('active:bg-blue-700');
      });

      it('should handle dark mode classes', () => {
        const result = cn('bg-white', 'dark:bg-gray-900', 'text-black', 'dark:text-white');
        expect(result).toContain('bg-white');
        expect(result).toContain('dark:bg-gray-900');
        expect(result).toContain('text-black');
        expect(result).toContain('dark:text-white');
      });
    });

    // Partition: Edge cases and boundary values
    describe('edge cases and boundaries', () => {
      
      it('should handle very long class names', () => {
        const longClass = 'very-long-class-name-that-exceeds-typical-length-' + 'a'.repeat(100);
        const result = cn(longClass);
        expect(result).toBe(longClass);
      });

      it('should handle class names with special characters', () => {
        // Tailwind allows alphanumeric, hyphens, underscores, and some special chars
        const result = cn('hover:bg-blue-500/50', 'w-[100px]', 'bg-[#1da1f2]');
        expect(result).toContain('hover:bg-blue-500/50');
        expect(result).toContain('w-[100px]');
        expect(result).toContain('bg-[#1da1f2]');
      });

      it('should handle duplicate class names', () => {
        const result = cn('flex', 'flex', 'flex');
        // clsx should deduplicate
        expect(result).toBe('flex');
      });

      it('should handle whitespace variations', () => {
        const result = cn('  spaced  ', 'normal', '  another  ');
        expect(result).toBe('spaced normal another');
      });

      it('should handle zero (number 0) as falsy', () => {
        const result = cn('base', 0 && 'hidden', 'end');
        expect(result).toBe('base end');
      });

      it('should handle empty objects', () => {
        const result = cn('base', {}, 'end');
        expect(result).toBe('base end');
      });
    });

    // Glass box testing - Understanding clsx + tailwind-merge interaction
    describe('implementation behavior (glass box)', () => {
      
      it('should apply clsx first, then tailwind-merge', () => {
        // This tests the order of operations in cn function
        const result = cn(
          { 'p-4': true, 'p-6': false },
          'p-8'
        );
        expect(result).toBe('p-8');
      });

      it('should handle all clsx input types', () => {
        const result = cn(
          'string-class',              // string
          { conditional: true },       // object
          ['array-class'],            // array
          undefined,                  // undefined
          null,                       // null
          false,                      // boolean
          'another-string'            // string
        );
        
        expect(result).toContain('string-class');
        expect(result).toContain('conditional');
        expect(result).toContain('array-class');
        expect(result).toContain('another-string');
      });
    });
  });
});


