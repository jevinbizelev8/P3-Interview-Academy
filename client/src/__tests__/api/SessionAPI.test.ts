import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '../utils/mocks/server';
import { http, HttpResponse } from 'msw';
import { apiRequest } from '@/lib/queryClient';

describe('Session API Integration', () => {
  describe('Scenario Generation API', () => {
    it('generates dynamic scenarios successfully', async () => {
      const response = await apiRequest('GET', '/api/practice/scenarios?stage=hiring-manager&userJobPosition=Business%20Manager&userCompanyName=Microsoft');
      const scenarios = await response.json();

      expect(scenarios).toHaveLength(1);
      expect(scenarios[0]).toMatchObject({
        id: expect.stringMatching(/^dynamic-hiring-manager-\d+$/),
        interviewStage: 'hiring-manager',
        jobRole: 'Business Manager',
        companyBackground: 'Microsoft',
        title: expect.stringContaining('Hiring Manager Interview'),
        description: expect.stringContaining('Customized hiring-manager interview for Business Manager at Microsoft'),
      });
    });

    it('requires all query parameters', async () => {
      const response = await apiRequest('GET', '/api/practice/scenarios?stage=hiring-manager');
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.message).toBe('Missing required parameters');
    });

    it('handles different interview stages', async () => {
      const stages = ['phone-screening', 'functional-team', 'hiring-manager', 'subject-matter-expertise', 'executive-final'];

      for (const stage of stages) {
        const response = await apiRequest('GET', `/api/practice/scenarios?stage=${stage}&userJobPosition=Test%20Role&userCompanyName=Test%20Company`);
        const scenarios = await response.json();

        expect(scenarios[0].interviewStage).toBe(stage);
        expect(scenarios[0].title).toContain(stage.replace('-', ' '));
      }
    });

    it('customizes scenario content based on job position and company', async () => {
      const testCases = [
        { position: 'Software Engineer', company: 'Google' },
        { position: 'Marketing Manager', company: 'Apple' },
        { position: 'Data Scientist', company: 'Meta' },
      ];

      for (const { position, company } of testCases) {
        const response = await apiRequest('GET', `/api/practice/scenarios?stage=hiring-manager&userJobPosition=${encodeURIComponent(position)}&userCompanyName=${encodeURIComponent(company)}`);
        const scenarios = await response.json();

        expect(scenarios[0].jobRole).toBe(position);
        expect(scenarios[0].companyBackground).toBe(company);
        expect(scenarios[0].description).toContain(position);
        expect(scenarios[0].description).toContain(company);
      }
    });
  });

  describe('Session Creation API', () => {
    it('creates session successfully with valid data', async () => {
      const sessionData = {
        scenarioId: 'dynamic-hiring-manager-123',
        userJobPosition: 'Business Manager',
        userCompanyName: 'Microsoft',
        interviewLanguage: 'en',
      };

      const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
      const session = await response.json();

      expect(response.status).toBe(201);
      expect(session).toMatchObject({
        id: 'session-123',
        scenarioId: sessionData.scenarioId,
        userJobPosition: sessionData.userJobPosition,
        userCompanyName: sessionData.userCompanyName,
        interviewLanguage: sessionData.interviewLanguage,
        status: 'in_progress',
      });
    });

    it('validates required fields', async () => {
      const invalidRequests = [
        {}, // Empty object
        { scenarioId: 'test' }, // Missing userJobPosition and userCompanyName
        { userJobPosition: 'Manager' }, // Missing scenarioId and userCompanyName
        { userCompanyName: 'Company' }, // Missing scenarioId and userJobPosition
        { scenarioId: 'test', userJobPosition: 'Manager' }, // Missing userCompanyName
      ];

      for (const invalidData of invalidRequests) {
        const response = await apiRequest('POST', '/api/practice/sessions', invalidData);
        
        expect(response.status).toBe(400);
        const error = await response.json();
        expect(error.message).toContain('Missing required fields');
      }
    });

    it('defaults to English language when not specified', async () => {
      const sessionData = {
        scenarioId: 'test-scenario',
        userJobPosition: 'Manager',
        userCompanyName: 'Company',
      };

      const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
      const session = await response.json();

      expect(session.interviewLanguage).toBe('en');
    });

    it('accepts different ASEAN languages', async () => {
      const languages = ['en', 'ms', 'id', 'th', 'vi', 'tl', 'my', 'km', 'zh-sg'];

      for (const language of languages) {
        const sessionData = {
          scenarioId: `test-scenario-${language}`,
          userJobPosition: 'Manager',
          userCompanyName: 'Company',
          interviewLanguage: language,
        };

        const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
        const session = await response.json();

        expect(session.interviewLanguage).toBe(language);
      }
    });

    it('handles special characters in job position and company name', async () => {
      const specialCharacterTests = [
        { position: 'Vice-President & CEO', company: 'Johnson & Johnson' },
        { position: 'Sr. Software Engineer (Full-Stack)', company: 'AT&T Inc.' },
        { position: 'Marketing Manager - Asia Pacific', company: 'Procter & Gamble' },
      ];

      for (const { position, company } of specialCharacterTests) {
        const sessionData = {
          scenarioId: 'test-scenario-special',
          userJobPosition: position,
          userCompanyName: company,
          interviewLanguage: 'en',
        };

        const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
        const session = await response.json();

        expect(response.status).toBe(201);
        expect(session.userJobPosition).toBe(position);
        expect(session.userCompanyName).toBe(company);
      }
    });
  });

  describe('Complete Session Flow API', () => {
    it('handles complete scenario-to-session creation flow', async () => {
      // Step 1: Generate scenario
      const scenarioResponse = await apiRequest('GET', '/api/practice/scenarios?stage=hiring-manager&userJobPosition=Product%20Manager&userCompanyName=Apple');
      const scenarios = await scenarioResponse.json();
      
      expect(scenarios).toHaveLength(1);
      const scenario = scenarios[0];

      // Step 2: Create session with scenario
      const sessionData = {
        scenarioId: scenario.id,
        userJobPosition: 'Product Manager',
        userCompanyName: 'Apple',
        interviewLanguage: 'en',
      };

      const sessionResponse = await apiRequest('POST', '/api/practice/sessions', sessionData);
      const session = await sessionResponse.json();

      expect(sessionResponse.status).toBe(201);
      expect(session.scenarioId).toBe(scenario.id);
      expect(session.userJobPosition).toBe('Product Manager');
      expect(session.userCompanyName).toBe('Apple');
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      // Add error handlers to MSW server
      server.use(
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
        })
      );
    });

    it('handles scenario generation errors', async () => {
      const response = await apiRequest('GET', '/api/practice/scenarios/error');
      
      expect(response.status).toBe(500);
      const error = await response.json();
      expect(error.message).toBe('Internal server error');
    });

    it('handles session creation errors', async () => {
      const sessionData = {
        scenarioId: 'test',
        userJobPosition: 'Manager',
        userCompanyName: 'Company',
      };

      const response = await apiRequest('POST', '/api/practice/sessions/error', sessionData);
      
      expect(response.status).toBe(500);
      const error = await response.json();
      expect(error.message).toBe('Failed to create session');
    });

    it('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.get('/api/practice/scenarios/network-error', () => {
          return HttpResponse.error();
        })
      );

      try {
        await apiRequest('GET', '/api/practice/scenarios/network-error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Data Validation', () => {
    it('validates scenario ID format', async () => {
      const invalidScenarioIds = [
        '', // Empty string
        null, // Null
        undefined, // Undefined
        123, // Number
        {}, // Object
      ];

      for (const invalidId of invalidScenarioIds) {
        const sessionData = {
          scenarioId: invalidId,
          userJobPosition: 'Manager',
          userCompanyName: 'Company',
        };

        const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
        expect(response.status).toBe(400);
      }
    });

    it('validates job position format', async () => {
      const validPositions = [
        'Software Engineer',
        'Senior Vice President of Engineering',
        'Marketing Manager - APAC',
        'Data Scientist (ML/AI)',
        'Chief Executive Officer',
      ];

      for (const position of validPositions) {
        const sessionData = {
          scenarioId: 'valid-scenario',
          userJobPosition: position,
          userCompanyName: 'Test Company',
        };

        const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
        expect(response.status).toBe(201);
      }
    });

    it('validates company name format', async () => {
      const validCompanyNames = [
        'Microsoft Corporation',
        'Johnson & Johnson',
        'AT&T Inc.',
        'Procter & Gamble Co.',
        'PwC',
        'KPMG',
        '3M',
      ];

      for (const companyName of validCompanyNames) {
        const sessionData = {
          scenarioId: 'valid-scenario',
          userJobPosition: 'Manager',
          userCompanyName: companyName,
        };

        const response = await apiRequest('POST', '/api/practice/sessions', sessionData);
        expect(response.status).toBe(201);
      }
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('handles multiple concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        apiRequest('GET', `/api/practice/scenarios?stage=hiring-manager&userJobPosition=Manager${i}&userCompanyName=Company${i}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
      });
    });

    it('handles rapid session creation requests', async () => {
      const rapidRequests = Array.from({ length: 5 }, (_, i) => {
        const sessionData = {
          scenarioId: `scenario-${i}`,
          userJobPosition: `Manager-${i}`,
          userCompanyName: `Company-${i}`,
        };
        
        return apiRequest('POST', '/api/practice/sessions', sessionData);
      });

      const responses = await Promise.all(rapidRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});