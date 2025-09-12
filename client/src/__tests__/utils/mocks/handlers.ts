import { http, HttpResponse } from 'msw';
import type { InterviewType, JobDescription } from '@shared/schema';

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

const mockJobDescriptions: JobDescription[] = [
  {
    id: 'job-desc-1',
    userId: 'test-user-123',
    fileName: 'business-manager-job.pdf',
    content: 'Business Manager position at Microsoft...',
    uploadedAt: new Date(),
    fileSize: 1024,
    fileUrl: '/uploads/job-desc-1.pdf',
  },
];

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
    const customScenarios = mockScenarios.map(scenario => ({
      ...scenario,
      id: `dynamic-${stage}-${Date.now()}`,
      interviewStage: stage,
      jobRole: userJobPosition,
      companyBackground: userCompanyName,
      description: `Customized ${stage} interview for ${userJobPosition} at ${userCompanyName}`,
    }));

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

    const session = {
      ...mockSession,
      scenarioId: body.scenarioId,
      userJobPosition: body.userJobPosition,
      userCompanyName: body.userCompanyName,
      interviewLanguage: body.interviewLanguage || 'en',
    };

    return HttpResponse.json(session, { status: 201 });
  }),

  // Job descriptions API
  http.get('/api/job-descriptions/user/:userId', ({ params }) => {
    const { userId } = params;
    if (userId === 'test-user-123') {
      return HttpResponse.json(mockJobDescriptions);
    }
    return HttpResponse.json([]);
  }),

  // Handle edge case for empty userId
  http.get('/api/job-descriptions/user/', () => {
    return HttpResponse.json([]);
  }),

  http.post('/api/job-descriptions', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return HttpResponse.json(
        { message: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // Simulate file validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return HttpResponse.json(
        { message: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return HttpResponse.json(
        { message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' },
        { status: 400 }
      );
    }

    const newJobDescription = {
      id: `job-desc-${Date.now()}`,
      userId,
      fileName: file.name,
      content: `Mock content for ${file.name}`,
      uploadedAt: new Date(),
      fileSize: file.size,
      fileUrl: `/uploads/job-desc-${Date.now()}.pdf`,
    };

    return HttpResponse.json(newJobDescription, { status: 201 });
  }),

  http.delete('/api/job-descriptions/:id', ({ params }) => {
    const { id } = params;
    // Mock successful deletion
    return HttpResponse.json({ message: 'Job description deleted successfully' });
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
export { mockScenarios, mockSession, mockJobDescriptions };