# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Common Development Tasks
- `npm run dev` - Start development server (client on Vite dev server + API on Express)
- `npm run build` - Build for production (client + server bundle with esbuild)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle Kit

### Database Operations
- Database migrations are managed through Drizzle Kit with PostgreSQL
- Schema is defined in `shared/schema.ts`
- Use `npm run db:push` to sync schema changes to the database
- Database URL must be set in environment variables

## Architecture Overview

### Project Structure
This is a **full-stack TypeScript application** with a **monorepo structure**:

- **`client/`** - React 18 + Vite frontend with Shadcn/ui components and Tailwind CSS
- **`server/`** - Express.js API server with TypeScript
- **`shared/`** - Shared types and database schema (Drizzle ORM + PostgreSQL)

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query, React Hook Form + Zod
- **Backend**: Express.js, TypeScript ES modules, Drizzle ORM, PostgreSQL (Neon serverless)
- **UI**: Shadcn/ui components built on Radix UI, Tailwind CSS with custom design system
- **AI Integration**: SeaLion LLM for Southeast Asian interview coaching

### Application Domain
**P³ Interview Academy** - AI-powered interview preparation platform with three modules:
1. **Prepare** - **AI-powered interview preparation with voice interaction** - Dynamic question generation, real-time STAR method evaluation, multilingual support, and voice-enabled practice sessions
2. **Practice** - Structured interview sessions with AI coaching
3. **Perform** - Real-time interview simulation with comprehensive evaluation

The platform supports **10 Southeast Asian languages** and uses **SeaLion AI** for culturally-aware interview coaching optimized for the SEA region.

### Database Schema
Core entities managed through Drizzle ORM:
- `users` - User authentication and profiles (Replit Auth integration)
- `interviewScenarios` - Interview templates organized by stage/industry
- `interviewSessions` - Active/completed interview sessions with progress tracking
- `interviewMessages` - Chat history between user and AI interviewer
- `aiEvaluationResults` - Comprehensive performance evaluations with STAR method analysis

**NEW: AI-Powered Prepare Module Schema:**
- `ai_prepare_sessions` - Voice-enabled AI preparation sessions with adaptive questioning
- `ai_prepare_questions` - AI-generated questions with translation and cultural context
- `ai_prepare_responses` - User responses with voice transcription and STAR method evaluation
- `ai_prepare_analytics` - Performance tracking and behavioral analysis

### AI Services Architecture
- **SeaLion Service** (`server/services/sealion.ts`) - Primary AI integration for Southeast Asian contexts
- **AI Service** (`server/services/ai-service.ts`) - Fallback service for general interview functionality
- **Dynamic Question Generation** - Real-time question creation based on user's job position and company
- **Multi-language Support** - Interview questions and feedback in 10 SEA languages
- **STAR Method Evaluation** - Comprehensive performance assessment

**NEW: Enhanced AI Prepare Services:**
- **PrepareAIService** (`server/services/prepare-ai-service.ts`) - Main orchestrator for AI-powered preparation
- **FreeVoiceService** (`server/services/free-voice-service.ts`) - Web Speech API + Whisper.cpp integration
- **ResponseEvaluationService** (`server/services/response-evaluation-service.ts`) - Real-time STAR method scoring
- **AIQuestionGenerator** (`server/services/ai-question-generator.ts`) - Adaptive question generation engine

### Key Features
- **Dynamic Interview Scenarios** - AI generates personalized interviews based on user's job context
- **Multi-stage Interview Support** - Phone screening, functional, hiring manager, SME, executive levels
- **Voice & Text Input** - Flexible response methods with Web Audio API integration
- **Real-time Auto-save** - Session progress persistence
- **Comprehensive Analytics** - STAR-based performance evaluation with cultural awareness
- **Cross-module Navigation** - Seamless integration between Prepare, Practice, and Perform modules

**NEW: AI-Powered Prepare Features:**
- **Voice-First Interface** - Web Speech API for STT/TTS with Whisper.cpp offline fallback
- **Real-time AI Evaluation** - Instant STAR method scoring with detailed feedback and model answers
- **Adaptive Question Generation** - AI-powered questions that adapt to user performance and job context
- **Multilingual Voice Support** - Speech recognition and synthesis for all 10 ASEAN languages
- **Cultural Context Integration** - Culturally-aware questions and evaluation criteria
- **Session Management** - Complete session control with progress tracking and analytics

