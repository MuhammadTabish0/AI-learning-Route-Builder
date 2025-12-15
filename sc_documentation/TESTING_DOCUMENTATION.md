# Testing Documentation - MIT 6.102 Software Construction Principles

## Table of Contents
1. [Overview](#overview)
2. [Testing Principles Applied](#testing-principles-applied)
3. [Test Suite Structure](#test-suite-structure)
4. [Testing Strategy](#testing-strategy)
5. [How to Run Tests](#how-to-run-tests)
6. [Coverage Reports](#coverage-reports)
7. [Continuous Integration](#continuous-integration)
8. [Examples and Best Practices](#examples-and-best-practices)

---

## Overview

This document explains the comprehensive testing infrastructure integrated into the AI Learning Route Builder project, following principles from **MIT 6.102: Software Construction** ([Reference](https://web.mit.edu/6.102/www/sp25/classes/02-testing/)).

### What Was Added

- ✅ **Jest Testing Framework** - Industry-standard testing framework for TypeScript/JavaScript
- ✅ **Unit Tests** - For all utility and AI generator modules
- ✅ **Integration Tests** - For end-to-end workflows
- ✅ **Automated Regression Testing** - CI/CD pipeline with GitHub Actions
- ✅ **Code Coverage Reporting** - Track test coverage metrics
- ✅ **Test Automation Scripts** - Convenient commands for running tests

### No Functionality Changed

**Important:** All testing code is non-invasive. No existing functionality has been modified. Tests only verify that existing code works correctly.

---

## Testing Principles Applied

### 1. Test-First Programming Mindset

While we added tests to existing code (rather than writing them first), the test suites are written following test-first principles:

- **Specification-based**: Tests are written based on function specifications (interfaces and JSDoc comments)
- **Comprehensive**: Tests cover all expected behaviors before examining implementation
- **Validation**: Tests serve to validate specifications and catch ambiguities

**Example from `lib/__tests__/prompt-loader.test.ts`:**
```typescript
/**
 * Testing Strategy:
 * 1. BLACK BOX TESTING - Based on specification
 * 2. PARTITIONING - Input space divided into categories
 * 3. BOUNDARY VALUE ANALYSIS
 * 4. GLASS BOX TESTING - Implementation-aware tests
 */
```

### 2. Systematic Testing with Partitioning

Each test suite uses **input space partitioning** to ensure comprehensive coverage:

**Example - `replaceTemplateVariables` partitions:**
- Templates with no variables
- Templates with single variable
- Templates with multiple variables
- Templates with repeated variables
- Edge cases: empty strings, special characters, malformed placeholders

**Benefits:**
- Ensures all input categories are tested
- Avoids haphazard testing
- Makes testing strategy explicit and reviewable

### 3. Boundary Value Analysis

Tests specifically target boundary conditions where bugs commonly occur:

**Examples:**
- Empty strings (`""`)
- Empty arrays (`[]`)
- Single-element arrays
- Very large inputs (1000+ items)
- Maximum string lengths
- Minimum/maximum numeric values

**From `lib/__tests__/utils.test.ts`:**
```typescript
it('should handle very long class names', () => {
  const longClass = 'very-long-class-name-' + 'a'.repeat(100);
  const result = cn(longClass);
  expect(result).toBe(longClass);
});
```

### 4. Black Box Testing

Tests focus on **input/output behavior** without relying on implementation details:

- Tests use public APIs only
- Tests verify behavior against specifications
- Tests remain valid even if implementation changes

**Example from `ai/__tests__/roadmapGenerator.test.ts`:**
```typescript
it('should generate roadmap for common academic subject', async () => {
  const result = await generateRoadmap('Linear Algebra');
  
  expect(result).toBeDefined();
  expect(result.subject).toBe('Linear Algebra');
  expect(Array.isArray(result.chapters)).toBe(true);
});
```

### 5. Glass Box Testing

Selected tests examine **implementation-specific behavior** to ensure edge cases are handled:

- Tests for error handling paths
- Tests for specific validation logic
- Tests for regex patterns and algorithms

**Example from `lib/__tests__/prompt-loader.test.ts`:**
```typescript
describe('regex pattern behavior (glass box)', () => {
  it('should use global flag to replace all occurrences', () => {
    const template = '{{x}}{{x}}{{x}}';
    const result = replaceTemplateVariables(template, { x: 'A' });
    expect(result).toBe('AAA');
  });
});
```

### 6. Unit Testing

Each module is tested **in isolation** using mocks for dependencies:

- `lib/prompt-loader.ts` - Mocks file system (`fs/promises`)
- `lib/llm-client.ts` - Tests pure functions without API calls
- `ai/roadmapGenerator.ts` - Mocks prompt-loader and llm-client

**Benefits:**
- Fast test execution
- Reliable, repeatable results
- Isolates bugs to specific modules

### 7. Integration Testing

Integration tests verify **modules working together**:

**From `__tests__/integration/course-generation.integration.test.ts`:**
```typescript
it('should generate complete course with roadmap, notes, questions, and resources', async () => {
  // Tests full workflow:
  // 1. Generate roadmap
  // 2. Generate notes for chapter
  // 3. Generate questions for chapter
  // 4. Generate resources
  // 5. Verify consistency across all components
});
```

### 8. Automated Regression Testing

Tests run automatically to prevent bugs from returning:

- **Pre-commit**: Run tests before committing code
- **CI/CD**: Run tests on every push and pull request
- **Coverage tracking**: Monitor test coverage over time

---

## Test Suite Structure

```
AI-learning-Route-Builder/
├── lib/__tests__/                       # Unit tests for utility modules
│   ├── prompt-loader.test.ts           # 100+ test cases for prompt loading
│   ├── utils.test.ts                    # 60+ test cases for utilities
│   └── llm-client.test.ts              # 70+ test cases for LLM client
├── ai/__tests__/                        # Unit tests for AI generators
│   ├── roadmapGenerator.test.ts        # 40+ test cases
│   ├── notesGenerator.test.ts          # 35+ test cases
│   ├── questionGenerator.test.ts       # 30+ test cases
│   └── resourcesGenerator.test.ts      # 35+ test cases
├── __tests__/integration/               # Integration tests
│   └── course-generation.integration.test.ts  # End-to-end workflows
├── jest.config.js                       # Jest configuration
├── jest.setup.js                        # Test environment setup
└── scripts/run-tests.sh                # Test execution script
```

### Test Count Summary

| Module | Test Cases | Coverage Target |
|--------|-----------|-----------------|
| `prompt-loader.ts` | 100+ | 100% |
| `utils.ts` | 60+ | 100% |
| `llm-client.ts` | 70+ | 95%+ |
| `roadmapGenerator.ts` | 40+ | 100% |
| `notesGenerator.ts` | 35+ | 100% |
| `questionGenerator.ts` | 30+ | 100% |
| `resourcesGenerator.ts` | 35+ | 100% |
| **Integration Tests** | 15+ | N/A |
| **Total** | **385+** | **80%+ overall** |

---

## Testing Strategy

### Partitioning Examples

#### `loadPromptTemplate(templateName: string)`

**Input Partitions:**
1. Valid template names (existing files)
   - Standard names: 'roadmap', 'notes', 'questions'
   - Custom names with hyphens/underscores
2. Invalid template names (non-existent files)
3. Edge cases:
   - Empty string
   - Very long names (255 characters)
   - Special characters

**Expected Behaviors:**
- Valid inputs → Returns template content
- Invalid inputs → Throws descriptive error
- Edge cases → Handles gracefully or errors appropriately

#### `generateRoadmap(subject: string)`

**Input Partitions:**
1. Common academic subjects: 'Mathematics', 'Physics'
2. Technical subjects: 'Machine Learning', 'Web Development'
3. Special characters: 'C++ Programming', 'Data Structures & Algorithms'
4. Edge cases: single character, very long names, unicode

**Response Validation Partitions:**
1. Valid structure with all required fields
2. Missing subject field
3. Missing chapters field
4. Chapters not an array
5. Empty chapters array (boundary)

### Coverage Strategy

We use **multiple levels of coverage**:

1. **Statement Coverage**: Every line of code executed
2. **Branch Coverage**: Every if/else path taken
3. **Function Coverage**: Every function called
4. **Line Coverage**: Every line tested

**Coverage Thresholds (jest.config.js):**
```javascript
coverageThresholds: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
}
```

---

## How to Run Tests

### Using NPM Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Using Test Script (Unix/Linux/Mac)

```bash
# Make script executable (first time only)
chmod +x scripts/run-tests.sh

# Run all tests
./scripts/run-tests.sh

# Run with coverage
./scripts/run-tests.sh coverage

# Run in watch mode
./scripts/run-tests.sh watch

# Run specific test file
./scripts/run-tests.sh specific lib/__tests__/utils.test.ts

# Show help
./scripts/run-tests.sh help
```

### Running Specific Tests

```bash
# Run tests in a specific file
npm test -- lib/__tests__/prompt-loader.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should replace"

# Run tests in a directory
npm test -- ai/__tests__/
```

### Running Tests in Your IDE

Most IDEs have built-in Jest support:

- **VS Code**: Install "Jest" extension, click play buttons in test files
- **WebStorm**: Right-click test file → "Run tests"
- **Cursor**: Same as VS Code

---

## Coverage Reports

### Generating Coverage Reports

```bash
npm run test:coverage
```

This generates:
- Console summary
- HTML report in `./coverage/lcov-report/index.html`
- Coverage data in `./coverage/coverage-final.json`

### Understanding Coverage Reports

**Coverage Metrics:**
- **Statements**: % of code statements executed
- **Branches**: % of if/else branches taken
- **Functions**: % of functions called
- **Lines**: % of lines executed

**Coverage Colors:**
- 🟢 Green (80-100%): Good coverage
- 🟡 Yellow (50-79%): Needs improvement
- 🔴 Red (0-49%): Poor coverage

### Example Coverage Output

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   85.5  |   82.3   |   90.1  |   85.5  |
 ai/                      |   95.2  |   91.7   |   100   |   95.2  |
  roadmapGenerator.ts     |   100   |   100    |   100   |   100   |
  notesGenerator.ts       |   100   |   100    |   100   |   100   |
  questionGenerator.ts    |   100   |   100    |   100   |   100   |
 lib/                     |   88.9  |   85.2   |   92.3  |   88.9  |
  prompt-loader.ts        |   100   |   100    |   100   |   100   |
  llm-client.ts           |   78.5  |   70.8   |   85.7  |   78.5  |
  utils.ts                |   100   |   100    |   100   |   100   |
--------------------------|---------|----------|---------|---------|
```

---

## Continuous Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. ✅ Checkout code
2. ✅ Setup Node.js (matrix: 18.x, 20.x)
3. ✅ Install dependencies
4. ✅ Run linter
5. ✅ Run all tests
6. ✅ Generate coverage report
7. ✅ Upload coverage to Codecov
8. ✅ Archive test results

**Benefits:**
- Catches bugs before merging
- Ensures tests pass on multiple Node.js versions
- Provides automated feedback on pull requests
- Maintains code quality standards

### Setting Up CI

1. Push code to GitHub
2. GitHub Actions automatically runs
3. View results in "Actions" tab
4. Tests must pass before merging PRs

---

## Examples and Best Practices

### Example 1: Testing with Partitioning

```typescript
describe('replaceTemplateVariables', () => {
  // Partition: Templates with no variables
  describe('templates without variables', () => {
    it('should return template unchanged when no placeholders exist', () => {
      const template = 'Plain template';
      const result = replaceTemplateVariables(template, {});
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
  });

  // Partition: Edge cases
  describe('edge cases', () => {
    it('should handle empty template', () => {
      const result = replaceTemplateVariables('', { key: 'value' });
      expect(result).toBe('');
    });
  });
});
```

**Why This Works:**
- ✅ Organized by input partitions
- ✅ Clear test names describe behavior
- ✅ Each partition tests a distinct category
- ✅ Edge cases explicitly identified

### Example 2: Testing Error Handling

```typescript
describe('error handling', () => {
  it('should throw error for non-existent template', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));
    
    await expect(loadPromptTemplate('non-existent'))
      .rejects
      .toThrow('Failed to load prompt template');
  });

  it('should preserve error messages', async () => {
    const originalError = new Error('Specific problem');
    mockCallLLM.mockRejectedValue(originalError);
    
    await expect(generateRoadmap('Test'))
      .rejects
      .toThrow('Specific problem');
  });
});
```

**Why This Works:**
- ✅ Tests that errors are thrown when expected
- ✅ Verifies error messages are meaningful
- ✅ Ensures errors propagate correctly

### Example 3: Integration Testing

```typescript
it('should generate complete course workflow', async () => {
  // Arrange: Set up all mocks
  mockCallLLM
    .mockResolvedValueOnce(JSON.stringify(roadmapData))
    .mockResolvedValueOnce(JSON.stringify(notesData))
    .mockResolvedValueOnce(JSON.stringify(questionsData));
  
  // Act: Execute workflow
  const roadmap = await generateRoadmap('Subject');
  const notes = await generateNotes('Subject', roadmap.chapters[0]);
  const questions = await generateQuestions('Subject', roadmap.chapters[0]);
  
  // Assert: Verify consistency
  expect(roadmap.subject).toBe(notes.subject);
  expect(notes.chapter).toBe(questions.chapter);
});
```

**Why This Works:**
- ✅ Tests realistic user workflows
- ✅ Verifies data consistency across modules
- ✅ Catches integration issues

---

## Best Practices Summary

### DO ✅

1. **Write descriptive test names**
   ```typescript
   it('should replace all occurrences of the same variable', () => { ... });
   ```

2. **Organize tests by partitions**
   ```typescript
   describe('valid inputs', () => { ... });
   describe('invalid inputs', () => { ... });
   describe('edge cases', () => { ... });
   ```

3. **Test one behavior per test**
   ```typescript
   it('should handle empty string', () => { ... });
   it('should handle null value', () => { ... });
   ```

4. **Use AAA pattern (Arrange, Act, Assert)**
   ```typescript
   // Arrange
   const input = 'test';
   // Act
   const result = function(input);
   // Assert
   expect(result).toBe(expected);
   ```

5. **Mock external dependencies**
   ```typescript
   jest.mock('@/lib/llm-client');
   ```

### DON'T ❌

1. **Don't test implementation details**
   ```typescript
   // ❌ Bad: Testing internal variable names
   expect(result.internalCounter).toBe(5);
   
   // ✅ Good: Testing observable behavior
   expect(result.items).toHaveLength(5);
   ```

2. **Don't write interdependent tests**
   ```typescript
   // ❌ Bad: Test depends on previous test
   let sharedState;
   it('test 1', () => { sharedState = 'value'; });
   it('test 2', () => { expect(sharedState).toBe('value'); });
   
   // ✅ Good: Each test is independent
   beforeEach(() => { setupFreshState(); });
   ```

3. **Don't ignore edge cases**
   ```typescript
   // ❌ Bad: Only testing happy path
   it('should work', () => { ... });
   
   // ✅ Good: Testing edge cases too
   it('should handle empty input', () => { ... });
   it('should handle very large input', () => { ... });
   ```

---

## Maintenance and Updates

### Adding New Tests

When adding new functionality:

1. **Create test file** in appropriate `__tests__` directory
2. **Follow naming convention**: `<module-name>.test.ts`
3. **Document testing strategy** in file header
4. **Use partitioning** to organize tests
5. **Run tests** to ensure they pass
6. **Check coverage** to ensure adequate coverage

### Updating Existing Tests

When modifying code:

1. **Update tests first** if behavior changes
2. **Run tests** to verify changes
3. **Update documentation** if testing strategy changes
4. **Maintain coverage** levels

---

## Troubleshooting

### Tests Failing

```bash
# Run specific failing test for details
npm test -- path/to/failing.test.ts

# Run with verbose output
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache
```

### Coverage Not Updating

```bash
# Clear coverage data
rm -rf coverage/

# Regenerate
npm run test:coverage
```

### Mock Issues

```bash
# Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

# Reset all mocks
beforeEach(() => {
  jest.resetAllMocks();
});
```

---

## References and Further Reading

### MIT 6.102 Resources

- **Reading 2: Testing**: https://web.mit.edu/6.102/www/sp25/classes/02-testing/
  - Test-first programming
  - Systematic testing with partitioning
  - Black box and glass box testing
  - Coverage and regression testing

### Jest Documentation

- **Getting Started**: https://jestjs.io/docs/getting-started
- **Using Matchers**: https://jestjs.io/docs/using-matchers
- **Mock Functions**: https://jestjs.io/docs/mock-functions

### Testing Best Practices

- **Test Pyramid**: Unit tests (70%) > Integration tests (20%) > E2E tests (10%)
- **F.I.R.S.T. Principles**: Fast, Independent, Repeatable, Self-validating, Timely
- **Given-When-Then**: Alternative to Arrange-Act-Assert

---

## Conclusion

This testing infrastructure provides:

✅ **Comprehensive Coverage**: 385+ test cases across all modules
✅ **Multiple Testing Levels**: Unit, integration, and regression tests
✅ **Automated Execution**: CI/CD pipeline with GitHub Actions
✅ **Quality Metrics**: Coverage reports and thresholds
✅ **Developer Experience**: Easy-to-use scripts and commands
✅ **Documentation**: Clear explanations and examples
✅ **Best Practices**: Following MIT 6.102 principles

**No functionality has been changed** - all tests verify existing behavior.

The test suite serves as:
- **Regression prevention**: Catches bugs when code changes
- **Living documentation**: Shows how modules should behave
- **Refactoring safety net**: Allows confident code improvements
- **Quality assurance**: Maintains code quality standards

For questions or issues, refer to the test files themselves - they contain extensive documentation and examples.

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Author**: AI Learning Route Builder Team
**Course Reference**: MIT 6.102 - Software Construction


