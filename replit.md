# P³ Interview Academy - AI-Powered Interview Preparation Platform

## Overview

P³ Interview Academy is a comprehensive AI-powered interview preparation platform designed to help users excel in job interviews across Southeast Asia. The platform provides personalized practice sessions with voice/text input, real-time AI feedback, and multi-language support. It features three core modules: Practice (interactive sessions with AI interviewers), Prepare (AI-driven question generation and preparation), and Perform (analytics and performance tracking).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Vite as the build tool and development server. The UI framework uses Shadcn/ui components (based on Radix UI) styled with Tailwind CSS for a modern, accessible interface. State management employs React Context for session state and TanStack Query for server state management and caching. Client-side routing is handled by Wouter, with React Hook Form and Zod providing form handling and validation.

### Backend Architecture
The backend runs on Node.js with Express.js using TypeScript and ES modules. It implements a RESTful API design with structured error handling and middleware for authentication, session validation, and request logging. The server integrates with Vite for Server-Side Rendering (SSR) and Hot Module Replacement (HMR) during development. Authentication is handled through both simple password-based auth and Replit OAuth integration.

### Database Layer
The application uses Drizzle ORM with PostgreSQL dialect, specifically configured for Neon serverless deployment. Database schema management is handled through Drizzle Kit with strongly typed schemas integrated with Zod for validation. The schema includes comprehensive tables for users, interview scenarios, sessions, messages, AI evaluations, and preparation data across all three modules.

### AI Integration
The platform integrates multiple AI services with intelligent fallback mechanisms. OpenAI now serves as the primary provider, with SeaLion AI delivering Southeast Asia-focused fallback support and Anthropic via Bedrock as an additional safety net. The AI router service manages provider selection, response caching, and error handling to ensure reliable AI-powered features across question generation, response evaluation, and translation services.

### Voice Services Architecture
Voice functionality is implemented using free browser Web Speech APIs for both Text-to-Speech (TTS) and Speech-to-Text (STT). The system includes comprehensive multi-language support for 10+ Southeast Asian languages, voice selection optimization, audio quality detection, and browser compatibility checking. Voice services operate primarily client-side to minimize server dependencies while maintaining high performance.

### Session Management
The platform features robust session persistence with comprehensive lifecycle management including timeout handling, auto-save functionality, and recovery systems. Sessions track detailed user data including responses, progress, evaluation results, and performance metrics. The session management service includes automatic cleanup of abandoned sessions and real-time state synchronization.

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: PostgreSQL connection adapter for serverless environments
- **drizzle-orm**: Type-safe database ORM with schema management capabilities
- **@tanstack/react-query**: Advanced server state management and caching solution

### AI and Language Services
- **@anthropic-ai/sdk**: Claude AI integration for advanced language processing
- **@aws-sdk/client-bedrock-runtime**: AWS Bedrock runtime for Claude model access
- **SeaLion AI**: Primary AI service for Southeast Asian culturally-aware responses

### UI and Frontend
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for responsive design
- **wouter**: Lightweight client-side routing library
- **@hookform/resolvers**: Form validation resolvers for React Hook Form

### Development and Build Tools
- **vite**: Next-generation frontend build tool and development server
- **typescript**: Static type checking for JavaScript
- **vitest**: Fast unit testing framework powered by Vite
- **@replit/vite-plugin-***: Replit-specific development plugins for enhanced IDE integration
