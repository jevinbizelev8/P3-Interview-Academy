import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnhancedQuestionInterface from "@/components/EnhancedQuestionInterface";
import ResponseInterface from "@/components/ResponseInterface";
import { SessionProvider } from "@/contexts/SessionContext";
import type { InterviewSession, PreparationSession, Question, Response } from "@shared/schema";

export default function PrepareDashboard() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  
  // Extract sessionId from URL query parameters
  const sessionId = new URLSearchParams(search).get('sessionId');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    document.title = "Preparation Session - P³ Interview Academy";
  }, []);

  // Redirect back if no sessionId
  useEffect(() => {
    if (!sessionId) {
      toast({
        title: "Session Required",
        description: "Please start a new preparation session.",
        variant: "destructive",
      });
      setLocation('/prepare');
    }
  }, [sessionId, setLocation]);

  // Load session data
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery<PreparationSession>({
    queryKey: [`/api/prepare/sessions/${sessionId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/prepare/sessions/${sessionId}`);
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Load session questions from enhanced question bank
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: [`/api/prepare/questions/session/${sessionId}`, session?.interviewStage],
    queryFn: async () => {
      const stage = session?.interviewStage || 'phone-screening';
      const language = session?.preferredLanguage || 'en';
      const response = await apiRequest('GET', `/api/prepare/questions/stage/${stage}?count=15&language=${language}`);
      const result = await response.json();
      return result.data;
    },
    enabled: !!sessionId && !!session,
  });

  const questions = questionsData?.questions || [];

  // Load session responses
  const { data: responses = [] } = useQuery<Response[]>({
    queryKey: [`/api/practice/sessions/${sessionId}/responses`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/practice/sessions/${sessionId}/responses`);
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Auto-save session progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/practice/sessions/${sessionId}/auto-save`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/practice/sessions/${sessionId}`] });
    },
  });

  // Complete session
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/practice/sessions/${sessionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Completed",
        description: "Your preparation session has been completed successfully.",
      });
      setLocation(`/prepare/review?sessionId=${sessionId}`);
    },
  });

  // Handle navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      saveProgressMutation.mutate({ currentQuestion: currentQuestionIndex });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      saveProgressMutation.mutate({ currentQuestion: currentQuestionIndex + 2 });
    } else {
      // Last question - complete session
      completeSessionMutation.mutate();
    }
  };

  const handleCompleteSession = () => {
    completeSessionMutation.mutate();
  };

  if (!sessionId) {
    return null;
  }

  if (sessionLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your preparation session...</h3>
            <p className="text-gray-600">Please wait while we set everything up.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Not Found</h3>
            <p className="text-gray-600 mb-6">The preparation session you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation('/prepare')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prepare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">No Questions Available</h3>
            <p className="text-gray-600 mb-6">There are no questions available for this preparation session.</p>
            <Button onClick={() => setLocation('/prepare')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prepare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses.find(r => r.questionId === currentQuestion?.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Preparation Session</h1>
                <p className="text-sm text-gray-600">
                  {session.jobPosition && session.companyName 
                    ? `${session.jobPosition} at ${session.companyName}`
                    : 'Interview Preparation'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/prepare')}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Exit
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Enhanced Question Interface */}
            {currentQuestion && (
              <EnhancedQuestionInterface
                question={currentQuestion}
                currentIndex={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                selectedLanguage={session.preferredLanguage}
                onPrevious={handlePreviousQuestion}
                onNext={handleNextQuestion}
                sessionProgress={progress}
                timeSpent={0}
              />
            )}

            {/* Response Interface */}
            {currentQuestion && (
              <ResponseInterface
                sessionId={sessionId}
                questionId={currentQuestion.id}
                currentResponse={currentResponse}
              />
            )}

            {/* Enhanced Session Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Session Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      0m 0s
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {responses.length} / {questions.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Save className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interview Stage</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {session.interviewStage?.replace('-', ' ') || 'General'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Completion Action */}
            {isLastQuestion && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Ready to Complete Session
                    </h3>
                    <p className="text-green-700 mb-6">
                      You've reached the final question. Complete your preparation session to receive detailed feedback and recommendations.
                    </p>
                    <Button
                      onClick={handleCompleteSession}
                      disabled={completeSessionMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Complete Preparation Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}