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

## Development Environment Setup (Firebase Studio/Project IDX)

### Firebase Configuration
The app requires proper Firebase configuration for both client and server-side operations:

**Environment Variables Required:**
```bash
# Set these environment variables in Firebase Studio:
export GOOGLE_APPLICATION_CREDENTIALS=/home/user/studio/serviceAccountKey.json
export GOOGLE_API_KEY=your_gemini_api_key_here  # For AI transcription
```

**`.env.local` file should contain:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCEmve1Lk7f8aDLo-sBhF5UqP6nAiNWj8o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=audio-transcription-serv-80134.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=audio-transcription-serv-80134
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=audio-transcription-serv-80134.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1071065609653
NEXT_PUBLIC_FIREBASE_APP_ID=1:1071065609653:web:545d1ff8f8a1a383d46328
```

### Known Issues & Solutions

**1. Firebase API Key Errors:**
- Ensure API key in `.env.local` matches Firebase Console Web API Key
- Current working key: `AIzaSyCEmve1Lk7f8aDLo-sBhF5UqP6nAiNWj8o`

**2. Firebase Admin SDK Issues:**
- Use direct service account file path approach via `GOOGLE_APPLICATION_CREDENTIALS`
- Avoid base64 encoding - it causes JSON parsing errors
- Ensure `serviceAccountKey.json` is current (regenerate if signature errors occur)

**3. File Size Limits:**
- Current limit: ~10-12MB for audio files
- Files over ~25MB fail with `content size over limit` error
- Smaller test files (3 minutes) work perfectly for testing

**4. Cross-Origin Warnings:**
- Expected in Firebase Studio environment
- Does not affect functionality
- Related to Next.js dev server running in containerized environment

### Successful Configuration Steps (July 2024)
1. ✅ Fixed Firebase client API key mismatch
2. ✅ Resolved Firebase Admin SDK JSON parsing errors  
3. ✅ Fixed storage URL signature issues with proper cert() usage
4. ✅ Verified end-to-end transcription works for files under 12MB
5. ✅ Anonymous authentication working properly

### Development Workflow
```bash
# In Firebase Studio IDE terminal:
export GOOGLE_APPLICATION_CREDENTIALS=/home/user/studio/serviceAccountKey.json
export GOOGLE_API_KEY=your_actual_api_key
npm run dev
# App runs on port 9002
```

## Complete Troubleshooting Guide

### Issue Resolution History (July 2024)

**Problem 1: Firebase API Key Invalid Error**
- **Error**: `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`
- **Root Cause**: Hardcoded API key in `src/lib/firebase.ts` didn't match Firebase Console
- **Solution**: 
  1. Updated `firebase.ts` to use environment variables
  2. Found correct API key in Firebase Console: `AIzaSyCEmve1Lk7f8aDLo-sBhF5UqP6nAiNWj8o`
  3. Updated `next.config.ts` with fallback values for Firebase Studio environment
- **Files Changed**: `src/lib/firebase.ts`, `next.config.ts`, `.env.local`

**Problem 2: Firebase Admin SDK JSON Parsing Errors**
- **Error**: `Unterminated string in JSON at position 113`
- **Root Cause**: Base64 encoded service account credentials were corrupted in environment variables
- **Solution**:
  1. Removed all base64 approaches
  2. Used direct service account file path via `GOOGLE_APPLICATION_CREDENTIALS`
  3. Updated `firebase.server.ts` to use `admin.credential.cert()` properly
- **Files Changed**: `src/lib/firebase.server.ts`, `.env.local` (cleaned)

**Problem 3: Storage URL Signature Mismatch**
- **Error**: `SignatureDoesNotMatch - Access denied`
- **Root Cause**: Firebase Admin SDK not using proper credential initialization
- **Solution**: 
  1. Fixed `firebase.server.ts` to read service account file and use `cert(serviceAccount)`
  2. Ensured service account file is current (regenerated if needed)
- **Files Changed**: `src/lib/firebase.server.ts`

**Problem 4: Firestore Undefined Field Errors**
- **Error**: `Function addDoc() called with invalid data. Unsupported field value: undefined`
- **Root Cause**: Optional fields (`correctedTranscription`, `summary`, `changelog`) were `undefined`
- **Solution**:
  1. Replace `undefined` with `null` in history payload
  2. Updated TypeScript types to allow `null` values
- **Files Changed**: `src/app/page.tsx`, `src/types/index.ts`

### Current Working Status ✅

**Fully Functional Features:**
- ✅ Firebase client authentication (anonymous)
- ✅ Firebase Admin SDK initialization
- ✅ Audio file upload to Firebase Storage (up to 12MB)
- ✅ AI transcription streaming with Gemini models
- ✅ Background processing (AI review, correction, summarization)
- ✅ Firestore history saving
- ✅ Complete end-to-end workflow

**Known Limitations:**
- ⚠️ File size limit: ~10-12MB (files over 25MB fail)
- ⚠️ Cross-origin warnings in Firebase Studio (cosmetic, doesn't affect functionality)
- ⚠️ Requires Gemini API key for AI features

### Debugging Commands

**Check Firebase Configuration:**
```bash
# Verify environment variables
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GOOGLE_API_KEY

# Check service account file
head -5 serviceAccountKey.json
ls -la serviceAccountKey.json

# Test Firebase connection
npm run dev
# Look for "🔧 Firebase Config Debug:" in browser console
```

**Common Fixes:**
```bash
# Restart with clean environment
pkill -f "next dev"
export GOOGLE_APPLICATION_CREDENTIALS=/home/user/studio/serviceAccountKey.json
export GOOGLE_API_KEY=your_api_key
npm run dev

# If signature errors persist - regenerate service account key:
# 1. Firebase Console > Project Settings > Service Accounts
# 2. Generate new private key
# 3. Replace serviceAccountKey.json
```

### Firebase Console Verification Checklist

**Project Settings:**
- ✅ Web API Key: `AIzaSyCEmve1Lk7f8aDLo-sBhF5UqP6nAiNWj8o`
- ✅ Project ID: `audio-transcription-serv-80134`
- ✅ Storage Bucket: `audio-transcription-serv-80134.appspot.com`

**Authentication:**
- ✅ Anonymous sign-in enabled

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/history/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```