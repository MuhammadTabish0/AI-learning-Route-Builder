import jest from 'next/jest'
import { replaceTemplateVariables, loadPromptTemplate } from '../prompt-loader'
import * as fs from 'fs/promises'

jest.mock('fs/promises')

describe('prompt-loader', () => {
  it('UT-004: Verify successful multi-variable placeholder replacement', () => {
    const template = 'Hi {{name}} in {{city}}'
    const vars = { name: 'Ali', city: 'NUST' }
    expect(replaceTemplateVariables(template, vars)).toBe('Hi Ali in NUST')
  })

  it('UT-005: Original template is unmodified if no target tags exist', () => {
    const template = 'No tags'
    const vars = { name: 'Test' }
    expect(replaceTemplateVariables(template, vars)).toBe('No tags')
  })

  it('UT-006: Verify successful file path read operation', async () => {
    const mockReadFile = fs.readFile as jest.Mock
    mockReadFile.mockResolvedValue('Mock Temp String')
    
    const result = await loadPromptTemplate('course-prompt')
    expect(result).toBe('Mock Temp String')
  })

  it('UT-007: Exception is thrown appropriately if file is missing', async () => {
    const mockReadFile = fs.readFile as jest.Mock
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
    
    await expect(loadPromptTemplate('invalid')).rejects.toThrow('Failed to load prompt template')
  })
})
