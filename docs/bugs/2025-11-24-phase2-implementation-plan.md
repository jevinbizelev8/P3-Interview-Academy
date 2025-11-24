# Phase 2 Founder UAT Bugs - Implementation Plan

**Date**: 2025-11-24
**Total Estimated Time**: ~3.5 hours
**Status**: 📋 Planning Complete → ⏳ Ready for Implementation

---

## Executive Summary

Based on comprehensive codebase investigation, here's the implementation plan for the 6 remaining Phase 2 bugs:

| Bug | Priority | Status | Time | Action Required |
|-----|----------|--------|------|-----------------|
| #3 | HIGH | ⏳ Pending | 30 min | Create backend coaching endpoint |
| #4 | HIGH | ✅ Complete | 15 min | Verification testing only |
| #7 | MEDIUM | ⏳ Pending | 30 min | Improve error messages |
| #5 | MEDIUM | ⏳ Pending | 60 min | Update video analysis UI |
| #8 | LOW | ⏳ Pending | 30 min | Migrate to S3 storage |
| #9 | MEDIUM | ✅ Complete | 0 min | Covered by Bug #3 |

**Key Finding**: Bug #4 (Credit Deduction) is already comprehensively fixed with idempotency and proper error handling. Only needs testing verification.

---

## BUG #3: Self-Intro Coaching Not Connected

**Priority**: HIGH
**Estimated Time**: 30 minutes
**Status**: ⏳ Pending Implementation

### Problem Statement
The "Request for Personalized Coaching" button in the Self-Introduction Wizard does nothing. Users click it expecting AI feedback but get a placeholder message: "AI coaching feature coming soon."

**Current File**: `client/src/components/mvp/prepare/SelfIntroScriptingWizard.jsx` (lines 150-171)

### Root Cause
- Frontend `getAICoaching()` function is a placeholder returning mock message
- Backend endpoint `POST /api/prepare/self-intro/coaching` does not exist
- No service method to generate step-specific coaching

### Implementation Plan

#### Step 1: Create Backend Endpoint
**File**: `server/routes/prepare.ts` (add after line 292)

```typescript
/**
 * POST /self-intro/coaching
 * Get personalized AI coaching for self-introduction script
 * Credit cost: 2 credits
 */
const selfIntroCoachingSchema = z.object({
  stepData: z.object({
    who: z.string().optional(),
    what: z.string().optional(),
    why: z.string().optional(),
    closingHook: z.string().optional(),
  }),
  currentStep: z.number().min(1).max(4),
});

router.post('/self-intro/coaching', requireCredits('self-intro-coaching'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = selfIntroCoachingSchema.parse(req.body);

    // Get coaching from SelfIntroService
    const selfIntroService = new SelfIntroService();
    const coaching = await selfIntroService.getStepCoaching(
      req.user.id,
      validatedData.stepData,
      validatedData.currentStep
    );

    return res.json({ success: true, data: { coaching } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error getting self-intro coaching:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI coaching. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

#### Step 2: Add Service Method
**File**: `server/services/self-intro-service.ts` (add after line 378)

```typescript
/**
 * Get AI coaching for specific self-intro step
 */
async getStepCoaching(
  userId: string,
  stepData: {
    who?: string;
    what?: string;
    why?: string;
    closingHook?: string;
  },
  currentStep: number
): Promise<string> {
  const stepNames = ['Who Are You', 'What Do You Do', 'Why This Role/Company', 'Closing Hook'];
  const stepName = stepNames[currentStep - 1] || 'Current Step';

  const currentText = currentStep === 1 ? stepData.who :
                     currentStep === 2 ? stepData.what :
                     currentStep === 3 ? stepData.why :
                     stepData.closingHook;

  if (!currentText || currentText.trim().length === 0) {
    return `Please write your ${stepName} first to receive personalized coaching.`;
  }

  const prompt = `You are an interview coach helping someone craft their self-introduction.

They are working on the "${stepName}" section of their introduction.

Their current draft:
"""
${currentText}
"""

Provide 2-3 specific, actionable coaching tips to improve this section. Be encouraging but honest. Focus on:
- Clarity and conciseness
- Specific examples and metrics
- Professional tone
- Impact and relevance

Keep your response under 150 words and make it conversational.`;

  const response = await this.openAIService.generateResponse({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    maxTokens: 300,
    temperature: 0.7,
  });

  return response.trim();
}
```

#### Step 3: Update Frontend
**File**: `client/src/components/mvp/prepare/SelfIntroScriptingWizard.jsx` (lines 150-171)

Replace the placeholder `getAICoaching` function with:

```javascript
const getAICoaching = async (prompt, context) => {
  setIsProcessing(true);
  try {
    const response = await fetch('/api/prepare/self-intro/coaching', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stepData: scriptData,
        currentStep: currentStep
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get coaching');
    }

    const data = await response.json();
    setAiCoaching(data.data.coaching);
    return { feedback: data.data.coaching };
  } catch (error) {
    console.error("Error getting AI coaching:", error);
    setAiCoaching("Unable to get AI coaching at this time. Please try again.");
    return { feedback: "Error getting coaching" };
  } finally {
    setIsProcessing(false);
  }
};
```

#### Step 4: Add Credit Cost Configuration
**Database**: Run migration or manual SQL

```sql
INSERT INTO credit_costs (feature_name, credit_cost, description, is_active)
VALUES ('self-intro-coaching', 2, 'Personalized AI coaching for self-introduction steps', true)
ON CONFLICT (feature_name) DO UPDATE SET
  credit_cost = 2,
  is_active = true;
