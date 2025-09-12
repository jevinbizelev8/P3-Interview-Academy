import { http, HttpResponse } from 'msw';
import type { InterviewType } from '@shared/schema';

// Mock data
const mockScenarios = [
  {
    id: 'dynamic-hiring-manager-123',
    title: 'Hiring Manager Interview',
    description: 'Customized hiring-manager interview for Business Manager at Microsoft',
    interviewStage: 'hiring-manager',
    jobRole: 'Business Manager',
    companyBackground: 'Microsoft',
    candidateBackground: 'Professional seeking business management role',
    keyObjectives: 'Assess leadership and strategic thinking skills',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sessionCount: 0,
    averageScore: null,
  },
];

const mockSession = {
  id: 'session-123',
  userId: 'test-user-123',
  scenarioId: 'dynamic-hiring-manager-123',
  userJobPosition: 'Business Manager',
  userCompanyName: 'Microsoft',
  interviewLanguage: 'en',
  status: 'in_progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};


export const handlers = [
  // Scenarios API
  http.get('/api/practice/scenarios', ({ request }) => {
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage') as InterviewType;
    const userJobPosition = url.searchParams.get('userJobPosition');
    const userCompanyName = url.searchParams.get('userCompanyName');

    if (!stage || !userJobPosition || !userCompanyName) {
      return HttpResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    // Return mock scenarios customized for the request
    const customScenarios = mockScenarios.map(scenario => {
      const stageTitle = stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return {
        ...scenario,
        id: `dynamic-${stage}-${Date.now()}`,
        title: `${stageTitle} Interview`,
        interviewStage: stage,
        jobRole: userJobPosition,
        companyBackground: userCompanyName,
        description: `Customized ${stage} interview for ${userJobPosition} at ${userCompanyName}`,
      };
    });

    return HttpResponse.json(customScenarios);
  }),

  // Session creation API
  http.post('/api/practice/sessions', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.scenarioId || !body.userJobPosition || !body.userCompanyName) {
      return HttpResponse.json(
        { message: 'Missing required fields: scenarioId, userJobPosition, userCompanyName' },
        { status: 400 }
      );
    }

    // Validate scenario ID format
    if (typeof body.scenarioId !== 'string' || body.scenarioId.trim() === '') {
      return HttpResponse.json(
        { message: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    const session = {
      ...mockSession,
      scenarioId: body.scenarioId,
      userJobPosition: body.userJobPosition,
      userCompanyName: body.userCompanyName,
      interviewLanguage: body.interviewLanguage || 'en',
    };

    return HttpResponse.json(session, { status: 201 });
  }),


  // Error simulation handlers (can be activated in specific tests)
  http.get('/api/practice/scenarios/error', () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.post('/api/practice/sessions/error', () => {
    return HttpResponse.json(
      { message: 'Failed to create session' },
      { status: 500 }
    );
  }),
];

// Export specific mock data for use in tests
export { mockScenarios, mockSession };