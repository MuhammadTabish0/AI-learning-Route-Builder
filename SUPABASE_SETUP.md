# Supabase Setup Guide

This guide will help you set up the Supabase database for user authentication.

## Prerequisites

- Supabase project created at https://supabase.com
- Supabase URL and Anon Key (already configured in `.env`)

## Step 1: Create the Users Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase-setup.sql` into the editor
6. Click **Run** (or press `Ctrl+Enter`)

This will create:
- `users` table with the following columns:
  - `id` (UUID, primary key)
  - `email` (TEXT, unique)
  - `username` (TEXT, unique)
  - `password` (TEXT)
  - `account_type` (TEXT, default: 'Student')
  - `subscription_plan` (TEXT, default: 'Free')
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
- Indexes on `username` and `email` for faster lookups
- Row Level Security (RLS) policies for data access

## Step 2: Verify Table Creation

1. Go to **Table Editor** in your Supabase Dashboard
2. You should see the `users` table listed
3. Click on it to view the structure

## Step 3: Test the Connection

1. Restart your Next.js development server:
   ```bash
   pnpm dev
   ```

2. Try registering a new user at `/signup`
3. Try logging in at `/login`

## Environment Variables

The following environment variables are already configured in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sklbmqhhfiukpowkkvlr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Notes

⚠️ **Important**: The current implementation stores passwords in plain text. For production, you should:

1. Use Supabase Auth instead of a custom users table, OR
2. Hash passwords using `bcrypt` or similar before storing

The current setup is suitable for development/testing purposes.

## Troubleshooting

### "relation 'users' does not exist"
- Make sure you've run the SQL script in Step 1
- Check that you're connected to the correct Supabase project

### "permission denied for table users"
- Check that Row Level Security policies are correctly set up
- Verify the anon key has the correct permissions

### "Missing Supabase environment variables"
- Ensure `.env` file exists in the project root
- Restart the development server after adding environment variables
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

## Next Steps

After setup, you can:
- Register new users via `/signup`
- Login via `/login`
- View users in Supabase Dashboard > Table Editor > users

