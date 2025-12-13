import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/login
 * Handles user login form submission
 * 
 * Request body:
 * {
 *   "username": "username",
 *   "password": "password123",
 *   "rememberMe": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: username and password are required' },
        { status: 400 }
      );
    }

    try {
      // Find user by username (case-insensitive)
      // Note: Supabase's ilike requires a pattern, so we'll use eq and handle case in application
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (queryError) {
        console.error('Error querying users:', queryError);
        return NextResponse.json(
          { error: 'Database error during authentication' },
          { status: 500 }
        );
      }

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const user = users[0];

      // Verify password
      if (user.password !== password) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      // Log successful login
      const loginData = {
        username: user.username,
        email: user.email,
        password: '***', // Don't store actual password in logs/file
        rememberMe: rememberMe || false,
        timestamp: new Date().toISOString(),
      };

      console.log('=== USER LOGIN ===');
      console.log('Login Data:', loginData);
      console.log('Timestamp:', new Date().toISOString());
      console.log('==================');

      // Save login attempt to logins.json (optional, for logging purposes)
      try {
        const dataDir = join(process.cwd(), 'data');
        const loginsFilePath = join(dataDir, 'logins.json');
        
        if (!existsSync(dataDir)) {
          await mkdir(dataDir, { recursive: true });
        }

        let loginHistory = [];
        try {
          const loginContent = await readFile(loginsFilePath, 'utf-8');
          loginHistory = JSON.parse(loginContent);
        } catch (error) {
          loginHistory = [];
        }

        loginHistory.push(loginData);
        await writeFile(loginsFilePath, JSON.stringify(loginHistory, null, 2), 'utf-8');
        console.log('Login data saved to:', loginsFilePath);
      } catch (fileError) {
        console.error('Failed to save login history:', fileError);
        // Don't fail the login if logging fails
      }

      // Return success with user data (without password)
      return NextResponse.json(
        { 
          success: true, 
          message: 'Login successful',
          data: {
            username: user.username,
            email: user.email,
            accountType: user.account_type,
            subscriptionPlan: user.subscription_plan,
          }
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}

