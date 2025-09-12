# P³ Interview Academy - Design Scheme Document
*Version 1.0 | Created: 11 August 2025*

## Overview
This document establishes the design principles, patterns, and guidelines for P³ Interview Academy's user interface and user experience. All new modules and components should follow these established patterns to maintain consistency and professional quality throughout the platform.

## Design Philosophy

### Core Principles
- **Professional Clarity**: Clean, uncluttered interfaces that inspire confidence
- **British English**: Consistent use of British spelling and terminology throughout
- **Educational Focus**: Design supports learning outcomes and skill development
- **Progressive Disclosure**: Information revealed at appropriate stages to prevent overwhelm
- **Accessibility First**: Inclusive design that works for all users

### User Experience Values
- **Supportive Journey**: Guide users through interview preparation with encouragement
- **Clear Progress**: Always show users where they are and what comes next
- **Immediate Feedback**: Provide quick responses and loading states
- **Error Recovery**: Graceful handling of errors with helpful guidance

## Visual Design System

### Colour Palette
```css
/* Primary Colours */
--primary-blue: #2563eb        /* Main brand colour for CTAs and headers */
--primary-blue-light: #3b82f6  /* Hover states and highlights */
--primary-blue-dark: #1d4ed8   /* Active states and emphasis */

/* Secondary Colours */
--success-green: #10b981       /* Success states, achievements, positive feedback */
--warning-yellow: #f59e0b      /* Warnings, attention items, in-progress states */
--error-red: #ef4444          /* Errors, critical alerts, negative feedback */

/* Neutral Colours */
--gray-50: #f9fafb           /* Background light */
--gray-100: #f3f4f6          /* Card backgrounds, subtle borders */
--gray-200: #e5e7eb          /* Borders, dividers */
--gray-300: #d1d5db          /* Disabled states, placeholders */
--gray-600: #4b5563          /* Secondary text */
--gray-900: #111827          /* Primary text, headings */

/* Semantic Colours */
--text-primary: var(--gray-900)
--text-secondary: var(--gray-600)
--background-primary: #ffffff
--background-secondary: var(--gray-50)
--border-primary: var(--gray-200)
--border-focus: var(--primary-blue)
```

### Typography Scale
```css
/* Headings */
.text-3xl { font-size: 1.875rem; font-weight: 700; } /* Page titles */
.text-2xl { font-size: 1.5rem; font-weight: 700; }   /* Section headers */
.text-xl { font-size: 1.25rem; font-weight: 600; }   /* Subsection headers */
.text-lg { font-size: 1.125rem; font-weight: 500; }  /* Card titles */

/* Body Text */
.text-base { font-size: 1rem; }                      /* Standard body text */
.text-sm { font-size: 0.875rem; }                    /* Supporting text */
.text-xs { font-size: 0.75rem; }                     /* Labels, captions */

/* Font Weights */
.font-bold { font-weight: 700; }                     /* Emphasis, headings */
.font-semibold { font-weight: 600; }                 /* Subheadings */
.font-medium { font-weight: 500; }                   /* Labels, buttons */
.font-normal { font-weight: 400; }                   /* Body text */
```

### Spacing System
```css
/* Consistent spacing scale based on 0.25rem (4px) increments */
--space-1: 0.25rem   /* 4px  - tight spacing */
--space-2: 0.5rem    /* 8px  - small gaps */
--space-3: 0.75rem   /* 12px - medium-small gaps */
--space-4: 1rem      /* 16px - standard spacing */
--space-6: 1.5rem    /* 24px - large spacing */
--space-8: 2rem      /* 32px - section spacing */
--space-12: 3rem     /* 48px - major section spacing */
```

## Component Patterns

### Page Layout Structure
```typescript
// Standard page layout pattern
<div className="min-h-screen bg-gray-50">
  <Header />
  
  <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <ProgressTracker 
      currentStage="[stage]" 
      currentStep={[number]}
      totalSteps={[total]}
    />
    
    {/* Page content with consistent spacing */}
    <div className="space-y-8">
      {/* Content sections */}
    </div>
  </main>
</div>
```

### Card Components
```typescript
// Primary card pattern for main content areas
<Card className="mb-8">
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content with consistent padding */}
  </CardContent>
</Card>

// Compact card pattern for lists and summaries
<Card className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-medium text-gray-900">Title</h3>
      <p className="text-sm text-gray-600">Description</p>
    </div>
    <div className="text-right">
      <span className="text-2xl font-bold text-primary-blue">Value</span>
    </div>
  </div>
</Card>
```

### Button Hierarchy
```typescript
// Primary action buttons
<Button className="bg-primary-blue hover:bg-primary-blue-dark text-white">
  Primary Action
</Button>

// Secondary action buttons
<Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
  Secondary Action
</Button>

// Destructive actions
<Button variant="destructive" className="bg-error-red hover:bg-red-600">
  Delete/Remove
</Button>

// Success/completion actions
<Button className="bg-success-green hover:bg-green-600 text-white">
  Complete/Finish
</Button>
```

### Form Patterns
```typescript
// Standard form layout with proper spacing and validation
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Field Label</FormLabel>
          <FormControl>
            <Input placeholder="Placeholder text" {...field} />
          </FormControl>
          <FormDescription>
            Optional helpful description
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <div className="flex justify-end space-x-4">
      <Button type="button" variant="outline">Cancel</Button>
      <Button type="submit">Submit</Button>
    </div>
  </form>
</Form>
```

