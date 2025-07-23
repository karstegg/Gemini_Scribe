# Gemini Scribe 🎙️

**AI-Powered Audio Transcription with Smart Processing**

Gemini Scribe is a Next.js 15 application that provides intelligent audio transcription using Google's Gemini AI models, with features like automatic review, correction, summarization, and secure history management.

## ✨ Features

- **🎵 Audio Upload**: Drag-and-drop or click to upload audio files (MP3, WAV, M4A)
- **🤖 AI Transcription**: Real-time streaming transcription using Gemini 2.0/2.5 models
- **📝 Smart Processing**: Automatic AI review, correction, and summarization
- **👥 Speaker Detection**: Automatic speaker identification and labeling
- **⏰ Timestamps**: Optional timestamp insertion for key sections
- **📚 History Management**: Secure storage and retrieval of transcription history
- **🔒 Anonymous Authentication**: No sign-up required - start transcribing immediately
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication, Firestore, and Storage enabled
- Google AI Studio API key for Gemini models

### 1. Clone and Install

```bash
git clone https://github.com/karstegg/Gemini_Scribe.git
cd Gemini_Scribe
npm install
```

### 2. Firebase Setup

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `audio-transcription-serv-80134` (or your own name)
3. Enable **Authentication** > **Anonymous** sign-in
4. Enable **Firestore Database**
5. Enable **Storage**

#### B. Get Firebase Configuration
1. **Project Settings** > **General** > **Web API Key**
2. **Project Settings** > **Service Accounts** > **Generate new private key**
3. Download the service account JSON file as `serviceAccountKey.json`

### 3. Environment Configuration

Create `.env.local` in the project root:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_api_key_from_firebase_console
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Service Account Setup

```bash
# Place your service account file in the project root
cp path/to/your/downloaded-key.json ./serviceAccountKey.json

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/serviceAccountKey.json
```

### 5. Gemini API Key

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set environment variable:

```bash
export GOOGLE_API_KEY=your_gemini_api_key_here
```

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:9002` and start transcribing!

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **AI/ML**: Google Genkit, Gemini 2.0/2.5 Flash models
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI**: Radix UI + shadcn/ui components

### Key Components
- **AI Flows** (`src/ai/flows/`): Genkit-powered transcription, review, and summarization
- **Firebase Services** (`src/lib/`): Client/server Firebase integrations
- **Scribe Components** (`src/components/scribe/`): Core UI components
- **Types** (`src/types/`): TypeScript definitions

### Data Flow
1. **Upload**: Audio file → Firebase Storage
2. **Transcription**: Storage URL → Gemini AI → Real-time streaming
3. **Processing**: Background AI review, correction, summarization
4. **Storage**: Results → Firestore user history

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Development server (port 9002)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checks
npm run typecheck    # TypeScript validation

# Genkit Development
npm run genkit:dev   # Genkit development server
npm run genkit:watch # Genkit with file watching
```

### Firebase Studio / Project IDX Setup

If developing in Firebase Studio or Project IDX:

```bash
# Set environment variables in each terminal session
export GOOGLE_APPLICATION_CREDENTIALS=/home/user/studio/serviceAccountKey.json  
export GOOGLE_API_KEY=your_gemini_api_key
npm run dev
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Firebase API Key Invalid" Error
- **Cause**: Mismatch between `.env.local` and Firebase Console
- **Fix**: Copy exact Web API Key from Firebase Console Project Settings

#### 2. "Firebase Admin SDK initialization failed"
- **Cause**: Service account file path or contents issue
- **Fix**: 
  ```bash
  # Verify file exists and is readable
  ls -la serviceAccountKey.json
  head -5 serviceAccountKey.json
  
  # Regenerate if needed from Firebase Console
  ```

#### 3. "SignatureDoesNotMatch" Storage Error
- **Cause**: Outdated or invalid service account key
- **Fix**: Generate new private key in Firebase Console > Service Accounts

#### 4. "Unsupported field value: undefined" Firestore Error
- **Cause**: Already fixed in current version
- **Fix**: Pull latest code with proper null handling

#### 5. "Content size over limit" for Large Files
- **Cause**: 10MB limit in Gemini API
- **Fix**: Use files under 12MB, or implement chunking for larger files

### Debug Commands

```bash
# Check configuration
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GOOGLE_API_KEY
head -5 serviceAccountKey.json

# Restart cleanly
pkill -f "next dev"
npm run dev

# Check browser console for "🔧 Firebase Config Debug:" output
```

## 🔒 Security & Privacy

- **Anonymous Authentication**: No personal data collection
- **Secure Storage**: Files stored in Firebase with proper access rules
- **Private History**: Each user's transcriptions are isolated
- **Service Account**: Server-side operations use secure service account
- **Environment Variables**: Sensitive keys stored securely

### Firebase Security Rules

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

## 📝 File Format Support

**Supported Audio Formats:**
- MP3 (most common)
- WAV
- M4A
- FLAC
- OGG

**File Size Limits:**
- ✅ **Recommended**: Under 12MB for optimal performance
- ⚠️ **Large Files**: 12-25MB may work but slower processing
- ❌ **Very Large**: Over 25MB will fail due to API limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/karstegg/Gemini_Scribe/issues)
- **Documentation**: See `CLAUDE.md` for detailed troubleshooting
- **Firebase**: [Firebase Documentation](https://firebase.google.com/docs)
- **Genkit**: [Google Genkit Documentation](https://genkit.dev/)

## 🎉 Acknowledgments

- Google Genkit team for the AI framework
- Firebase team for the backend infrastructure  
- shadcn/ui for the beautiful component library
- Next.js team for the amazing framework

---

**Made with ❤️ using Google Genkit and Firebase**