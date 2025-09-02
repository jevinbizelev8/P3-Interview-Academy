import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CoachingChat } from '@/components/CoachingChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Settings, Clock, Target, BookOpen, Star } from 'lucide-react';

interface CoachingSession {
  id: string;
  userId: string;
  jobPosition: string;
  companyName?: string;
  interviewStage: string;
  preferredLanguage: string;
  primaryIndustry?: string;
  specializations: string[];
  experienceLevel: string;
  technicalDepth?: string;
  industryContext?: any;
  coachingGoals?: any;
  status: 'active' | 'completed' | 'paused';
  totalQuestions: number;
  currentQuestion: number;
  timeAllocation: number;
  overallProgress: string;
  coachingScore?: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
  feedback: any[];
  industryInsights: any[];
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
                <span className="ml-2 font-medium">{session.totalQuestions}</span>
              </div>
              <div>
                <span className="text-gray-600">Time allocation:</span>
                <span className="ml-2 font-medium">{session.timeAllocation}m</span>
              </div>
              <div>
                <span className="text-gray-600">Experience:</span>
                <span className="ml-2 font-medium capitalize">{session.experienceLevel}</span>
              </div>
              <div>
                <span className="text-gray-600">Language:</span>
                <span className="ml-2 font-medium">{session.preferredLanguage.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Introduction Section */}
      <SessionIntroduction 
        session={session}
      />

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <CoachingChat 
          sessionId={session.id}
          sessionDetails={{
            jobPosition: session.jobPosition,
            companyName: session.companyName,
            interviewStage: session.interviewStage,
            primaryIndustry: session.primaryIndustry,
            experienceLevel: session.experienceLevel,
            totalQuestions: session.totalQuestions,
            currentQuestion: session.currentQuestion
          }}
        />
      </div>
    </div>
  );
}

// New component for session introduction
function SessionIntroduction({ session }: { session: CoachingSession }) {
  const [introductionText, setIntroductionText] = useState<string>('');
  const [isIntroCollapsed, setIsIntroCollapsed] = useState(false);
  
  // Fetch session messages to extract introduction
  const { data: messages } = useQuery({
    queryKey: ['coaching-messages', session.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/coaching/sessions/${session.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return result.data;
    }
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      // Find the introduction message (first coach message with type 'introduction')
      const introMessage = messages.find((msg: any) => 
        msg.messageType === 'coach' && 
        msg.coachingType === 'introduction'
      );
      
      if (introMessage) {
        setIntroductionText(introMessage.content);
      }
    }
  }, [messages]);

  const formatInterviewStage = (stage: string) => {
    return stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!introductionText) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">
                    {session.jobPosition} at {session.companyName || 'Your Target Company'}
                  </CardTitle>
                  <p className="text-xs text-gray-600">
                    {formatInterviewStage(session.interviewStage)} • {session.experienceLevel} Level
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsIntroCollapsed(!isIntroCollapsed)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isIntroCollapsed ? 'Show Details' : 'Hide Details'}
              </Button>
            </div>
          </CardHeader>
          
          {!isIntroCollapsed && (
            <CardContent className="pt-0 pb-3">
              <div className="text-sm text-gray-700 leading-relaxed mb-3">
                <p className="line-clamp-2">{introductionText}</p>
              </div>
              
              {/* Compact session highlights */}
              <div className="flex items-center gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{session.timeAllocation}min</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{session.totalQuestions} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>STAR Method</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}