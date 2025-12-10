# AI Backend Setup Guide

## Quick Start

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
pnpm install
```

### 2. Configure Gemini API Key

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

**Get your API key:**

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

### 3. Start the Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`

### 4. Test the API

You can test the endpoints using:

**cURL:**

```bash
# Generate roadmap
curl -X POST http://localhost:3000/api/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{"subject": "Linear Algebra"}'
```

**Or use a tool like Postman, Insomnia, or Thunder Client (VS Code extension)**

## Project Structure

```
/
├── ai/                          # AI generator modules
│   ├── roadmapGenerator.ts      # Generates subject roadmaps
│   ├── notesGenerator.ts        # Generates chapter notes
│   ├── questionGenerator.ts     # Generates practice questions
│   └── resourcesGenerator.ts    # Generates external resources
│
├── app/api/                      # Next.js API routes
│   ├── generate-roadmap/        # POST /api/generate-roadmap
│   ├── generate-notes/          # POST /api/generate-notes
│   ├── generate-questions/      # POST /api/generate-questions
│   └── generate-resources/      # POST /api/generate-resources
│
├── lib/                         # Utility functions
│   ├── llm-client.ts           # Gemini API client
│   └── prompt-loader.ts        # Prompt template loader
│
└── prompts/                     # Prompt templates
    ├── roadmap.txt
    ├── notes.txt
    ├── questions.txt
    └── resources.txt
```

## Available Endpoints

1. **POST /api/generate-roadmap** - Generate subject roadmap
2. **POST /api/generate-notes** - Generate chapter notes
3. **POST /api/generate-questions** - Generate practice questions
4. **POST /api/generate-resources** - Generate external resources

See `API_DOCUMENTATION.md` for detailed API documentation.

## Environment Variables

| Variable         | Description         | Required |
| ---------------- | ------------------- | -------- |
| `GEMINI_API_KEY` | Your Gemini API key | Yes      |

## Troubleshooting

### "GEMINI_API_KEY is not set"

- Make sure you've created a `.env` file in the root directory
- Verify the variable name is exactly `GEMINI_API_KEY`
- Restart the development server after adding the `.env` file

### "Failed to load prompt template"

- Ensure the `prompts/` directory exists with all `.txt` files
- Check file permissions

### API errors

- Verify your Gemini API key is valid
- Check your Google Cloud account has sufficient quota
- Review the error message in the API response

## Next Steps

1. Integrate the API endpoints with your frontend
2. Add authentication/authorization if needed
3. Implement caching for frequently requested content
4. Add rate limiting to prevent abuse
5. Set up monitoring and logging

## Cost Considerations

The default model is `gemini-1.5-flash` which is cost-effective and fast. For higher quality (but more expensive), you can modify the model in `lib/llm-client.ts`:

```typescript
const generativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-pro", // Higher quality model
  // ...
});
```
