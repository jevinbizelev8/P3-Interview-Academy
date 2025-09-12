# P³ Interview Academy - AI-Powered Interview Preparation Platform

## Overview

P³ Interview Academy is a comprehensive AI-powered interview preparation platform designed specifically for Southeast Asian professionals. The platform provides personalized interview coaching, multi-language support, and real-time feedback across all interview stages - from phone screening to executive rounds. Built with modern web technologies, it offers three core modules: Prepare (AI-powered practice with voice interaction), Practice (structured interview sessions), and Perform (real-time simulation with comprehensive evaluation).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a modern React 18 application with TypeScript, utilizing Vite as the build tool and development server. The application follows a component-based architecture using Shadcn/ui components (built on Radix UI primitives) styled with Tailwind CSS. State management is handled through React Context for session state and TanStack Query for server state management and caching. Client-side routing is implemented using Wouter, and form handling uses React Hook Form with Zod validation for type safety.

### Backend Architecture  
The backend runs on Node.js with Express.js, implemented in TypeScript using ES modules. It follows a RESTful API design with structured error handling and comprehensive route organization. The server integrates with Vite for Server-Side Rendering and Hot Module Replacement during development. Authentication is handled through a custom implementation that can work with both Replit Auth and simple password-based authentication, with session management using express-session with PostgreSQL storage.

### Database Design
The application uses Drizzle ORM with PostgreSQL dialect, specifically configured for Neon serverless deployment. The database schema includes comprehensive tables for user management, interview scenarios, sessions, messages, AI evaluations, and various preparation modules. Schema management is handled through Drizzle Kit with strongly typed schemas integrated with Zod for runtime validation. The design supports complex relationships between users, sessions, scenarios, and evaluation results.

### AI Integration
The platform integrates SeaLion AI for culturally-aware interview coaching optimized for Southeast Asian markets. It includes sophisticated AI services with fallback mechanisms using template-based question generation when AI services are unavailable. The system supports multi-language AI interactions, real-time response evaluation using the STAR method, and dynamic question generation based on job roles, companies, and interview stages.

### Voice Services
Voice functionality is implemented using free browser Web Speech APIs for both Text-to-Speech and Speech-to-Text capabilities. The system includes comprehensive multi-language voice support for 10+ Southeast Asian languages, audio quality detection, browser compatibility checking, and voice selection optimization. Voice services are designed to work independently on the frontend with optional backend enhancement.

### Session Management
The platform features robust session persistence with comprehensive lifecycle management including timeout handling (30-minute sessions with auto-extension), auto-save functionality, and recovery systems for interrupted sessions. Sessions track detailed user data including progress, performance metrics, STAR method scores, qualitative feedback, and cross-module analytics.

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: PostgreSQL connection optimized for serverless deployment environments
- **drizzle-orm**: Type-safe database ORM providing schema management and query building
- **@tanstack/react-query**: Advanced server state management with caching, background updates, and optimistic updates

### AI and Language Services  
- **@anthropic-ai/sdk**: Integration with Claude AI for enhanced language processing and evaluation
- **@google-cloud/aiplatform**: Google Cloud Vertex AI integration for SeaLion model access
- **@aws-sdk/client-bedrock-runtime**: AWS Bedrock integration for additional AI model access

### UI Framework and Components
- **@radix-ui/react-***: Comprehensive set of accessible, unstyled UI primitives for building the component library
- **tailwindcss**: Utility-first CSS framework for rapid UI development with custom design system
- **react-hook-form**: Performant forms library with minimal re-renders and comprehensive validation

### Authentication and Session Management
- **express-session**: Robust session middleware for Express with PostgreSQL store
- **connect-pg-simple**: PostgreSQL session store for persistent session management
- **bcryptjs**: Secure password hashing for authentication systems

### Development and Testing
- **vite**: Fast build tool and development server with Hot Module Replacement
- **vitest**: Fast unit testing framework with React Testing Library integration
- **typescript**: Static type checking for enhanced developer experience and code reliability