# How to Run the Project - Instructor Guide

This guide provides step-by-step instructions for setting up and running the SwiftEd educational learning platform project.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (version 18 or higher)

  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **pnpm** (package manager)

  - Install globally: `npm install -g pnpm`
  - Verify installation: `pnpm --version`

- **Git** (optional, for cloning the repository)
  - Download from: https://git-scm.com/

## Step 1: Navigate to Project Directory

Open your terminal/command prompt and navigate to the project folder:

```bash
cd "path/to/project"
```

For example:

```bash
cd "D:\NUST\5th sem\Web Engineering\project"
```

## Step 2: Install Dependencies

Install all required packages using pnpm:

```bash
pnpm install
```

This will:

- Download all required packages
- Create `node_modules/` directory
- Install dependencies listed in `package.json`

**Expected output**: Should complete without errors. May take 2-5 minutes depending on internet speed.

## Step 3: Set Up Environment Variables (Optional)

If you want to test the AI features (roadmap, notes, questions generation), you'll need a Gemini API key:

1. Create a `.env` file in the project root directory
2. Add the following line:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The form submission features (login/registration) work without the API key. The API key is only needed for AI content generation features.

**To get a Gemini API key:**

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste into `.env` file

## Step 4: Start the Development Server

Run the development server:

```bash
pnpm dev
```

**Expected output:**

```
▲ Next.js 16.0.0 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://[your-ip]:3000
✓ Ready in [time]ms
```

The server will start on **http://localhost:3000**

## Step 5: Open in Browser

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the SwiftEd homepage.

## Step 6: Test the Forms

### Test Registration Form

1. Navigate to: `http://localhost:3000/signup`
2. Fill in the form:
   - **Email**: Use a valid email format (e.g., `test@example.com`)
   - **Username**: 3-20 characters, alphanumeric only (e.g., `testuser`)
   - **Password**: At least 8 characters with uppercase, lowercase, and number (e.g., `TestPass123`)
3. Click "Register"
4. **Expected behavior**:
   - Form validates before submission
   - Loading spinner appears
   - Success toast notification appears
   - Redirects to login page after 1.5 seconds
   - Data saved to `data/registrations.json`

### Test Login Form

1. Navigate to: `http://localhost:3000/login`
2. Fill in the form:
   - **Username**: Enter a username (e.g., `testuser`)
   - **Password**: Enter a password (e.g., `TestPass123`)
   - **Remember me**: Optional checkbox
3. Click "Login"
4. **Expected behavior**:
   - Form validates before submission
   - Loading spinner appears
   - Success toast notification appears
   - Redirects to courses page after 1.5 seconds
   - Data saved to `data/logins.json`

## Step 7: Verify Backend Data Storage

After submitting forms, check the backend data:

### Check Console Output

Look at your terminal where `pnpm dev` is running. You should see:

```
=== USER REGISTRATION ===
Registration Data: { email: '...', username: '...', ... }
Timestamp: ...
========================
Registration data saved to: [path]/data/registrations.json
```

### Check JSON Files

Navigate to the `data/` folder in the project directory:

- **`data/registrations.json`** - Contains all registration submissions
- **`data/logins.json`** - Contains all login submissions

**Note**: The `data/` folder is created automatically on first form submission.

## Step 8: Test Form Validation

### Test Registration Validation

1. Go to `/signup`
2. Try submitting empty form → Should show validation errors
3. Enter invalid email (e.g., `notanemail`) → Should show "Invalid email format"
4. Enter short username (e.g., `ab`) → Should show "Username must be at least 3 characters"
5. Enter weak password (e.g., `123`) → Should show password requirements
6. All errors appear below the respective fields with red borders

### Test Login Validation

1. Go to `/login`
2. Try submitting empty form → Should show validation errors
3. Enter short username → Should show validation error
4. Enter short password → Should show validation error

## Step 9: Test Interactive Features

### Password Toggle

1. On login or signup form
2. Click the eye icon next to password field
3. Password should toggle between hidden and visible

### Character Counter

1. On signup form
2. Type in the username field
3. See character count update in real-time (e.g., "5/20")

### Toast Notifications

1. Submit a form successfully
2. See success toast at top-center of screen
3. Submit with errors
4. See error toast with error message

### Loading States

1. Click submit button
2. Button should show spinner and "Registering..." or "Logging in..." text
3. Button should be disabled during submission

## Troubleshooting

### Port 3000 Already in Use

If you see an error about port 3000 being in use:

1. Stop other applications using port 3000, OR
2. Set a different port:
   ```bash
   pnpm dev -- -p 3001
   ```
   Then access at `http://localhost:3001`

### Dependencies Installation Fails

If `pnpm install` fails:

1. Clear cache: `pnpm store prune`
2. Delete `node_modules/` and `pnpm-lock.yaml`
3. Run `pnpm install` again

### Module Not Found Errors

If you see "Module not found" errors:

1. Ensure you ran `pnpm install`
2. Check that `node_modules/` directory exists
3. Try deleting `node_modules/` and running `pnpm install` again

### Data Folder Not Created

If `data/` folder doesn't exist after form submission:

1. Check terminal for error messages
2. Ensure the project has write permissions
3. The folder is created automatically on first submission

### Forms Not Submitting

If forms don't submit:

1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Ensure the development server is running
4. Check network tab in browser DevTools

## Project Structure Overview

```
project/
├── app/
│   ├── api/              # Backend API routes
│   │   ├── login/       # Login endpoint
│   │   └── register/    # Registration endpoint
│   ├── login/           # Login page
│   └── signup/          # Registration page
├── components/          # Reusable components
├── data/               # Form submission data (auto-created)
├── lib/                # Utility functions
└── package.json        # Project dependencies
```

## Available Scripts

- **`pnpm dev`** - Start development server
- **`pnpm build`** - Build for production
- **`pnpm start`** - Start production server
- **`pnpm lint`** - Run ESLint

## Stopping the Server

To stop the development server:

1. Go to the terminal where it's running
2. Press `Ctrl + C`
3. Confirm if prompted

## Additional Notes

- The project uses **Next.js 16** with the App Router
- Forms use **react-hook-form** and **zod** for validation
- Styling uses **Tailwind CSS**
- Notifications use **Sonner** library
- Data is stored in JSON files (can be upgraded to database later)

## Support

If you encounter any issues:

1. Check the terminal output for error messages
2. Check browser console (F12) for client-side errors
3. Verify all prerequisites are installed correctly
4. Ensure you're in the correct directory when running commands

---

**Project Status**: All Priority 1 (Critical Requirements) are fully implemented and functional.
