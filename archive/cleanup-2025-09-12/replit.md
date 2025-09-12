# P³ Interview Academy - AI-Powered Interview Preparation Platform

## Overview

P³ Interview Academy is a comprehensive AI-powered interview preparation platform designed to help users excel in job interviews across Southeast Asia. The platform provides personalized practice sessions with voice/text input, real-time feedback, and multi-language support for 10+ ASEAN languages. It features three core modules: Prepare (AI-powered preparation with voice interaction), Practice (structured interview sessions), and Perform (real-time interview simulation with evaluation).

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Dashboard Consolidation (September 2025)**: Removed static dashboard from Prepare module and consolidated all performance analytics under Perform module where it logically belongs for better user experience
- **Enhanced Perform Dashboard**: Added comprehensive metrics including Questions Practiced, Average STAR Score, Practice Time, voice usage statistics, Recent Sessions, Top Skills, and Focus Areas
- **Routing Updates**: Modified Prepare module to redirect dashboard requests to Perform module, ensuring consistent analytics location across the platform
- **UI Improvements**: Cleaned up duplicate dashboard functionality and streamlined user flow for accessing performance data
- Fixed duplicate question generation issue by adding idempotency checks and proper WebSocket state management for reconnection scenarios
- Enhanced language localization for feedback panel labels across 6 languages (en/id/ms/th/vi/tl)
- Moved interview introduction from chat interface to static section above voice controls, eliminating TTS conflicts
- Implemented right-side feedback panel displaying evaluation results and model answers outside chat interface

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Vite as the build tool. The application follows a component-based architecture with Shadcn/ui components (based on Radix UI) styled with Tailwind CSS. State management is handled through React Context for session state and TanStack Query for server state management. Client-side routing uses Wouter, while form handling employs React Hook Form with Zod validation. The design system emphasizes professional clarity with British English terminology throughout.

### Backend Architecture
The backend runs on Node.js with Express.js using TypeScript and ES modules. It implements a RESTful API design with structured error handling and integrates Vite for SSR and HMR during development. The system includes comprehensive middleware for authentication, session management, and request processing. The API supports real-time communication through WebSocket services for voice interactions and live AI feedback.

### Database Layer
The application uses Drizzle ORM with PostgreSQL dialect, specifically configured for Neon serverless deployment. Schema management is handled through Drizzle Kit with strongly typed schemas and Zod integration for validation. The database includes comprehensive session management with 26+ fields for tracking user progress, interview scenarios, messages, and AI evaluation results across all modules.

### AI Integration
The platform integrates SeaLion AI for culturally-aware interview coaching optimized for Southeast Asian markets. It includes an AI router service that provides fallback mechanisms using template-based responses when AI services are unavailable. The system supports real-time STAR method evaluation with detailed feedback generation and adaptive question difficulty adjustment.

### Voice Services
Voice functionality is implemented using free browser Web Speech APIs for both Text-to-Speech and Speech-to-Text. The system includes multi-language voice support, audio quality detection, and browser compatibility checking. While comprehensive voice services exist in the frontend, backend voice routes are currently experiencing technical issues that don't block core functionality.

### Session Management
The platform features robust session persistence with lifecycle management including timeout handling, auto-save functionality, and recovery systems. Sessions track comprehensive user data including performance analytics, progress across modules, and personalized feedback for continuous improvement.

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: PostgreSQL connection for serverless deployment
- **drizzle-orm**: Type-safe database ORM for schema management
- **@tanstack/react-query**: Server state management and caching

### AI and Language Services
- **@anthropic-ai/sdk**: Claude AI integration for enhanced language processing
- **@google-cloud/aiplatform**: Vertex AI integration for SeaLion model access
- **@aws-sdk/client-bedrock-runtime**: AWS Bedrock for additional AI capabilities

### Authentication and UI
- **Replit Auth**: User authentication and session management
- **@radix-ui/react-***: Comprehensive UI component library
- **@hookform/resolvers**: Form validation with Zod integration

### Development and Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework
- **Vitest**: Testing framework with React Testing Library integration

### Voice and Media Processing
- **Web Speech API**: Browser-native voice services (primary)
- **@types/multer**: File upload handling for audio and documents
- **Audio Context API**: Advanced audio processing capabilities

The platform is designed to operate cost-effectively with a $0-10/month operational cost for MVP deployment, leveraging free browser APIs for voice services and efficient cloud infrastructure.