```

### Testing Checklist

#### Manual Testing
- [ ] Navigate to Prepare → Self-Introduction Wizard
- [ ] Fill in "Who Are You" field with sample text
- [ ] Click "Request for Personalized Coaching"
- [ ] Verify: AI coaching appears (not "coming soon" message)
- [ ] Verify: Coaching is relevant to WHO content
- [ ] Verify: Credits deducted (check balance before/after)
- [ ] Move to Step 2 (What Do You Do)
- [ ] Fill in different content
- [ ] Click coaching again
- [ ] Verify: Coaching changes based on new content
- [ ] Verify: Coaching is relevant to WHAT content
- [ ] Empty a field
- [ ] Click coaching
- [ ] Verify: Helpful message "Please write your [step] first"

#### API Testing
```bash
# Test with valid data
curl -X POST http://localhost:5000/api/prepare/self-intro/coaching \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "stepData": {
      "who": "I am a software engineer with 5 years of experience in full-stack development."
    },
    "currentStep": 1
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "coaching": "Great start! Your introduction clearly states your role and experience. Consider adding: 1) A specific technical achievement with metrics (e.g., 'reduced load time by 40%'), 2) Your unique specialization (frontend/backend/specific tech stack), 3) What makes you passionate about software engineering. This will make your introduction more memorable and impactful."
#   }
# }
```

#### Unit Test
**File**: `server/__tests__/prepare.routes.test.ts`

```typescript
describe('POST /api/prepare/self-intro/coaching', () => {
  it('should return coaching for valid request', async () => {
    const response = await request(app)
      .post('/api/prepare/self-intro/coaching')
      .set('Cookie', authCookie)
      .send({
        stepData: { who: 'I am a software engineer with 5 years experience.' },
        currentStep: 1
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.coaching).toBeDefined();
    expect(response.body.data.coaching.length).toBeGreaterThan(0);
  });

  it('should return helpful message for empty field', async () => {
    const response = await request(app)
      .post('/api/prepare/self-intro/coaching')
      .set('Cookie', authCookie)
      .send({
        stepData: { who: '' },
        currentStep: 1
      });

    expect(response.status).toBe(200);
    expect(response.body.data.coaching).toContain('Please write');
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .post('/api/prepare/self-intro/coaching')
      .send({
        stepData: { who: 'Test' },
        currentStep: 1
      });

    expect(response.status).toBe(401);
  });
});
```

### Success Criteria
- ✅ Users can request coaching on any self-intro step
- ✅ Coaching feedback is relevant to current step content
- ✅ Different inputs produce different coaching responses
- ✅ Empty fields show helpful prompt message
- ✅ Credits deducted correctly (2 credits per request)
- ✅ No duplicate charges for same content (idempotency)

---

## BUG #4: Credit Deduction Issues

**Priority**: HIGH
**Estimated Time**: 15 minutes (verification only)
**Status**: ✅ Already Implemented

### Problem Statement
Original issues reported:
1. Credits deducted immediately on simulation start (not after completion)
2. Multiple deductions possible (no idempotency)
3. Credits still deducted on API errors

### Investigation Results

**GOOD NEWS**: All issues have been comprehensively fixed in the current codebase.

#### Evidence of Fix #1: Idempotency System
**File**: `server/middleware/credit-middleware.ts` (lines 7-55)

```typescript
// In-memory cache of processed actions
const processedActions = new Map<string, Date>();

/**
 * Check if an action has already been processed (idempotency check)
 */
export function checkDuplicateAction(userId: string, actionType: string, resourceId: string): boolean {
  const key = `${userId}:${actionType}:${resourceId}`;
  return processedActions.has(key);
}

/**
 * Mark an action as processed (for idempotency)
 */
export function markActionProcessed(userId: string, actionType: string, resourceId: string): void {
  const key = `${userId}:${actionType}:${resourceId}`;
  processedActions.set(key, new Date());
}

// Auto-cleanup every hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [key, timestamp] of processedActions.entries()) {
    if (timestamp < oneHourAgo) {
      processedActions.delete(key);
    }
  }
}, 60 * 60 * 1000);
```

#### Evidence of Fix #2: Credits AFTER Operation
**File**: `server/routes/prepare.ts` (lines 518-544)

```typescript
// Line 493-494: Generate unique resource ID from script content
const scriptHash = crypto.createHash('md5').update(script).digest('hex');
const resourceId = `script-${scriptHash.substring(0, 16)}`;

// Line 506-512: Check for duplicate operation (idempotency)
if (checkDuplicateAction(req.user.id, 'video-analysis', resourceId)) {
  return res.status(409).json({
    success: false,
    error: 'This script has already been analyzed. Please modify your script to get new feedback.',
    code: 'DUPLICATE_REQUEST',
  });
}

// Line 518-520: Perform analysis FIRST
const result = await selfIntroService.analyzeVideoScript(...);

// Line 522-529: Deduct credits AFTER success
try {
  await CreditService.deductCredits(
    req.user.id,
    VIDEO_ASSESSMENT_COST,
    'video-analysis',
    'Self-Introduction Video Assessment',
    resourceId
  );

  // Line 532: Mark as processed (prevent future duplicates)
  markActionProcessed(req.user.id, 'video-analysis', resourceId);
} catch (creditError) {
  // Line 535-544: Error rollback - return result anyway
  return res.json({
    success: true,
    data: result,
    warning: 'Analysis completed but credit deduction pending. Please contact support if credits were not deducted.'
  });
}
```

#### Evidence of Fix #3: Practice Sessions
**File**: `server/routes/practice.ts` (lines 87-122)

```typescript
// Line 87: Create session FIRST
const session = await insertInterviewSession({
  userId: user.id,
  // ... session data
});

// Line 90-96: Deduct credits AFTER session created
await CreditService.deductCredits(
  user.id,
  creditCost,
  'simulation-start',
  `Simulation: ${simulationType}`,
  session.id
);

// Line 112-121: Error handling for credit deduction failure
catch (error) {
  if (error instanceof Error && error.message.includes('Insufficient credits')) {
    return res.status(402).json({
      success: false,
      error: 'Insufficient credits to start simulation.',
      code: 'INSUFFICIENT_CREDITS',
      required: creditCost,
      available: user.credits || 0
    });
  }
  // Other error handling...
}
```

### Testing Checklist (Verification Only)

#### Test 1: Duplicate Prevention
- [ ] Record self-intro video with script "Hello, I am John"
- [ ] Click "Analyze Video" → Analysis succeeds, 5 credits deducted
- [ ] WITHOUT CHANGING SCRIPT, click "Analyze Video" again
- [ ] Verify: 409 error "This script has already been analyzed"
- [ ] Verify: NO additional credits deducted
- [ ] Change script to "Hello, I am John Smith"
- [ ] Click "Analyze Video" → New analysis, 5 more credits deducted

#### Test 2: Credits After Operation
- [ ] Check current credit balance (e.g., 100 credits)
- [ ] Start practice simulation (costs 10 credits)
- [ ] IMMEDIATELY disconnect internet (simulate network failure)
- [ ] Verify: Session created successfully
- [ ] Verify: Credits deducted (balance = 90)
- [ ] If operation fails, verify credits NOT deducted

#### Test 3: Error Rollback
- [ ] Create test scenario where credit deduction service fails
- [ ] Perform video analysis
- [ ] Verify: Analysis still returned to user
- [ ] Verify: Warning message displayed
- [ ] Verify: Credits eventually deducted (after service recovers)

#### Test 4: Credit Transaction Logs
```sql
-- Check credit transactions for user
SELECT
  id,
  user_id,
  amount,
  transaction_type,
  description,
  resource_id,
  created_at
