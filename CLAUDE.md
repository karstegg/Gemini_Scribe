# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Main development server:**
```bash
npm run dev
```
Runs Next.js on port 9002 with Turbopack for fast development.

**Genkit AI development:**
```bash
npm run genkit:dev    # Start Genkit development server
npm run genkit:watch  # Start with file watching
```

**Build and validation:**
```bash
npm run build      # Production build
npm run lint       # ESLint checks
npm run typecheck  # TypeScript validation
```

## Project Architecture

**Gemini Scribe** is a Next.js 15 audio transcription application that leverages Google's Genkit AI framework and Firebase services.

### Core Technology Stack
- **Frontend**: Next.js 15 with React 18, TypeScript, and Tailwind CSS
- **AI Processing**: Google Genkit with Gemini 2.0/2.5 models for transcription
- **Backend**: Firebase (Auth, Firestore, Storage) with server actions
- **UI Components**: Radix UI primitives with shadcn/ui components

### Key Architecture Patterns

**AI Flow System (src/ai/flows/)**
The app uses Genkit flows for AI operations:
- `transcribe-from-storage.ts` - Streams audio transcription from Firebase Storage
- `review-and-correct-transcription.ts` - AI-powered transcription review and correction  
- `summarize-transcription.ts` - Generates summaries from transcriptions

**Component Structure:**
- `src/components/scribe/` - Core application components (FileUpload, TranscriptionDisplay, etc.)
- `src/components/ui/` - Reusable UI primitives from shadcn/ui
- `src/app/page.tsx` - Main application logic with state management

**Service Layer (src/lib/)**
- Firebase services split by concern (client/server)
- Settings management with localStorage persistence
- Firestore operations for transcription history

### Data Flow

1. **Upload**: Audio files → Firebase Storage with progress tracking
2. **Transcription**: Storage URL → Genkit streaming transcription 
3. **Processing**: Background AI review, correction, and summarization
4. **Storage**: Results saved to Firestore with user history

### Authentication
Uses Firebase anonymous authentication - users are automatically signed in without credentials.

### Configuration Notes

- TypeScript and ESLint errors are ignored during builds (`next.config.ts`)
- Development uses Turbopack for faster builds
- Supports multiple Gemini models: `gemini-2.0-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`

### State Management
The main page component manages complex state including:
- Upload progress and cancellation handling
- Streaming transcription display
- Multi-step background processing (review, summary, save)
- View routing (transcribe, history, history detail)

### Testing
No test framework is currently configured in this project.