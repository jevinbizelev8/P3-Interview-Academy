import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import ProgressTracker from "@/components/ProgressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { Session } from "@shared/schema";
import FeedbackPanel from "@/components/FeedbackPanel";

export default function Review() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();

  const { data: session } = useQuery<Session>({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: responses } = useQuery<any[]>({
    queryKey: ['/api/responses/session', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions } = useQuery<any[]>({
    queryKey: ['/api/questions', session?.interviewType],
    queryFn: async () => {
      if (!session?.interviewType) return [];
      const response = await fetch(`/api/questions?type=${session.interviewType}`);
      return response.json();
    },
    enabled: !!session?.interviewType,
  });

  if (!session || !responses || !questions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Loading...</h2>
          </div>
        </main>
      </div>
    );
  }

  // Calculate overall performance metrics
  const totalResponses = responses?.length || 0;
  const averageScore = totalResponses > 0 ? (responses?.reduce((sum: number, r: any) => sum + (r.feedback?.score || 0), 0) || 0) / totalResponses : 0;
  const completionRate = questions?.length ? (totalResponses / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressTracker 
          currentStage="evaluation" 
          currentStep={3}
          totalSteps={4}
        />

        {/* Session Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-success-green" />
              <span>Practice Session Complete</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-blue mb-2">
                  {Math.round(averageScore * 10) / 10}/5
                </div>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-green mb-2">
                  {Math.round(completionRate)}%
                </div>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-yellow mb-2">
                  {totalResponses}
                </div>
                <p className="text-sm text-gray-600">Questions Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Question-by-Question Review */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responses?.map((response: any, index: number) => {
                const question = questions.find((q: any) => q.id === response.questionId);
                if (!question) return null;

                return (
                  <div key={response.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Question {index + 1}: {question.question}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {question.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary-blue">
                          {response.feedback?.score || 0}/5
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>
                    
                    {/* Use FeedbackPanel for bilingual display */}
                    {response.feedback && (
                      <FeedbackPanel 
                        feedback={response.feedback} 
                        selectedLanguage={session?.language || 'en'} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center">
          <Button 
            size="lg"
            onClick={() => setLocation('/')}
          >
            Start New Session
          </Button>
        </div>
      </main>
    </div>
  );
}