FROM credit_transactions
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 20;

-- Verify:
-- 1. Each analysis has unique resource_id
-- 2. No duplicate resource_id entries
-- 3. Negative amounts for deductions
-- 4. Timestamps match operation times
```

### Success Criteria
- ✅ Re-recording same script doesn't double-charge
- ✅ Failed operations don't deduct credits
- ✅ Duplicate requests rejected with 409 status
- ✅ Transaction logs show unique resource IDs
- ✅ Idempotency cache cleans up automatically

### Status
**Implementation**: ✅ Complete
**Testing**: ⏳ Needs verification

---

## BUG #7: Simulation Error Messages

**Priority**: MEDIUM
**Estimated Time**: 30 minutes
**Status**: ⏳ Pending Implementation

### Problem Statement
Generic error messages like "An error occurred" don't help users understand what went wrong or what to do next.

**Current File**: `client/src/components/mvp/practice/SimulationInterface.jsx` (lines 296-341)

### Root Cause Analysis

**Backend**: ✅ Already has excellent error handling
**File**: `server/routes/practice.ts` (lines 124-156)

```typescript
// Backend already returns specific error codes:
- UNAUTHORIZED
- VALIDATION_ERROR
- SERVICE_UNAVAILABLE
- TIMEOUT
- SESSION_CREATION_FAILED
- INSUFFICIENT_CREDITS
```

**Frontend**: ⚠️ Partially implemented, needs improvement
**File**: `client/src/components/mvp/practice/SimulationInterface.jsx` (lines 304-334)

Current implementation handles most error codes but has generic fallback.

### Implementation Plan

#### Update Frontend Error Handling
**File**: `client/src/components/mvp/practice/SimulationInterface.jsx` (lines 325-336)

Replace the default case with:

```javascript
default:
  // Check for network errors
  if (!error.response) {
    errorMessage = '🌐 Network connection lost. Please check your internet connection and try again.';
  } else if (error.response.status === 504) {
    errorMessage = '⏱️ Request timed out. The server is taking too long to respond. Please try again in a moment.';
  } else if (error.response.status >= 500) {
    errorMessage = '🔧 Our servers encountered an error. Please try again in a moment. If this persists, contact support@bizelev8.ai';
  } else if (error.response.status === 403) {
    errorMessage = '🔒 Access denied. Please make sure you are logged in and have permission to start simulations.';
  } else if (error.response.status === 429) {
    errorMessage = '🚦 Too many requests. Please wait a moment before trying again.';
  } else {
    // Use backend error message if available
    errorMessage = errorData?.message || errorData?.error || 'Unable to start simulation. Please try again or contact support@bizelev8.ai if this persists.';
  }
}

// Add comprehensive error logging
console.error('Simulation start error details:', {
  code: errorCode,
  message: errorMessage,
  status: error.response?.status,
  statusText: error.response?.statusText,
  data: errorData,
  timestamp: new Date().toISOString()
});

// Improved error display
const displayMessage = `❌ Simulation Error\n\n${errorMessage}\n\n${
  errorCode ? `Error code: ${errorCode}\n\n` : ''
}What you can do:\n• Check your internet connection\n• Refresh the page and try again\n• Contact support@bizelev8.ai if this persists\n\nYour credits have not been charged.`;

alert(displayMessage);
```

#### Optional: Add Error Alert Component
**File**: `client/src/components/mvp/practice/SimulationInterface.jsx` (add after line 341)

```javascript
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Add ErrorAlert component
const ErrorAlert = ({ message, code, onRetry, onClose }) => (
  <Alert variant="destructive" className="mb-6 border-red-300 bg-red-50">
    <AlertCircle className="h-5 w-5 text-red-600" />
    <AlertTitle className="text-red-900 font-semibold">Unable to Start Simulation</AlertTitle>
    <AlertDescription className="text-red-800">
      <div className="space-y-3">
        <p className="text-base">{message}</p>

        {code && (
          <p className="text-xs opacity-75 font-mono bg-red-100 px-2 py-1 rounded">
            Error code: {code}
          </p>
        )}

        <div className="text-sm border-t border-red-200 pt-3 mt-3">
          <p className="font-semibold mb-2">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check your internet connection</li>
            <li>Make sure you have sufficient credits</li>
            <li>Refresh the page and try again</li>
            <li>Contact <a href="mailto:support@bizelev8.ai" className="underline">support@bizelev8.ai</a> if this persists</li>
          </ul>
        </div>

        <div className="flex gap-2 mt-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </AlertDescription>
  </Alert>
);

// Use in component state
const [simulationError, setSimulationError] = useState(null);

// In error handling, set state instead of alert
setSimulationError({ message: errorMessage, code: errorCode });

