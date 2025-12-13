import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

/**
 * GET /api/user-courses?username=xxx
 * Fetches all courses for a specific user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const { data: courses, error } = await supabase
      .from('user_courses')
      .select('*')
      .eq('username', username.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ courses: courses || [] }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/user-courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-courses
 * Saves a course for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, courseName, courseData, image } = body;

    if (!username || !courseName || !courseData) {
      return NextResponse.json(
        { error: 'Missing required fields: username, courseName, and courseData are required' },
        { status: 400 }
      );
    }

    // Check if course already exists for this user
    const { data: existing, error: checkError } = await supabase
      .from('user_courses')
      .select('id')
      .eq('username', username.toLowerCase())
      .eq('course_name', courseName)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing course:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      // Update existing course
      const { data: updated, error: updateError } = await supabase
        .from('user_courses')
        .update({
          course_data: courseData,
          image: image || '/placeholder.jpg',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating course:', updateError);
        return NextResponse.json(
          { error: 'Failed to update course' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, course: updated },
        { status: 200 }
      );
    } else {
      // Insert new course
      const { data: newCourse, error: insertError } = await supabase
        .from('user_courses')
        .insert({
          username: username.toLowerCase(),
          course_name: courseName,
          course_data: courseData,
          image: image || '/placeholder.jpg',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting course:', insertError);
        return NextResponse.json(
          { error: 'Failed to save course' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, course: newCourse },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/user-courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

