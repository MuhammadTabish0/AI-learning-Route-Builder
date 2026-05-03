describe('supabase client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('UT-019: Exception is thrown appropriately if env variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => {
      require('../supabase')
    }).toThrow('Missing Supabase environment variables')
  })

  it('UT-020: Supabase client is initialized successfully with proper env variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'

    const { supabase } = require('../supabase')
    
    expect(supabase).toBeDefined()
    // It should be an object containing standard Supabase client properties (like `auth`, `from`, etc.)
    expect(typeof supabase.from).toBe('function')
  })
})