### Loading States
```typescript
// Skeleton loading for cards
<Card className="mb-8">
  <CardHeader>
    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
    </div>
  </CardContent>
</Card>

// Loading spinner for actions
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

### Error States
```typescript
// Error message pattern
<div className="rounded-md bg-red-50 p-4 mb-6">
  <div className="flex">
    <div className="flex-shrink-0">
      <AlertCircle className="h-5 w-5 text-red-400" />
    </div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">
        Error Title
      </h3>
      <div className="mt-2 text-sm text-red-700">
        <p>Detailed error description with helpful guidance.</p>
      </div>
    </div>
  </div>
</div>
```

## Content Formatting Standards

### Text Formatting Rules
- **Lists**: Use bullet points (•) instead of numbered lists for better readability
- **Emphasis**: Use **bold** for key terms, *italics* for subtle emphasis
- **Technical Terms**: Maintain consistent capitalisation (e.g., "STAR Method", "WGLL")
- **British English**: "Colour" not "color", "Realise" not "realize", "Centre" not "center"

### Content Structure Pattern
```markdown
**Section Title**

Brief introduction or context.

**Key Points**
• First important point with specific details
• Second point with actionable information
• Third point with measurable outcomes

**Technical Implementation**
• Specific technical approach or methodology
• Tools and technologies utilised
• Quality standards and validation methods

**Expected Results**
Clear description of outcomes and success metrics.
```

### WGLL Content Pattern
```typescript
// Consistent structure for "What Good Looks Like" content
interface WGLLContent {
  modelAnswer: string;     // Comprehensive expert response
  keySuccessFactors: string[];  // 4-6 specific success criteria
  expertTips: string[];    // 3-4 actionable professional tips
}
```

## Interaction Patterns

### Navigation Flow
1. **Clear Entry Points**: Obvious starting points for each workflow
2. **Progress Indication**: Always show current position and next steps
3. **Breadcrumbs**: Enable easy return to previous stages
4. **Consistent Actions**: Use same button text and positioning across modules

### Feedback Mechanisms
- **Immediate Response**: Loading states for all async actions
- **Success Confirmation**: Clear indication when actions complete
- **Error Recovery**: Helpful error messages with suggested solutions
- **Progress Saving**: Auto-save functionality with visual confirmation

### Responsive Behaviour
```css
/* Mobile-first responsive design */
.container {
  @apply px-4 sm:px-6 lg:px-8;
  @apply max-w-4xl mx-auto;
}

/* Grid layouts adapt to screen size */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
```

## Module Development Guidelines

### New Module Checklist
- [ ] Follows established page layout structure
- [ ] Uses consistent colour palette and typography
- [ ] Implements proper loading and error states
- [ ] Includes progress tracking where applicable
- [ ] Uses British English throughout
- [ ] Provides clear navigation and breadcrumbs
- [ ] Implements responsive design patterns
- [ ] Includes proper form validation and feedback
- [ ] Uses bullet points (•) for list formatting
- [ ] Maintains consistent spacing and visual hierarchy

### Code Organisation
```
/client/src/
  /components/
    /ui/          # Reusable UI components (buttons, cards, etc.)
    /forms/       # Form components with validation
    /layout/      # Layout components (Header, ProgressTracker)
  /pages/         # Page-level components
  /lib/           # Utilities and shared logic
  /hooks/         # Custom React hooks
```

### Component Naming Conventions
- **Pages**: PascalCase descriptive names (e.g., `InterviewPreparation`, `SessionComplete`)
- **Components**: PascalCase with clear purpose (e.g., `QuestionCard`, `ResponseForm`)
- **Utilities**: camelCase functions (e.g., `formatTime`, `validateInput`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RESPONSE_LENGTH`, `DEFAULT_TIMEOUT`)

## Quality Assurance

### Design Review Criteria
1. **Visual Consistency**: Does it match established patterns?
2. **User Experience**: Is the flow intuitive and helpful?
3. **Accessibility**: Can all users interact with it effectively?
4. **Performance**: Does it load quickly and respond smoothly?
5. **Content Quality**: Is the text clear, helpful, and grammatically correct?
6. **Error Handling**: Are edge cases handled gracefully?

### Testing Requirements
- **Responsive Testing**: Verify layout on mobile, tablet, and desktop
- **Accessibility Testing**: Check keyboard navigation and screen reader compatibility
- **Error Scenario Testing**: Test with network failures and invalid inputs
- **Content Validation**: Verify British English and proper formatting
- **Loading State Testing**: Confirm all async operations show appropriate feedback

## Implementation Notes

### Technical Considerations
- All components should use TypeScript for type safety
- Prefer composition over inheritance for component design
- Use React Query for data fetching with proper caching
- Implement proper error boundaries for graceful failure handling
- Follow established patterns for form validation using Zod schemas

### Performance Guidelines
- Lazy load components where appropriate
- Optimise images and assets for web delivery
- Use proper loading states to maintain perceived performance
- Implement debouncing for search and filter operations
- Cache frequently accessed data appropriately

---

*This design scheme document should be referenced for all new module development and updated as patterns evolve. Consistency in design creates a professional, trustworthy user experience that supports effective interview preparation.*