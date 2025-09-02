import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuestionInterface from "@/components/QuestionInterface";
import ResponseInterface from "@/components/ResponseInterface";
import { SessionProvider } from "@/contexts/SessionContext";
import type { InterviewSession, Question, Response } from "@shared/schema";

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
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery<InterviewSession>({
    queryKey: [`/api/prepare/sessions/${sessionId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/prepare/sessions/${sessionId}`);
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Load session questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/practice/sessions/${sessionId}/questions`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/practice/sessions/${sessionId}/questions`);
      return response.json();
    },
    enabled: !!sessionId,
  });

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
                  {session.userJobPosition && session.userCompanyName 
                    ? `${session.userJobPosition} at ${session.userCompanyName}`
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
            {/* Question Interface */}
            {currentQuestion && (
              <QuestionInterface
                question={currentQuestion}
                currentIndex={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                selectedLanguage={session.interviewLanguage}
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

            {/* Navigation */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="text-sm text-gray-600">
                    {isLastQuestion ? (
                      <span className="text-green-600 font-medium">Ready to complete session</span>
                    ) : (
                      <span>Continue to next question</span>
                    )}
                  </div>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleCompleteSession}
                      disabled={completeSessionMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Session
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-blue-800">
                    <Save className="w-4 h-4 mr-2" />
                    Auto-save enabled
                  </div>
                  <div className="text-blue-600">
                    Session ID: {sessionId.slice(0, 8)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}