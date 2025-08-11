import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Lightbulb, ArrowLeft, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { InterviewScenario } from "@shared/schema";

export default function PreInterviewBriefing() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  console.log('PreInterviewBriefing rendering with scenarioId:', scenarioId);

  const { data: scenario, isLoading, error } = useQuery<InterviewScenario>({
    queryKey: [`/api/practice/scenarios/${scenarioId}`],
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

  const handleStartInterview = async () => {
    try {
      // Create new interview session
      const response = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenarioId,
          status: "in_progress",
          currentQuestion: 1,
          totalQuestions: 15,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create interview session");
      }

      const session = await response.json();
      setLocation(`/practice/interview/${session.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to start interview session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 rounded-xl h-48"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scenario Not Found</h2>
            <p className="text-gray-600 mb-6">
              The interview scenario you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/practice")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scenarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-8 text-primary-foreground mb-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Interview Preparation Session</h2>
          <p className="text-lg opacity-90">
            You're about to begin a {scenario.interviewStage.replace('-', ' ')} interview simulation. 
            Take your time and respond naturally.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Brief */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 text-primary mr-2" />
                Scenario Brief
              </h3>
              <div className="prose prose-sm text-gray-700 max-w-none">
                <p><strong>Position:</strong> {scenario.jobRole}</p>
                <p><strong>Company:</strong> {scenario.companyBackground}</p>
                <p><strong>Interview Stage:</strong> {scenario.interviewStage.replace('-', ' ')}</p>
                <p><strong>Duration:</strong> 15-20 minutes</p>
                
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">Your Background</h4>
                <p>{scenario.candidateBackground}</p>
                
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">Key Objectives</h4>
                <div dangerouslySetInnerHTML={{
                  __html: scenario.keyObjectives
                    .split('\n')
                    .filter((line: string) => line.trim())
                    .map((line: string) => `<p>• ${line.replace(/^[•-]\s*/, '')}</p>`)
                    .join('')
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Interview Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                Interview Tips
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Use the STAR method for behavioural questions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Speak clearly and at a moderate pace</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Prepare specific examples from your experience</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Show enthusiasm and genuine interest</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Interviewer Profile */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Interviewer</h3>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-medium text-gray-600">
                    {scenario.interviewerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{scenario.interviewerName}</h4>
                  <p className="text-sm text-gray-600">{scenario.interviewerTitle}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Interview Style:</strong> {scenario.interviewerStyle}</p>
                <p><strong>Personality:</strong> {scenario.personalityTraits}</p>
              </div>
            </CardContent>
          </Card>

          {/* Session Controls */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">15 questions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated time:</span>
                  <span className="font-medium">15-20 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-save:</span>
                  <span className="font-medium text-green-600">Enabled</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={handleStartInterview}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/practice")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Choose Different Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
