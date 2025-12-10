import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/register
 * Handles user registration form submission
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "username": "username",
 *   "password": "password123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, accountType, subscriptionPlan } = body;

    // Validate required fields
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, username, and password are required' },
        { status: 400 }
      );
    }

    // Save to JSON file
    const dataDir = join(process.cwd(), 'data');
    const dataFilePath = join(dataDir, 'registrations.json');
    
    try {
      // Create data directory if it doesn't exist
      if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true });
      }

      // Read existing data
      let existingData = [];
      try {
        const fileContent = await readFile(dataFilePath, 'utf-8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist yet, start with empty array
        existingData = [];
      }

      // Check if user already exists (by email or username)
      const userExists = existingData.some(
        (user: any) => user.email.toLowerCase() === email.toLowerCase() || user.username.toLowerCase() === username.toLowerCase()
      );

      if (userExists) {
        return NextResponse.json(
          { error: 'User already exists with this email or username' },
          { status: 409 }
        );
      }

      // Create registration data object (store actual password for authentication)
      const registrationData = {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password, // Store actual password for authentication
        accountType: accountType || 'Student',
        subscriptionPlan: subscriptionPlan || 'Free',
        timestamp: new Date().toISOString(),
      };

      // Log to console (mask password in logs)
      console.log('=== USER REGISTRATION ===');
      console.log('Registration Data:', {
        ...registrationData,
        password: '***', // Mask in logs
      });
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================');

      // Add new registration
      existingData.push(registrationData);

      // Write back to file
      await writeFile(dataFilePath, JSON.stringify(existingData, null, 2), 'utf-8');
      console.log('Registration data saved to:', dataFilePath);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Registration successful',
          data: {
            ...registrationData,
            password: '***', // Don't send password back to client
          }
        },
        { status: 200 }
      );
    } catch (fileError) {
      // If file operations fail, still log to console
      console.error('Failed to save to file, but data logged to console:', fileError);
      return NextResponse.json(
        { error: 'Failed to save registration data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}