// In JSX, render error alert
{simulationError && (
  <ErrorAlert
    message={simulationError.message}
    code={simulationError.code}
    onRetry={handleStartSimulation}
    onClose={() => setSimulationError(null)}
  />
)}
```

### Testing Checklist

#### Test All Error Scenarios

**Test 1: Insufficient Credits**
- [ ] Set user credits to 0
- [ ] Try to start simulation (costs 10 credits)
- [ ] Verify error message: "You need 10 credits but only have 0. Please purchase more credits."
- [ ] Verify message is clear and actionable

**Test 2: Network Error**
- [ ] Start simulation normally
- [ ] Disconnect internet immediately
- [ ] Verify error message: "Network connection lost. Please check your internet..."
- [ ] Reconnect internet
- [ ] Click "Try Again"
- [ ] Verify simulation starts successfully

**Test 3: Server Error (500)**
- [ ] Simulate server error (temporarily break backend route)
- [ ] Try to start simulation
- [ ] Verify error message: "Our servers encountered an error. Please try again..."
- [ ] Verify helpful next steps provided

**Test 4: Timeout (504)**
- [ ] Simulate slow API response (add delay to route)
- [ ] Try to start simulation
- [ ] Wait for timeout
- [ ] Verify error message: "Request timed out. The server is taking too long..."

**Test 5: Unauthorized (401)**
- [ ] Log out (delete session cookie)
- [ ] Try to start simulation
- [ ] Verify error message: "Please log in to start a simulation"
- [ ] Verify redirect to login page

**Test 6: Validation Error (400)**
- [ ] Send invalid simulation configuration
- [ ] Try to start simulation
- [ ] Verify error message shows specific validation issue
- [ ] Verify no credits deducted

#### Error Message Quality Check
- [ ] All error messages are user-friendly (no technical jargon)
- [ ] All error messages include next steps
- [ ] All error messages clarify if credits were charged
- [ ] Error codes logged to console for debugging
- [ ] Support email provided for persistent errors

### Success Criteria
- ✅ All error codes have user-friendly messages
- ✅ Network errors explicitly detected and handled
- ✅ Messages include actionable next steps
- ✅ Error codes logged for debugging
- ✅ Users never see "An error occurred" generic message
- ✅ Credits status clarified in error messages

---

## BUG #5: Video Analysis Mock Implementation

**Priority**: MEDIUM
**Estimated Time**: 60 minutes
**Status**: ⏳ Pending Implementation

### Problem Statement
The practice module video analysis claims to analyze video content but only analyzes the script text. This is misleading to users who expect facial expression, body language, and delivery analysis.

**Current File**: `server/services/self-intro-service.ts` (lines 292-378)

### Investigation Results

**Current Implementation**:
- ✅ Uses real OpenAI API (not hardcoded mock)
- ✅ Deducts credits properly
- ✅ Returns structured feedback
- ❌ Analyzes script text only (not actual video)
- ❌ UI implies full video analysis

**Why Full Video Analysis Is Not Implemented**:
- Cost: $0.10-0.50 per video (AWS Rekognition or Google Video Intelligence)
- Time: 4-6 hours implementation
- Complexity: Video upload, storage, processing pipeline
- Ongoing costs: API fees for every analysis

### Decision: Transparent Script Analysis Approach

Instead of expensive full video processing, we'll:
1. **Be transparent**: Update UI to clarify "Script-Based Analysis"
2. **Keep video recording**: For user practice and future enhancement
3. **Provide value**: Delivery recommendations based on content analysis
4. **Set expectations**: Clear messaging about current vs. future capabilities

This approach:
- ✅ Maintains user trust (no misleading claims)
- ✅ Provides immediate value (content + delivery tips)
- ✅ Keeps costs low (existing OpenAI costs)
- ✅ Allows future enhancement when budget permits

### Implementation Plan

#### Step 1: Update Frontend UI Labels
**File**: `client/src/components/mvp/prepare/SelfIntroScriptingWizard.jsx`

**Change 1: Card Title** (line 890)
```javascript
<CardTitle className="text-2xl">🎯 AI Script Assessment</CardTitle>
<p className="text-gray-600 mt-1">Get detailed feedback on your self-introduction content and delivery recommendations</p>
```

**Change 2: Section Header** (line 900)
```javascript
<h3 className="font-semibold text-lg mb-3">Analyze Your Script</h3>
<p className="text-sm text-gray-600 mb-4">
  Receive AI-powered feedback on your script content, structure, and recommended delivery approach.
</p>
```

**Change 3: Button Label** (line 913)
```javascript
Analyze Script & Get Delivery Tips ({VIDEO_ASSESSMENT_COST} credits)
```

**Change 4: Upload Description** (line 936)
```javascript
<p className="text-sm text-gray-600 mb-4">
  Already recorded? Upload your video and we'll analyze your script while providing delivery recommendations.
</p>
```

**Change 5: Add Capability Alert** (add after line 888)
```javascript
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

// Add before the assessment card
<Alert className="bg-blue-50 border-blue-200 mb-6">
  <Info className="w-5 h-5 text-blue-600" />
  <AlertDescription className="text-blue-900 ml-2">
    <strong>Current Analysis:</strong> We analyze your script content and provide delivery recommendations.
    <span className="block mt-1 text-sm">
      Full video analysis (facial expressions, body language tracking) coming in Q1 2026!
    </span>
  </AlertDescription>
</Alert>
```

#### Step 2: Update Service Prompt
**File**: `server/services/self-intro-service.ts` (lines 308-326)

Replace the prompt with:

```typescript
const prompt = `Analyze this self-introduction script and provide feedback as if evaluating how it would be delivered in a video interview.

Focus on:
1. Content Quality & Structure
   - Clear WHO-WHAT-WHY framework
   - Specific examples and metrics
   - Professional tone and impact

2. Delivery Recommendations
   - Optimal pacing (aim for 60-90 seconds total)
   - Key phrases to emphasize with vocal energy
   - Body language suggestions (eye contact, posture, hand gestures)
   - Breathing and pause points

Self-Introduction Script:
"""
${script}
"""

Provide assessment in this exact JSON format:
{
  "transcript": "${script.substring(0, 200)}...",
  "clarity_score": 85,
  "confidence_score": 80,
  "structure_score": 90,
  "overall_score": 85,
  "strengths": [
    "Clear WHO-WHAT-WHY structure",
    "Specific achievement with metrics (increased sales by 40%)",
    "Professional and confident tone"
  ],
  "improvements": [
    "Add more quantifiable results in the WHAT section",
    "Practice delivery pacing - aim for 75 seconds total (currently reads like 90+ seconds)",
    "Emphasize key achievements with vocal energy - pause before '40% increase'",
    "Maintain eye contact during opening and closing sentences"
  ],
  "ai_feedback": "Your script is well-structured and professional. The WHO section clearly establishes your background, and the WHAT section includes a strong quantifiable achievement. For delivery: Practice speaking at a moderate pace (about 2-3 words per second). Emphasize your key metrics by slightly slowing down before them. Maintain confident posture and natural hand gestures when describing your achievements. Consider recording yourself to check pacing and energy levels.",
  "duration_seconds": ${videoDuration || Math.max(30, script.split(' ').length / 2)},
  "delivery_tips": {
    "pacing": "Aim for 75-second delivery (currently reads like 90+ seconds)",
    "emphasis_points": ["5 years experience", "40% increase in sales", "passionate about technology"],
    "body_language": "Maintain eye contact 70-80% of time, use open hand gestures for key points",
    "breathing": "Take natural pauses after each section (WHO, WHAT, WHY)"
  }
}

Note: This is a script-based analysis with delivery recommendations. Full video analysis (facial recognition, body language tracking) is not yet implemented.`;
```

#### Step 3: Update API Response Structure
**File**: `server/routes/prepare.ts` (lines 518-544)

Add delivery tips to response:

```typescript
// After line 520 (analysis complete)
const result = await selfIntroService.analyzeVideoScript(...);

