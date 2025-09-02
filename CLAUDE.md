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
1. **Prepare** - Interview preparation resources and guidance
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

### AI Services Architecture
- **SeaLion Service** (`server/services/sealion.ts`) - Primary AI integration for Southeast Asian contexts
- **AI Service** (`server/services/ai-service.ts`) - Fallback service for general interview functionality
- **Dynamic Question Generation** - Real-time question creation based on user's job position and company
- **Multi-language Support** - Interview questions and feedback in 10 SEA languages
- **STAR Method Evaluation** - Comprehensive performance assessment

### Key Features
- **Dynamic Interview Scenarios** - AI generates personalized interviews based on user's job context
- **Multi-stage Interview Support** - Phone screening, functional, hiring manager, SME, executive levels
- **Voice & Text Input** - Flexible response methods with Web Audio API integration
- **Real-time Auto-save** - Session progress persistence
- **Comprehensive Analytics** - STAR-based performance evaluation with cultural awareness
- **Cross-module Navigation** - Seamless integration between Prepare, Practice, and Perform modules

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