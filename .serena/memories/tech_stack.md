# Tech Stack

## Core Technologies
- **Runtime**: Node.js with TypeScript
- **Package Manager**: pnpm (evidenced by pnpm-lock.yaml)
- **Build System**: TypeScript compiler (tsc)
- **Module System**: CommonJS

## Key Dependencies
- **AI/ML**: 
  - `@ai-sdk/google` (v1.2.19) - Google Gemini AI integration
  - `@openrouter/ai-sdk-provider` (v0.7.2) - OpenRouter AI provider
  - `ai` (v4.3.16) - AI SDK framework
  - `replicate` (v1.0.1) - Replicate API for video generation

- **Database**: 
  - `@supabase/supabase-js` (v2.50.0) - Supabase client
  - `supabase` (v2.26.9) - Supabase CLI (dev dependency)

- **Web Server**: 
  - `express` (v5.1.0) - Web framework
  - `cors` (v2.8.5) - Cross-origin resource sharing
  - `helmet` (v8.1.0) - Security middleware

- **Utilities**:
  - `dotenv` (v16.5.0) - Environment variable management
  - `zod` (v3.25.67) - Schema validation

## Development Tools
- **TypeScript**: v5.8.3 with strict mode enabled
- **Dev Server**: `tsx` (v4.20.3) with watch mode
- **Process Manager**: `nodemon` (v3.1.10)
- **Type Generation**: Supabase type generation

## TypeScript Configuration
- Target: ES2022
- Module: CommonJS
- Strict mode enabled
- Output directory: `./dist`
- Source directory: `./src`