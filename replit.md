# P³ Interview Academy

## Overview

P³ Interview Academy is a comprehensive interview preparation platform designed to help users excel in job interviews through structured practice sessions. The platform follows a three-stage learning framework: Prepare, Practice, and Perform. It offers AI-powered coaching with real-time feedback, voice and text input capabilities, and comprehensive evaluation using performance indicators, qualitative observations, actionable insights, and personalized learning drills. The system supports multiple interview stages from phone screening to executive interviews, with **fully dynamic question generation** that creates personalized interviews based on the user's specific job position and company name, completely overriding generic scenarios.

**Enhanced Perform Module (January 2025)**: Complete redesign based on team specifications featuring AI-generated simulation questions, 4-criteria performance indicators (Communication, Empathy, Problem Solving, Cultural Alignment), qualitative observations, actionable insights, personalized learning drills, self-reflection prompts, performance badges, and progress tracking with visual indicators.

**Perform Module Purpose**: The Perform module serves as an evaluation simulation specifically designed to assess if candidates have improved after using the platform. It focuses on mastering advanced interview techniques including advanced strategies, executive presence, negotiation skills, and career planning to achieve interview excellence.

**Multi-Language Support**: The platform now supports 10 Southeast Asian languages including English, Bahasa Malaysia, Bahasa Indonesia, Thai, Vietnamese, Filipino, Myanmar, Khmer, Lao, and Chinese (Singapore), with complete language integration throughout the interview process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with **React 18** and **TypeScript**, using **Vite** for fast development and building. The UI is constructed with **Shadcn/ui components** (based on Radix UI primitives) and styled with **Tailwind CSS** using a custom design system with CSS variables for theming. The application uses **Wouter** for lightweight client-side routing and follows a component-based architecture with clear separation of concerns.

**State Management**: The application employs React Context for session state management and **TanStack Query** for server state management and caching. Form handling is managed through **React Hook Form** with **Zod** validation for type-safe form schemas.

**Design System**: The platform maintains a professional design philosophy with British English throughout, using a consistent color palette (primary blue #2563eb, success green, warning yellow, error red) and typography system. The design emphasizes progressive disclosure and accessibility-first principles.

### Backend Architecture
The server runs on **Node.js** with **Express.js** using **TypeScript** and ES modules. The API follows RESTful design principles with structured error handling and middleware for logging and request processing. The backend integrates with Vite for development SSR and HMR capabilities.

**Session Management**: Multi-stage interview sessions are supported with progress tracking (setup → preparation → review → complete) and auto-save functionality. The system handles both text and voice responses with automatic data persistence.

**AI Integration**: The platform integrates with **Anthropic's Claude** (using claude-sonnet-4-20250514) for intelligent interview coaching, dynamic question generation, and comprehensive performance evaluation. The AI system features **completely dynamic question generation** that creates fresh, unique interview questions in real-time based on the user's specific job position and company name. When users provide their job details (e.g., "AI Engineer" at "Meta"), the AI completely overrides generic scenarios and generates questions tailored to that exact role and company culture, making each interview unique and highly relevant.

**Enhanced AI Assessment**: The new Perform module uses AI to generate comprehensive performance assessments with 4 key performance indicators, qualitative observations, actionable insights, STAR method recommendations, and personalized learning drills tailored to individual improvement areas.

**Multi-Language AI**: The AI system now supports generating interview questions and feedback in 10 Southeast Asian languages with intelligent fallback systems and culturally appropriate language patterns for each supported locale.

### Database Design
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The database is configured for **Neon serverless** deployment with connection pooling.

**Schema Structure**: Core entities include users (with Replit Auth integration), interview scenarios (organized by stage and industry), interview sessions (with state tracking), interview messages (supporting both user responses and AI feedback), and enhanced assessment system with assessments (4-criteria scoring), performance indicators (visual data support), simulation questions (AI-generated), and learning drills (personalized skill development). The schema supports comprehensive session analytics, progress tracking, and detailed performance evaluation.

**Data Flow**: The system manages end-to-end data flow from session creation and question retrieval through preparation, auto-saving, AI evaluation, and final review with performance analytics.

### Authentication & Session Management
User authentication is handled through **Replit Auth** with session storage in PostgreSQL using **connect-pg-simple**. The system supports role-based access control (user/admin) with admin-specific routes for scenario management.

### Audio & File Handling
The platform supports voice recording through the **Web Audio API** with audio compression and storage capabilities. File upload functionality supports job descriptions in multiple formats (PDF, TXT, DOC, DOCX) for AI-tailored feedback.

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: PostgreSQL connection management for serverless environments
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **@tanstack/react-query**: Server state management and intelligent caching

### AI Services
- **@anthropic-ai/sdk**: Integration with Claude AI for interview coaching and evaluation

### UI Framework
- **@radix-ui/***: Comprehensive set of accessible UI primitives (accordion, dialog, dropdown-menu, etc.)
- **tailwindcss**: Utility-first CSS framework with custom design tokens
- **class-variance-authority**: Type-safe component variants
- **clsx**: Conditional className utility

### Development & Build
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the entire stack
- **wouter**: Lightweight client-side routing
- **react-hook-form**: Performant form management
- **zod**: Runtime type validation and schema parsing

### Session & Storage
- **connect-pg-simple**: PostgreSQL session store for Express
- **express-session**: Session middleware for user authentication

The platform architecture emphasizes type safety, performance, and user experience while maintaining scalability through serverless-ready database connections and efficient state management patterns.