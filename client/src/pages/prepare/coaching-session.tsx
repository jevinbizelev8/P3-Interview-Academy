import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CoachingChat } from '@/components/CoachingChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Settings } from 'lucide-react';

interface CoachingSession {
  id: string;
  jobPosition: string;
  companyName?: string;
  interviewStage: string;
  primaryIndustry?: string;
  experienceLevel: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  sessionSettings: {
    questionCount: number;
    timePerQuestion: number;
    enableTranslation: boolean;
    targetLanguage: string;
    difficultyLevel: string;
  };
}

export function CoachingSessionPage() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['coaching-session', sessionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/coaching/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      const result = await response.json();
      return result.data as CoachingSession;
    },
    enabled: !!sessionId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading coaching session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              The coaching session could not be found or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/prepare')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prepare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/prepare')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div>
              <h1 className="font-semibold text-lg">
                {session.jobPosition} Interview Coaching
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {session.companyName && (
                  <>
                    <span>{session.companyName}</span>
                    <span>•</span>
                  </>
                )}
                <span>{session.interviewStage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                {session.primaryIndustry && (
                  <>
                    <span>•</span>
                    <span>{session.primaryIndustry}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge 
              variant={session.status === 'active' ? 'default' : 'secondary'}
            >
              {session.status}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Session Settings Panel */}
      {showSettings && (
        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Questions:</span>
                <span className="ml-2 font-medium">{session.sessionSettings.questionCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Time per question:</span>
                <span className="ml-2 font-medium">{Math.floor(session.sessionSettings.timePerQuestion / 60)}m</span>
              </div>
              <div>
                <span className="text-gray-600">Difficulty:</span>
                <span className="ml-2 font-medium capitalize">{session.sessionSettings.difficultyLevel}</span>
              </div>
              <div>
                <span className="text-gray-600">Language:</span>
                <span className="ml-2 font-medium">{session.sessionSettings.targetLanguage.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <CoachingChat 
          sessionId={session.id}
          sessionDetails={{
            jobPosition: session.jobPosition,
            companyName: session.companyName,
            interviewStage: session.interviewStage,
            primaryIndustry: session.primaryIndustry,
            experienceLevel: session.experienceLevel
          }}
        />
      </div>
    </div>
  );
}