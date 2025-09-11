import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Download, 
  RotateCcw, 
  History, 
  Share, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { InterviewSessionWithScenario } from "@shared/schema";

export default function PostInterviewAssessment() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading, error } = useQuery<InterviewSessionWithScenario>({
    queryKey: [`/api/practice/sessions/${sessionId}`],
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
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const handleDownloadTranscript = async () => {
    try {
      const response = await fetch(`/api/practice/sessions/${sessionId}/transcript`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download transcript");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `interview-transcript-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading transcript:", error);
      toast({
        title: "Error",
        description: "Failed to download transcript. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePracticeAgain = () => {
    setLocation("/practice");
  };

  const handleViewHistory = () => {
    // TODO: Implement session history view
    toast({
      title: "Coming Soon",
      description: "Session history feature will be available soon.",
    });
  };

  const handleShareResults = () => {
    // TODO: Implement sharing functionality
    toast({
      title: "Coming Soon",
      description: "Results sharing feature will be available soon.",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl h-48"></div>
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

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
            <p className="text-gray-600 mb-6">
              The interview assessment you're looking for doesn't exist.
            </p>
            <Button onClick={() => setLocation("/practice")}>
              Back to Scenarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status !== 'completed') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Not Complete</h2>
            <p className="text-gray-600 mb-6">
              This interview session hasn't been completed yet.
            </p>
            <div className="space-x-4">
              <Button onClick={() => setLocation(`/practice/interview/${sessionId}`)}>
                Continue Interview
              </Button>
              <Button variant="outline" onClick={() => setLocation("/practice")}>
                Back to Scenarios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallScore = parseFloat(session.overallScore || '0');
  const situationScore = parseFloat(session.situationScore || '0');
  const taskScore = parseFloat(session.taskScore || '0');
  const actionScore = parseFloat(session.actionScore || '0');
  const resultScore = parseFloat(session.resultScore || '0');
  const flowScore = parseFloat(session.flowScore || '0');

  const duration = session.duration ? Math.floor(session.duration / 60) : 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Interview Complete!</h2>
          <p className="text-green-100 text-lg">
            Well done on completing your {session.scenario.interviewStage.replace('-', ' ')} practice session
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Performance */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Overall Performance</h3>
              
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {overallScore.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-6 h-6 ${
                          star <= overallScore 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-600">Out of 5.0</p>
                </div>
              </div>

              {/* STAR Method Breakdown */}
              <h4 className="font-semibold text-gray-900 mb-3">STAR Method Assessment</h4>
              <div className="space-y-3">
                {[
                  { label: 'Situation', score: situationScore, description: 'Context setting clarity' },
                  { label: 'Task', score: taskScore, description: 'Responsibility clarity' },
                  { label: 'Action', score: actionScore, description: 'Specific steps taken' },
                  { label: 'Result', score: resultScore, description: 'Quantified outcomes' },
                  { label: 'Flow', score: flowScore, description: 'Narrative coherence' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-sm font-medium text-gray-900 w-20">
                        {item.label}
                      </span>
                      <div className="ml-4 flex-1 flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${
                              item.score >= 4 ? 'bg-green-500' :
                              item.score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(item.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.score.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Feedback */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
              
              {/* Qualitative Summary */}
              {(session as any)?.qualitativeFeedback ? (
                <div className="mb-6">
                  <p className="text-gray-700">{String(session.qualitativeFeedback)}</p>
                </div>
              ) : null}

              {(session as any)?.strengths && Array.isArray((session as any).strengths) && (session as any).strengths.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Strengths
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    {(session as any).strengths.map((strength: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        <span>{strength as string}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(session as any)?.improvements && Array.isArray((session as any).improvements) && (session as any).improvements.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-yellow-600 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    {(session as any).improvements.map((improvement: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        <span>{improvement as string}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {session?.recommendations && Array.isArray(session.recommendations) && session.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-primary mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Recommendations for Next Time
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    {session.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        <span>{recommendation as string}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Session Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Session Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{duration}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions completed:</span>
                  <span className="font-medium">15 of 15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion rate:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    100%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-medium text-xs">#{sessionId.slice(-6)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleDownloadTranscript}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Transcript
                </Button>
                <Button
                  onClick={() => setLocation(`/perform/evaluation/${sessionId}`)}
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View Detailed Report
                </Button>
                <Button
                  onClick={handlePracticeAgain}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Practice Again
                </Button>
                <Button
                  onClick={() => setLocation("/perform")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <History className="w-4 h-4 mr-2" />
                  View Analytics Dashboard
                </Button>
                <Button
                  onClick={handleShareResults}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Your Progress</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  {session.scenario.interviewStage.replace('-', ' ')}: <span className="font-medium">Session complete</span>
                </p>
                <p>Average score: <span className="font-medium">{overallScore.toFixed(1)}/5</span></p>
                <p>
                  Next suggested stage: <span className="font-medium">
                    {session.scenario.interviewStage === 'phone-screening' ? 'Functional/Team Interview' :
                     session.scenario.interviewStage === 'functional-team' ? 'Hiring Manager Interview' :
                     session.scenario.interviewStage === 'hiring-manager' ? 'Subject-Matter Expertise' :
                     session.scenario.interviewStage === 'subject-matter' ? 'Executive/Final Round' :
                     'All stages complete!'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