// Enhance response with transparency note
return res.json({
  success: true,
  data: {
    ...result,
    analysis_type: 'script-based',
    includes_video_analysis: false,
    note: 'This analysis focuses on script content with delivery recommendations. Full video analysis (facial expressions, body language tracking) coming soon!'
  }
});
```

#### Step 4: Add Future Enhancement Documentation
**File**: `server/services/self-intro-service.ts` (add comment block after line 378)

```typescript
/**
 * FUTURE ENHANCEMENT: Full Video Analysis
 *
 * Requirements:
 * 1. Video Upload & Storage
 *    - AWS S3 bucket for video storage
 *    - Presigned URLs for secure upload
 *    - Video format validation (MP4, WebM)
 *
 * 2. Speech-to-Text Transcription
 *    - Option A: AWS Transcribe ($0.024 per minute)
 *    - Option B: OpenAI Whisper API ($0.006 per minute)
 *    - Compare transcript with script for accuracy
 *
 * 3. Video Content Analysis
 *    - AWS Rekognition Video ($0.10 per minute)
 *    - Detect: facial expressions, eye contact, head movement
 *    - Body language: posture, hand gestures, confidence
 *    - Presentation quality: lighting, background, framing
 *
 * 4. Combined Analysis
 *    - Script content quality (current)
 *    - Delivery accuracy (transcript vs. script)
 *    - Non-verbal communication (video analysis)
 *    - Overall presentation score
 *
 * Estimated Cost: $0.15-0.50 per video
 * Estimated Implementation: 6-8 hours
 * Credit Cost: 10-15 credits (vs. current 5)
 *
 * Integration Points:
 * - POST /api/prepare/self-intro/analyze-video (enhance existing)
 * - Add optional videoFileUrl parameter
 * - Return combined script + video analysis
 * - Store analysis results for future reference
 */
```

### Testing Checklist

#### UI/UX Testing
- [ ] Navigate to Prepare → Self-Introduction Wizard
- [ ] Verify: Title says "AI Script Assessment" (not "Video Analysis")
- [ ] Verify: Blue info alert explains current capabilities
- [ ] Verify: Alert mentions "coming in Q1 2026"
- [ ] Record video
- [ ] Click "Analyze Script & Get Delivery Tips"
- [ ] Verify: Analysis includes content feedback
- [ ] Verify: Analysis includes delivery recommendations (pacing, emphasis, body language)
- [ ] Verify: Response includes "analysis_type: script-based"
- [ ] Verify: No misleading claims about video processing

#### Content Quality Testing
- [ ] Test with strong script (clear WHO-WHAT-WHY, metrics)
- [ ] Verify: Positive feedback on structure and content
- [ ] Verify: Delivery tips are relevant (pacing, emphasis points)
- [ ] Test with weak script (vague, no metrics, poor structure)
- [ ] Verify: Constructive criticism provided
- [ ] Verify: Specific improvement suggestions
- [ ] Test with very short script (< 30 seconds)
- [ ] Verify: Feedback suggests expanding content
- [ ] Test with very long script (> 120 seconds)
- [ ] Verify: Feedback suggests condensing

#### Delivery Recommendations Testing
- [ ] Verify delivery tips include:
  - [ ] Pacing guidance (target duration)
  - [ ] Emphasis points (key phrases to highlight)
  - [ ] Body language suggestions
  - [ ] Breathing and pause recommendations
- [ ] Verify tips are actionable and specific
- [ ] Verify tips match script content

#### API Response Testing
```bash
# Test script analysis endpoint
curl -X POST http://localhost:5000/api/prepare/self-intro/analyze-video \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "script": "Hello, I am a software engineer with 5 years of experience building scalable web applications. I increased user engagement by 40% through performance optimization.",
    "videoDuration": 30
  }'

