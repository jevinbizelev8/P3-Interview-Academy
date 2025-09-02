import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/practice/chat-interface";
import FeedbackPanel from "@/components/practice/feedback-panel";
import { Undo, Pause, Phone, Users, Bus, ServerCog, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";

const STAGE_ICONS = {
  'phone-screening': Phone,
  'functional-team': Users,
  'hiring-manager': Bus,
  'subject-matter': ServerCog,
  'executive-final': Crown,
};

export default function InterviewPractice() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUserResponse, setLastUserResponse] = useState("");

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["/api/practice/sessions", sessionId],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/auto-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Auto-save failed");
      }
      
      return response.json();
    },
  });

  // User response mutation
  const userResponseMutation = useMutation({
    mutationFn: async ({ content, questionContext }: { content: string; questionContext: string }) => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/user-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, questionContext }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to process response");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice/sessions", sessionId] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI question mutation
  const aiQuestionMutation = useMutation({
    mutationFn: async (userResponse?: string) => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/ai-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userResponse }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice/sessions", sessionId] });
    },
    onError: (error: any) => {
      console.error("AI question error:", error);
      toast({
        title: "Error",
        description: "Failed to get interviewer response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to complete interview");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setLocation(`/practice/assessment/${sessionId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Start auto-save interval
  useEffect(() => {
    if (session && session.status === 'in_progress') {
      const interval = setInterval(() => {
        autoSaveMutation.mutate({
          currentQuestion: session.currentQuestion,
          status: 'in_progress',
        });
      }, 10000); // Auto-save every 10 seconds
      
      setAutoSaveInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [session?.id]);

  // Generate initial AI question if no messages exist
  useEffect(() => {
    if (session && session.messages.length === 0) {
      aiQuestionMutation.mutate();
    }
  }, [session?.id]);

  const handleSendResponse = useCallback(async (content: string) => {
    if (!session || !content.trim()) return;
    
    setLastUserResponse(content);
    
    // Get the last AI message for context
    const lastAiMessage = session.messages
      .filter(m => m.messageType === 'ai')
      .slice(-1)[0];
    
    const questionContext = lastAiMessage?.content || "";
    
    // Send user response first
    await userResponseMutation.mutateAsync({ content, questionContext });
    
    // Then get AI response if we haven't reached the end
    if ((session.currentQuestion || 1) <= 15) {
      await aiQuestionMutation.mutateAsync(content);
    }
  }, [session, userResponseMutation, aiQuestionMutation]);

  const handleTryAgain = useCallback(() => {
    if (!session || session.messages.length === 0) return;
    
    // Find the last AI message and generate a new response
    const lastAiMessage = session.messages
      .filter(m => m.messageType === 'ai')
      .slice(-1)[0];
    
    if (lastAiMessage) {
      aiQuestionMutation.mutate(lastUserResponse);
    }
  }, [session, lastUserResponse, aiQuestionMutation]);

  const handleEndInterview = useCallback(() => {
    completeInterviewMutation.mutate();
  }, [completeInterviewMutation]);

  // Clean up auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveInterval]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="flex space-x-2">
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg h-96">
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h2>
            <p className="text-gray-600 mb-6">
              The interview session you're looking for doesn't exist or has expired.
            </p>
            <Button onClick={() => setLocation("/practice")}>
              Back to Scenarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((session.currentQuestion || 1) / 15) * 100;
  const StageIcon = STAGE_ICONS[session.scenario.interviewStage as keyof typeof STAGE_ICONS] || Phone;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Progress Header */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                <StageIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {session.scenario.interviewStage.replace('-', ' ')}
                </h2>
                <p className="text-sm text-gray-600">{session.scenario.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Question {session.currentQuestion || 1} of 15
                </p>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTryAgain}
                  disabled={aiQuestionMutation.isPending || session.messages.length === 0}
                >
                  <Undo className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndInterview}
                  disabled={completeInterviewMutation.isPending}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  End Interview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <ChatInterface
            session={session}
            onSendResponse={handleSendResponse}
            isLoading={userResponseMutation.isPending || aiQuestionMutation.isPending}
            autoSaveStatus={autoSaveMutation.isPending ? 'saving' : 'saved'}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <FeedbackPanel session={session} />
        </div>
      </div>
    </main>
  );
}
