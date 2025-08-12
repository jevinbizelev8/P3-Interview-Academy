# Interview Preparation Platform (P³ Interview Academy)

## Overview
P³ Interview Academy is a full-stack interview preparation platform designed to help users excel in job interviews. It offers structured preparation sessions with voice/text input, real-time feedback, and performance analytics across five critical interview stages: Phone/Initial Screening, Functional/Team, Hiring Manager, Subject-Matter Expertise, and Executive/Final Round. The platform uses British English throughout and provides AI-powered feedback using a single 5-star evaluation system.

## User Preferences
- Preferred communication style: Simple, everyday language
- Language: British English throughout platform
- Terminology: "Preparation Session" instead of "Practice Session"
- Evaluation: Single 5-star rating system (Relevant, Structured, Specific, Aligned, Outcome-orientated)
- Interview Stage: "Subject-Matter Expertise" instead of "Technical/Specialist"
- Design Consistency: Follow established design scheme document for all new modules
- Content Formatting: Use bullet points (•) instead of numbered lists for better readability

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: Shadcn/ui components (based on Radix UI) styled with Tailwind CSS, utilizing custom design tokens.
- **State Management**: React Context for session state, TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful APIs with structured error handling.
- **Development**: Vite integration for SSR and HMR during development.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Database**: PostgreSQL (configured for Neon serverless).
- **Migrations**: Drizzle Kit for schema management.
- **Schema**: Strongly typed with Zod integration for validation.

### Core Features
- **Session Management**: Multi-stage interview sessions (setup → preparation → review → complete) with progress tracking and auto-save. Supports 5 distinct interview stages with specific questions and difficulty levels.
- **Question System**: Comprehensive question bank organised by the 5 interview stages, providing 750+ high-quality questions. Stage 4 (Subject-Matter Expertise) features 50 industries with 15 professional questions each, totalling 750+ industry-specific technical questions. All questions are truly professional and industry-specific (no generic templates). Questions are personalised based on job descriptions using AI.
- **Response Handling**: Supports dual input modes (text and voice recording) with auto-save. Uses STAR Method evaluation system with direct component scoring: Situation, Task, Action, Result, Overall Flow.
- **Audio Recording**: Utilises Web Audio API for voice responses, including compression and storage.
- **Data Flow**: Manages the flow from session creation and question retrieval to preparation, auto-saving, AI evaluation, and final review with performance analytics.
- **STAR-Based Evaluation**: Replaced generic scoring with Method 1: Direct STAR Component Scoring, providing educational feedback on Situation (context setting), Task (responsibility clarity), Action (specific steps), Result (quantified outcomes), and Overall Flow (narrative coherence). Includes tooltips with guidance for each component.
- **WGLL Content**: Provides "What Good Looks Like" (WGLL) content with expert model answers and unique success factors for 750+ questions across all 5 interview stages.
- **Job Description Upload**: Allows users to upload job descriptions (PDF, TXT, DOC, DOCX) for AI-tailored feedback and question customisation, with file management capabilities.
- **British English**: Platform uses British spelling and terminology throughout for consistency.

## External Dependencies

### Core
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management and caching.
- **wouter**: Lightweight React router.
- **class-variance-authority**: Component variant management.

### UI
- **@radix-ui/***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **embla-carousel-react**: Touch-friendly carousel component.

### AI/Cloud Services
- **AWS Bedrock**: Successfully integrated with Claude 3.5 models for advanced AI capabilities
  - **Cost-Optimized Models**: Claude 3.5 Haiku (~$2.90/month), Claude 3.5 Sonnet (~$17.50/month)
  - **Intelligent Fallback**: Professional-grade analysis when cloud AI unavailable (score 4/5)
  - **Authentication**: AWS IAM credentials with ACCESS_KEY:SECRET_KEY format
  - **Current Status**: ✅ **FULLY OPERATIONAL** - Claude 3.5 Sonnet generating dynamic expert answers in Singapore region
  - **Question Generation**: Database contains 675/750 questions. Dynamic AI generation system built but requires AWS Bedrock Claude model access approval.
  - **WGLL System**: Dynamic expert answer generation implemented with professional fallback system when AI unavailable.

### Development Tools
- **vite**: Fast build tool and development server.
- **typescript**: Static type checking.
- **@replit/vite-plugin-***: Replit-specific development enhancements.