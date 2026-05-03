import { NextRequest } from 'next/server';
import { POST as loginPOST } from '../../app/api/login/route';
import { POST as registerPOST } from '../../app/api/register/route';
import { GET as coursesGET, POST as coursesPOST} from '../../app/api/user-courses/route';
import { supabase } from '../../lib/supabase-server';

// Mock the file system calls inside login route
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('[]'),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('../../lib/supabase-server', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('API Routes Tests (UT-011 to UT-020)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createJsonRequest = (body: any) => 
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);
    
  const createGetRequest = (url: string) => 
    ({ url } as unknown as NextRequest);

  // UT-011 login/route.ts POST Valid login 200 200
  it('UT-011: login/route.ts POST Valid login returns 200', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [{ username: 'testuser', password: 'password123', email: 'test@test.com' }],
          error: null
        })
      })
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = createJsonRequest({ username: 'testuser', password: 'password123' });
    const response = await loginPOST(req);
    
    expect(response.status).toBe(200);
  });

  // UT-012 login/route.ts POST Invalid login 401 401
  it('UT-012: login/route.ts POST Invalid login returns 401', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [], // No user found
          error: null
        })
      })
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = createJsonRequest({ username: 'invalid', password: 'bad' });
    const response = await loginPOST(req);
    
    expect(response.status).toBe(401);
  });

  // UT-013 login/route.ts POST Invalid payload 400 400
  it('UT-013: login/route.ts POST Invalid payload returns 400', async () => {
    const req = createJsonRequest({ username: 'onlyusername' }); // missing password
    const response = await loginPOST(req);
    
    expect(response.status).toBe(400);
  });

  // UT-014 register/route.ts POST New user 200 200
  it('UT-014: register/route.ts POST New user returns 200', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      or: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [], // No existing user
          error: null
        })
      })
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { username: 'newuser', email: 'new@user.com' },
          error: null
        })
      })
    });
    
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'users') {
        return { select: mockSelect, insert: mockInsert };
      }
      return {};
    });

    const req = createJsonRequest({ email: 'new@user.com', username: 'newuser', password: 'secure' });
    const response = await registerPOST(req);
    
    expect(response.status).toBe(200);
  });

  // UT-015 register/route.ts POST Duplicate user 409 409
  it('UT-015: register/route.ts POST Duplicate user returns 409', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      or: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [{ email: 'dup@user.com' }], // User exists!
          error: null
        })
      })
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = createJsonRequest({ email: 'dup@user.com', username: 'newuser', password: 'secure' });
    const response = await registerPOST(req);
    
    expect(response.status).toBe(409);
  });

  // UT-016 user-courses/route.ts GET Fetch user data 200 + data Same
  it('UT-016: user-courses/route.ts GET Fetch user data returns 200 and data', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [{ id: 1, course_name: 'AI 101' }],
          error: null
        })
      })
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = createGetRequest('http://localhost/api/user-courses?username=testuser');
    const response = await coursesGET(req);
    const body = await response.json();
    
    expect(response.status).toBe(200);
    expect(body.courses).toHaveLength(1);
    expect(body.courses[0].course_name).toBe('AI 101');
  });

  // UT-017 user-courses/route.ts GET No auth access 401 401
  it('UT-017: user-courses/route.ts GET No auth access returns 401', async () => {
    // Missing username parameter means unauthorized
    const req = createGetRequest('http://localhost/api/user-courses');
    const response = await coursesGET(req);
    
    expect(response.status).toBe(401);
  });

  // UT-018 user-courses/route.ts POST DB failure handling 500 500
  it('UT-018: user-courses/route.ts POST DB failure handling returns 500', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('DB Connection Lost')
          })
        })
      })
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = createJsonRequest({ username: 'testuser', courseName: 'AI 101', courseData: '{}' });
    const response = await coursesPOST(req);
    
    expect(response.status).toBe(500);
  });

  // UT-020 user-courses/route.ts POST Valid course create 201 201
  it('UT-020: user-courses/route.ts POST Valid course create returns 201', async () => {
    // Mock to indicate course does not exist yet
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [], // No existing course
            error: null
          })
        })
      })
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 2, course_name: 'New Course' },
          error: null
        })
      })
    });

    (supabase.from as jest.Mock).mockImplementation(() => {
      return { select: mockSelect, insert: mockInsert };
    });

    const req = createJsonRequest({ username: 'tester', courseName: 'New Course', courseData: '{}' });
    const response = await coursesPOST(req);
    
    expect(response.status).toBe(201);
  });
});