# Expected response structure:
# {
#   "success": true,
#   "data": {
#     "transcript": "Hello, I am a software engineer...",
#     "clarity_score": 85,
#     "confidence_score": 80,
#     "structure_score": 90,
#     "overall_score": 85,
#     "strengths": [...],
#     "improvements": [...],
#     "ai_feedback": "...",
#     "duration_seconds": 30,
#     "delivery_tips": {
#       "pacing": "...",
#       "emphasis_points": [...],
#       "body_language": "...",
#       "breathing": "..."
#     },
#     "analysis_type": "script-based",
#     "includes_video_analysis": false,
#     "note": "This analysis focuses on script content..."
#   }
# }
```

### Success Criteria
- ✅ UI clearly states "script-based analysis"
- ✅ No misleading claims about video content processing
- ✅ Users understand current vs. future capabilities
- ✅ Feedback includes valuable delivery recommendations
- ✅ Delivery tips are specific and actionable
- ✅ Analysis maintains high quality for content evaluation
- ✅ User trust maintained through transparency

---

## BUG #8: Profile Photo Upload

**Priority**: LOW
**Estimated Time**: 30 minutes
**Status**: ⏳ Pending Implementation

### Problem Statement
Profile photos upload successfully but don't display correctly. Image URLs return 404 errors or broken images.

**Current Files**:
- Upload: `server/routes/users.ts` (lines 176-218)
- Static serving: `server/index.ts` (lines 141-156)

### Root Cause Analysis

**Upload Implementation**: ✅ Working correctly
- Files saved to `/uploads/profile-photos/{userId}/{filename}`
- Database updated with file path
- Proper validation and error handling

**Static File Serving**: ✅ Configured correctly
```typescript
// server/index.ts lines 141-156
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  index: false
}));
```

**Root Cause**: AWS Elastic Beanstalk **ephemeral storage**
- Instance A uploads file → saved to Instance A disk
- Load balancer routes request to Instance B → file doesn't exist
- Container restart → all files in `/uploads/` deleted

### Solution: Migrate to AWS S3

AWS S3 provides:
- ✅ Persistent storage across all instances
- ✅ Survives container restarts
- ✅ CDN-ready for fast global access
- ✅ No additional server disk space needed

### Implementation Plan

#### Step 1: Install AWS SDK
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Step 2: Create S3 Service
**File**: `server/services/s3-service.ts` (NEW FILE)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
    this.bucketName = process.env.S3_BUCKET_NAME || 'p3-user-uploads';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Upload profile photo to S3 and return public URL
   */
  async uploadProfilePhoto(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // Create unique key with timestamp to prevent caching issues
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `profile-photos/${userId}/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Make file publicly readable
      ACL: 'public-read',
      // Cache for 1 day
      CacheControl: 'public, max-age=86400',
    });

    await this.s3Client.send(command);

    // Return public URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Delete old profile photo from S3
   */
  async deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const urlParts = photoUrl.split('.amazonaws.com/');
      if (urlParts.length !== 2) {
        console.warn('Invalid S3 URL format:', photoUrl);
        return;
      }

      const key = urlParts[1];

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log('✅ Deleted old profile photo:', key);
    } catch (error) {
      console.error('Error deleting old profile photo:', error);
      // Don't throw - deletion failure shouldn't block upload
    }
  }

  /**
   * Get signed URL for private access (if ACL is private in future)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Check if S3 is properly configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: 'health-check.txt',
        Body: Buffer.from('OK'),
      });

      await this.s3Client.send(command);

      // Clean up test file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: 'health-check.txt',
      });
      await this.s3Client.send(deleteCommand);

      return true;
    } catch (error) {
      console.error('S3 health check failed:', error);
      return false;
    }
  }
}
```

#### Step 3: Update Upload Route
**File**: `server/routes/users.ts` (lines 176-218)

Replace the route with:

```typescript
import { S3Service } from '../services/s3-service';

// Update Multer configuration to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),  // Store in memory, not disk
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
    cb(null, true);
  },
});

router.post("/profile/photo", requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No photo uploaded"
      });
    }

    const s3Service = new S3Service();

    // Delete old photo if exists
    const currentUser = await storage.getUserById(req.user!.id);
    if (currentUser?.profileImageUrl && currentUser.profileImageUrl.includes('s3.amazonaws.com')) {
      await s3Service.deleteProfilePhoto(currentUser.profileImageUrl);
    }

    // Upload to S3
    const fileUrl = await s3Service.uploadProfilePhoto(
      req.user!.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Update user profile with S3 URL
    const updatedUser = await storage.upsertUser({
      id: req.user!.id,
      profileImageUrl: fileUrl,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    console.log(`✅ Profile photo uploaded for user ${req.user!.id}: ${fileUrl}`);

    res.json({
      success: true,
      data: {
        message: "Profile photo uploaded successfully",
        profile_photo_url: fileUrl,
        user: {
          id: updatedUser.id,
          profileImageUrl: updatedUser.profileImageUrl
        }
      }
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);

    // Check if it's a Multer error
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 5MB."
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to upload profile photo. Please try again.",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});
```

#### Step 4: Update Environment Variables
**File**: `.env` (development) and AWS Elastic Beanstalk (staging/production)

```bash
# AWS S3 Configuration
S3_BUCKET_NAME=p3-user-uploads
AWS_REGION=ap-southeast-1

# These should already be configured:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

#### Step 5: Create S3 Bucket
**Option A: AWS Console** (recommended for first-time setup)
1. Go to S3 console: https://console.aws.amazon.com/s3/
2. Click "Create bucket"
3. Bucket name: `p3-user-uploads`
4. Region: `ap-southeast-1` (Singapore)
5. Uncheck "Block all public access"
6. Enable versioning (optional but recommended)
7. Create bucket

**Option B: AWS CLI**
```bash
# Create bucket
aws s3 mb s3://p3-user-uploads --region ap-southeast-1

# Set bucket ACL for public read
aws s3api put-public-access-block \
  --bucket p3-user-uploads \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Create bucket policy for public read
cat > /tmp/bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::p3-user-uploads/profile-photos/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket p3-user-uploads \
  --policy file:///tmp/bucket-policy.json
```

#### Step 6: Configure CORS
**Create file**: `/tmp/s3-cors.json`

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://p3app.bizelev8.ai",
        "https://p3app-staging.bizelev8.ai",
        "http://localhost:5000",
        "http://localhost:5001"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

**Apply CORS configuration**:
```bash
aws s3api put-bucket-cors \
  --bucket p3-user-uploads \
  --cors-configuration file:///tmp/s3-cors.json
```

#### Step 7: Add Health Check
**File**: `server/routes/health.ts` (add to existing health check)

```typescript
import { S3Service } from '../services/s3-service';

// Add to detailed health check
router.get('/api/health', async (req, res) => {
  try {
    // Existing health checks...

    // Add S3 health check
    const s3Service = new S3Service();
    const s3Healthy = await s3Service.healthCheck();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy,
        s3: s3Healthy,  // Add this
      }
    });
  } catch (error) {
    // Error handling...
  }
});
```

### Testing Checklist

#### Local Testing (Development)
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to Profile page
- [ ] Upload JPG photo (< 5MB)
- [ ] Verify: Upload succeeds
- [ ] Verify: Photo displays in profile
- [ ] Verify: URL starts with `https://p3-user-uploads.s3.ap-southeast-1.amazonaws.com/`
- [ ] Upload different photo
- [ ] Verify: Old photo replaced
- [ ] Verify: Only new photo exists in S3 bucket
- [ ] Refresh page
- [ ] Verify: Photo still displays (persists)

#### File Type Testing
- [ ] Upload PNG file → Success
- [ ] Upload GIF file → Success
- [ ] Upload WebP file → Success
- [ ] Upload JPEG file → Success
- [ ] Upload PDF file → Error: "Only image files allowed"
- [ ] Upload TXT file → Error: "Only image files allowed"

#### File Size Testing
- [ ] Upload 1MB photo → Success
- [ ] Upload 4.9MB photo → Success
- [ ] Upload 6MB photo → Error: "File too large. Maximum size is 5MB."

#### Staging Testing (AWS Elastic Beanstalk)
- [ ] Deploy to staging
- [ ] Upload photo from Instance A
- [ ] Verify: Photo displays on Instance A
- [ ] Force request to Instance B (refresh multiple times)
- [ ] Verify: Photo displays on Instance B (cross-instance access works!)
- [ ] Restart application (container restart)
- [ ] Verify: Photo still displays (survives restart!)

#### Cross-Domain Testing
- [ ] Upload photo from p3app-staging.bizelev8.ai
- [ ] Verify: Photo accessible from staging domain
- [ ] Access photo URL directly in browser
- [ ] Verify: Image loads (public read works)
- [ ] Check browser console for CORS errors
- [ ] Verify: No CORS errors (CORS configured correctly)

#### Old Photo Cleanup Testing
- [ ] Upload photo #1 → URL ends with `123456-photo1.jpg`
- [ ] Note the S3 key in logs
- [ ] Upload photo #2 → URL ends with `789012-photo2.jpg`
- [ ] Check S3 bucket
- [ ] Verify: Only photo #2 exists (photo #1 deleted)

#### Database Consistency Testing
```sql
-- Check user profile_image_url
SELECT id, username, profile_image_url
FROM users
WHERE id = '...';

-- Verify URL format
-- Should be: https://p3-user-uploads.s3.ap-southeast-1.amazonaws.com/profile-photos/{userId}/{timestamp}-{filename}
```

#### S3 Health Check Testing
```bash
# Test S3 health check endpoint
curl http://localhost:5000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "database": true,
#     "s3": true
#   }
# }
```

### Success Criteria
- ✅ Photos upload successfully to S3
- ✅ Photos display correctly in profile UI
- ✅ Photos persist across AWS instance changes
- ✅ Photos survive container restarts
- ✅ Old photos automatically deleted when new photo uploaded
- ✅ No broken image links or 404 errors
- ✅ CORS configured correctly (no browser errors)
- ✅ File size and type validation working
- ✅ S3 health check passes

### Rollback Plan (If Issues Occur)
If S3 migration causes problems, temporary rollback:

```typescript
// In server/routes/users.ts
// Wrap S3 code in feature flag

const USE_S3_STORAGE = process.env.USE_S3_STORAGE === 'true';

if (USE_S3_STORAGE) {
  // S3 upload logic
} else {
  // Original local file storage logic
}
```

Set `USE_S3_STORAGE=false` in environment to revert to local storage.

---

## BUG #9: Script Polish

**Priority**: MEDIUM
**Estimated Time**: 0 minutes (covered by BUG #3)
**Status**: ✅ No Separate Work Needed

### Analysis
Bug #9 is not a separate issue—it refers to improving the quality of AI coaching responses in the Self-Introduction Wizard, which is fully addressed by BUG #3.

### Evidence
1. **Frontend already has polishing function** (`SelfIntroScriptingWizard.jsx` lines 173-219)
   - `handlePolishing()` calls `/api/prepare/self-intro/polish`
   - Works correctly when backend endpoint exists

2. **Backend endpoint exists** (`server/routes/prepare.ts` lines 255-292)
   - `POST /api/prepare/self-intro/polish` fully implemented
   - Uses OpenAI to refine and improve script

3. **What "script polish" actually means**:
   - Natural, engaging coaching responses (addressed in BUG #3 prompt)
   - Step-by-step guidance during script building (BUG #3)
   - Final polishing of complete script (already working)

### Conclusion
The self-intro coaching endpoint created in BUG #3 will provide the "script polish" functionality through:
- Natural, conversational coaching language
- Specific, actionable improvement suggestions
- Encouraging but honest feedback
- Professional tone and high-quality responses

**No additional implementation needed.**

---

## Implementation Timeline

### Week 1: HIGH Priority (75 minutes)

**Day 1-2: BUG #3 - Self-Intro Coaching** (30 min)
- [ ] Create backend endpoint in `server/routes/prepare.ts`
- [ ] Add service method in `server/services/self-intro-service.ts`
- [ ] Update frontend in `SelfIntroScriptingWizard.jsx`
- [ ] Add credit cost to database
- [ ] Test coaching on all 4 steps
- [ ] Verify credit deduction
- [ ] Deploy to staging

**Day 2: BUG #4 - Credit Verification** (15 min)
- [ ] Test duplicate prevention (re-analyze same script)
- [ ] Test credit deduction timing (after operation)
- [ ] Test error rollback
- [ ] Verify transaction logs
- [ ] Document test results

**Day 2-3: BUG #7 - Error Messages** (30 min)
- [ ] Update error handling in `SimulationInterface.jsx`
- [ ] Add network error detection
- [ ] Add timeout handling
- [ ] Improve default error messages
- [ ] Test all error scenarios
- [ ] Deploy to staging

### Week 2: MEDIUM Priority (60 minutes)

**Day 1-2: BUG #5 - Video Analysis Transparency** (60 min)
- [ ] Update UI labels in `SelfIntroScriptingWizard.jsx`
- [ ] Add capability alert explaining current features
- [ ] Update service prompt in `self-intro-service.ts`
- [ ] Enhance API response with transparency note
- [ ] Add future enhancement documentation
- [ ] Test with users, gather feedback
- [ ] Deploy to staging

### Week 3: LOW Priority (30 minutes)

**Day 1-2: BUG #8 - S3 Profile Photos** (30 min)
- [ ] Install AWS SDK packages
- [ ] Create `S3Service` class
- [ ] Update upload route in `users.ts`
- [ ] Create S3 bucket in AWS
- [ ] Configure bucket policy and CORS
- [ ] Add S3 health check
- [ ] Test upload and display
- [ ] Test cross-instance access
- [ ] Deploy to staging
- [ ] Test in production environment

### Week 4: Final Testing & Production Deploy

**Day 1-2: Comprehensive Testing**
- [ ] Run all manual test checklists
- [ ] Verify all success criteria met
- [ ] Founder UAT testing on staging
- [ ] Document any issues found

**Day 3: Production Deployment**
- [ ] Create deployment PR
- [ ] Get founder approval
- [ ] Deploy to production via GitHub Actions
- [ ] Monitor for 24 hours
- [ ] Document deployment in ops log

---

## Testing Summary

### Automated Tests to Add/Update

**File**: `server/__tests__/prepare.routes.test.ts`
```typescript
// Add test for BUG #3
describe('POST /api/prepare/self-intro/coaching', () => {
  it('should return coaching for valid request');
  it('should return helpful message for empty field');
  it('should require authentication');
  it('should deduct 2 credits');
  it('should handle OpenAI service errors');
});
```

**File**: `server/__tests__/s3-service.test.ts` (NEW)
```typescript
// Add tests for BUG #8
describe('S3Service', () => {
  it('should upload profile photo to S3');
  it('should delete old profile photo');
  it('should generate correct S3 URL');
  it('should handle upload errors gracefully');
  it('should pass health check');
});
```

### Manual Testing Checklist

**BUG #3: Self-Intro Coaching**
- [ ] Coaching works on all 4 steps
- [ ] Different content produces different coaching
- [ ] Empty fields handled gracefully
- [ ] Credits deducted correctly (2 credits)
- [ ] No duplicate charges

**BUG #4: Credit Deduction**
- [ ] Duplicate operations rejected (409 error)
- [ ] Credits deducted after operation success
- [ ] Failed operations don't charge credits
- [ ] Transaction logs accurate

**BUG #5: Video Analysis**
- [ ] UI clearly states "script-based"
- [ ] Alert explains current capabilities
- [ ] Feedback includes delivery tips
- [ ] No misleading claims

**BUG #7: Error Messages**
- [ ] All error types have specific messages
- [ ] Network errors detected and explained
- [ ] Messages include next steps
- [ ] Error codes logged

**BUG #8: Profile Photos**
- [ ] Photos upload to S3
- [ ] Photos display correctly
- [ ] Photos persist across instances
- [ ] Old photos deleted automatically

---

## Dependencies & Prerequisites

### NPM Packages
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Environment Variables

**Development** (`.env`):
```bash
# S3 Configuration (BUG #8)
S3_BUCKET_NAME=p3-user-uploads
AWS_REGION=ap-southeast-1

# These should already be configured:
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

**Staging/Production** (AWS Elastic Beanstalk):
```bash
# Configure via AWS Console or CLI
eb setenv S3_BUCKET_NAME=p3-user-uploads
```

### Database Setup
```sql
-- Add credit cost for self-intro coaching (BUG #3)
INSERT INTO credit_costs (feature_name, credit_cost, description, is_active)
VALUES ('self-intro-coaching', 2, 'Personalized AI coaching for self-introduction steps', true)
ON CONFLICT (feature_name) DO UPDATE SET
  credit_cost = 2,
  is_active = true;
```

### AWS Resources

**S3 Bucket** (BUG #8):
```bash
# Create bucket
aws s3 mb s3://p3-user-uploads --region ap-southeast-1

# Configure public access
aws s3api put-public-access-block \
  --bucket p3-user-uploads \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy
aws s3api put-bucket-policy \
  --bucket p3-user-uploads \
  --policy file://bucket-policy.json

# Configure CORS
aws s3api put-bucket-cors \
  --bucket p3-user-uploads \
  --cors-configuration file://s3-cors.json
```

---

## Risk Assessment

### Low Risk ✅
- **BUG #3** (Coaching): New endpoint, doesn't affect existing features
- **BUG #7** (Errors): Frontend-only changes, improves UX
- **BUG #9** (Script Polish): No action needed

### Medium Risk ⚠️
- **BUG #5** (Video Analysis): UI changes may initially confuse some users
  - Mitigation: Clear messaging about current vs. future capabilities
  - Mitigation: Monitor user feedback and adjust messaging if needed

### High Risk 🔴
- **BUG #4** (Credits): Already implemented, but verification is critical
  - Mitigation: Thorough testing before marking complete
  - Mitigation: Monitor transaction logs after deployment

- **BUG #8** (Profile Photos): Infrastructure change requires careful setup
  - Mitigation: Test thoroughly in staging first
  - Mitigation: Have rollback plan ready (USE_S3_STORAGE flag)
  - Mitigation: Verify S3 bucket permissions carefully

---

## Success Criteria

### Overall Phase 2 Success
- ✅ All 6 bugs addressed (5 implemented, 1 verified)
- ✅ All manual tests pass
- ✅ No new bugs introduced
- ✅ Founder UAT approval obtained
- ✅ Successfully deployed to production
- ✅ Documentation updated

### Per-Bug Success Criteria

**BUG #3**:
- Users receive relevant AI coaching on each self-intro step
- Different content produces different coaching
- Credits deducted correctly (2 credits)

**BUG #4**:
- No duplicate credit charges
- Credits only deducted after successful operations
- Failed operations don't charge users

**BUG #5**:
- UI transparency about current capabilities
- No misleading claims about video processing
- Delivery recommendations provided

**BUG #7**:
- All error scenarios have clear, helpful messages
- Network errors explicitly handled
- Users know what to do next

**BUG #8**:
- Photos upload and display correctly
- Photos persist across server restarts
- No broken images or 404 errors

---

## Documentation Updates

### Files to Update After Implementation

1. **`docs/bugs/2025-11-24-founder-uat-status-update.md`**
   - Mark Phase 2 bugs as complete
   - Add implementation summary
   - Update testing status

2. **`docs/ops-log/2025-11.md`**
   - Add Phase 2 completion entry
   - Document deployment timeline
   - Record any issues encountered

3. **`CLAUDE.md`**
   - Update "Outstanding Items" section
   - Remove Phase 2 from pending work
   - Update "Recent Updates" with Phase 2 completion

4. **API Documentation** (if exists)
   - Document new `/self-intro/coaching` endpoint
   - Update error code reference

---

## Contact & Support

**For Implementation Questions**:
- Reference this document
- Check codebase for existing patterns
- Review similar implementations (e.g., existing coaching endpoints)

**For Testing Issues**:
- Document the exact steps to reproduce
- Include screenshots if UI-related
- Check browser console for errors
- Review server logs for backend errors

**For Deployment Issues**:
- See `DEPLOYMENT.md` for detailed procedures
- Check GitHub Actions workflow logs
- Review AWS CloudWatch logs

---

**Document Version**: 1.0
**Last Updated**: 2025-11-24
**Status**: 📋 Planning Complete → ⏳ Ready for Implementation
