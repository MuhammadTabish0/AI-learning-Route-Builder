import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

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

    try {
      // Check if user already exists (by email or username)
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email, username')
        .or(`email.eq.${email.toLowerCase()},username.eq.${username.toLowerCase()}`)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing users:', checkError);
        return NextResponse.json(
          { error: 'Database error while checking user existence' },
          { status: 500 }
        );
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'User already exists with this email or username' },
          { status: 409 }
        );
      }

      // Insert new user into Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password, // Note: In production, passwords should be hashed
          account_type: accountType || 'Student',
          subscription_plan: subscriptionPlan || 'Free',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting user:', insertError);
        return NextResponse.json(
          { error: 'Failed to register user: ' + insertError.message },
          { status: 500 }
        );
      }

      // Log to console (mask password in logs)
      console.log('=== USER REGISTRATION ===');
      console.log('Registration Data:', {
        email: newUser.email,
        username: newUser.username,
        account_type: newUser.account_type,
        subscription_plan: newUser.subscription_plan,
        password: '***', // Mask in logs
      });
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================');

      return NextResponse.json(
        { 
          success: true, 
          message: 'Registration successful',
          data: {
            email: newUser.email,
            username: newUser.username,
            accountType: newUser.account_type,
            subscriptionPlan: newUser.subscription_plan,
          }
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'Internal server error during registration' },
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

