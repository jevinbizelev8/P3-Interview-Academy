# Legacy Prepare Module Files - Quarantined

This directory contains the old prepare module files that have been quarantined to prevent conflicts with the new AI-powered prepare module.

## Quarantined Files

### Backend Services
- `prepare-service.ts` - Old prepare service with static functionality
- `coaching-engine-service.ts` - Old coaching service
- `coaching.ts` - Old coaching routes

### Frontend Components  
- `InterviewCoaching.tsx` - Old coaching interface
- `CoachingChat.tsx` - Old chat component
- `coaching-session.tsx` - Old coaching session page
- `PrepareProgressDashboard.tsx` - Old progress dashboard
- `PrepareWizard.tsx` - Old preparation wizard
- `prepare-dashboard.tsx` - Old prepare dashboard
- `prepare.tsx` - Old prepare page

### API Routes
- `prepare-questions.ts` - Old prepare questions routes

### Test Files
- `PrepareModuleFlow.test.tsx` - Old integration tests

## Reason for Quarantine

These files were part of the legacy prepare module that:
1. Used static Q&A without AI evaluation
2. Lacked voice input/output capabilities  
3. Had no real-time STAR method scoring
4. Didn't support ASEAN languages
5. Had no adaptive questioning logic

## New AI-Powered System

The new system includes:
1. AI-powered question generation with SeaLion integration
2. Real-time STAR method evaluation
3. Voice input/output with Web Speech API
4. WebSocket real-time communication
5. Cultural context for ASEAN markets
6. Adaptive difficulty adjustment
7. Comprehensive analytics and progress tracking

## Recovery Instructions

If any legacy functionality needs to be restored:
1. Review the quarantined files
2. Extract specific functions needed
3. Adapt them to work with the new AI prepare architecture
4. Ensure no conflicts with new database schema

**Do not directly restore these files** as they use incompatible schemas and outdated patterns.