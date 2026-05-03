import { cn } from '../utils'

describe('utils - cn()', () => {
  it('UT-001: Verify basic Tailwind class string concatenation', () => {
    expect(cn('bg-red', 'text-white')).toBe('bg-red text-white')
  })

  it('UT-002: Verify tailwind-merge successfully resolves conflicts', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('UT-003: Verify falsy conditionals are correctly omitted from class tree', () => {
    expect(cn('px-2', false && 'py-2', 'flex')).toBe('px-2 flex')
  })
})
