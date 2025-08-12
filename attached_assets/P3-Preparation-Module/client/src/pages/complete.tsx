import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import ProgressTracker from "@/components/ProgressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Download, RotateCcw, Share2 } from "lucide-react";

export default function Complete() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();

  const { data: session } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: responses } = useQuery({
    queryKey: ['/api/responses/session', sessionId],
    enabled: !!sessionId,
  });

  if (!session || !responses) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Loading...</h2>
          </div>
        </main>
      </div>
    );
  }

  const averageScore = Array.isArray(responses) && responses.length > 0 
    ? responses.reduce((sum: number, r: any) => sum + (r.feedback?.score || 0), 0) / responses.length 
    : 0;
  const totalTime = Array.isArray(responses) 
    ? responses.reduce((sum: number, r: any) => sum + (r.timeSpent || 0), 0) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressTracker 
          currentStage="complete" 
          currentStep={4}
          totalSteps={4}
        />

        {/* Congratulations Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-success-green rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Congratulations! 🎉
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You've successfully completed your interview preparation session. 
            Here's a summary of your performance and next steps.
          </p>
        </div>

        {/* Performance Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-primary-blue mb-2">
                  {Math.round(averageScore * 10) / 10}
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-xs text-gray-500">out of 5.0</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-success-green mb-2">
                  {Array.isArray(responses) ? responses.length : 0}
                </div>
                <div className="text-sm text-gray-600">Questions Completed</div>
                <div className="text-xs text-gray-500">100% completion</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-warning-yellow mb-2">
                  {Math.round(totalTime / 60)}
                </div>
                <div className="text-sm text-gray-600">Minutes Practiced</div>
                <div className="text-xs text-gray-500">total session time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Achievements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success-green rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">STAR Framework Mastery</div>
                  <div className="text-sm text-gray-600">
                    Successfully structured {Array.isArray(responses) && responses.length > 0 ? Math.round((responses.filter((r: any) => r.feedback?.starCompliance?.situation).length / responses.length) * 100) : 0}% of responses using STAR method
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Communication Excellence</div>
                  <div className="text-sm text-gray-600">
                    Demonstrated clear and concise communication in technical explanations
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-warning-yellow rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Detailed Examples</div>
                  <div className="text-sm text-gray-600">
                    Provided specific, measurable examples and outcomes
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-2">📚 Review WGLL Content</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Access expert model answers and detailed performance analysis to identify improvement areas.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation(`/review/${sessionId}`)}
                >
                  View Detailed Review
                </Button>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-gray-900 mb-2">🎯 Practice More</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Try different interview types or focus on specific areas that need improvement.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/')}
                >
                  Start New Session
                </Button>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-gray-900 mb-2">📤 Share Progress</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Download your performance report or share your achievements with mentors.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download Report
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setLocation(`/review/${sessionId}`)}
          >
            <Download className="w-5 h-5 mr-2" />
            View Detailed Review
          </Button>
          <Button 
            size="lg"
            onClick={() => setLocation('/')}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Start New Session
          </Button>
        </div>
      </main>
    </div>
  );
}