### Development Notes
- Uses **Replit Auth** for authentication with PostgreSQL session storage
- **Development mode** includes mock user (`dev-user-123`) for testing
- **Admin routes** require role-based access control
- **TypeScript paths** configured for clean imports (`@/` → `client/src/`, `@shared/` → `shared/`)
- **Error handling** includes comprehensive logging and fallback systems
- **Database** uses Neon PostgreSQL serverless with connection pooling

### API Endpoints
Key API routes follow RESTful patterns:
- `/api/practice/scenarios` - Interview scenario management
- `/api/practice/sessions` - Interview session lifecycle
- `/api/perform/*` - Perform module specific endpoints
- `/api/auth/user` - User authentication and profile
- `/api/system/health` - System status and error reporting

**NEW: AI-Powered Prepare API:**
- `/api/prepare-ai/sessions` - AI preparation session management with voice capabilities
- `/api/prepare-ai/sessions/:id/question` - Dynamic question retrieval with cultural context
- `/api/prepare-ai/sessions/:id/respond` - Response submission with real-time evaluation
- `/api/prepare-ai/voice/transcribe` - Speech-to-text processing for voice responses
- `/api/prepare-ai/voice/synthesize` - Text-to-speech for multilingual question delivery
- `/api/prepare-ai/analytics` - Session analytics and performance insights

### UI Components
Built with Shadcn/ui component library:
- Components follow Radix UI accessibility standards
- Tailwind CSS with custom design tokens
- Consistent theming with CSS variables
- Responsive design patterns throughout

### Language & Localization
- **British English** preferred for UI text and documentation
- **Southeast Asian language support** for AI-generated content
- **Cultural adaptation** for interview scenarios and evaluation criteria
- **Language-aware AI responses** using SeaLion's specialized models
- Always refer to @interview_scoring_rubrics.md to score the AI simulation sessions.

**NEW: Voice & Translation Support:**
- **Free Voice Services** - Web Speech API (primary) with Whisper.cpp fallback for offline capability
- **Multilingual TTS** - Browser-native speech synthesis with voice selection per language
- **Real-time Translation** - Dynamic question translation with cultural context preservation
- **Voice Quality Detection** - Automatic fallback to text input when voice quality is poor

## AI-Powered Prepare Module Implementation Plan

### Technical Architecture
- **Frontend**: Voice-first React components with real-time WebSocket communication
- **Backend**: AI orchestration services with free voice processing pipeline
- **Voice Stack**: Web Speech API + Whisper.cpp WebAssembly for cost-effective voice features
- **AI Integration**: SeaLion for ASEAN languages, OpenAI for English evaluation
- **Database**: Extended schema for AI sessions, questions, responses, and analytics

### Implementation Phases
1. **✅ Database Foundation** (3-4 days) - **COMPLETED** ✅ Schema creation and migrations
2. **Backend Services** (5-6 days) - AI services and voice processing
3. **API & WebSocket** (3-4 days) - Real-time communication and voice streaming
4. **Frontend Components** (4-5 days) - Voice-enabled chat interface
5. **Voice Integration** (2-3 days) - Free voice services implementation
6. **Testing & Deployment** (3-4 days) - Quality assurance and production deployment

### ✅ Phase 1 Completion Summary
**Database Foundation**: All 4 AI prepare tables successfully implemented with:
- **Full Compatibility**: 100% field alignment with existing prepare module
- **Voice Infrastructure**: Speech rate, voice preferences, audio processing ready
- **AI Capabilities**: STAR scoring, adaptive questioning, cultural context support
- **Performance Analytics**: Response tracking, improvement analysis, voice metrics
- **Verification Status**: All database operations, relationships, and JSONB fields tested and working

### Free Voice Service Strategy
- **Primary**: Web Speech API for zero-cost STT/TTS
- **Fallback**: Whisper.cpp WebAssembly for offline capability
- **Enhancement**: Progressive upgrade path to premium services
- **Cost**: $0-10/month for MVP with free tier usage

### Key Implementation Files
- `server/services/prepare-ai-service.ts` - Main AI orchestration
- `server/services/free-voice-service.ts` - Voice processing with free services
- `client/src/components/prepare-ai/PrepareAIInterface.tsx` - Main voice interface
- `shared/schema.ts` - Extended database schema for AI prepare module