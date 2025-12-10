import { NextRequest, NextResponse } from 'next/server';
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

    // Read registrations to authenticate
    const dataDir = join(process.cwd(), 'data');
    const registrationsFilePath = join(dataDir, 'registrations.json');
    const loginsFilePath = join(dataDir, 'logins.json');

    try {
      // Create data directory if it doesn't exist
      if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true });
      }

      // Read existing registrations
      let registrations = [];
      try {
        const fileContent = await readFile(registrationsFilePath, 'utf-8');
        registrations = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist yet, no users registered
        registrations = [];
      }

      // Find user by username (case-insensitive)
      const user = registrations.find(
        (u: any) => u.username.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

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

      // Save login attempt to logins.json
      try {
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
      }

      // Return success with user data (without password)
      return NextResponse.json(
        { 
          success: true, 
          message: 'Login successful',
          data: {
            username: user.username,
            email: user.email,
            accountType: user.accountType,
            subscriptionPlan: user.subscriptionPlan,
          }
        },
        { status: 200 }
      );
    } catch (fileError) {
      console.error('Login error:', fileError);
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

