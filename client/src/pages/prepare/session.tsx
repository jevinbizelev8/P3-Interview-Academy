import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, CheckCircle, Clock } from "lucide-react";

export default function PrepareSession() {
  const params = useParams();
  const sessionId = params.sessionId;

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/prepare/sessions", sessionId],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
          <p className="text-gray-600 mb-6">The preparation session you're looking for doesn't exist.</p>
          <Button onClick={() => window.location.href = '/prepare'}>
            Back to Prepare
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/prepare'}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Prepare
          </Button>
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          </div>
        </div>

        {/* Session Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500">Current Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-semibold capitalize">{session.currentStage || 'Wonder'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {session.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-600" />
                )}
                <span className="font-semibold capitalize">{session.status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500">Framework</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-semibold">WGLL Method</span>
            </CardContent>
          </Card>
        </div>

        {/* WGLL Framework Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>WGLL Framework Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { stage: 'wonder', title: 'Wonder', description: 'Explore diverse question types' },
                { stage: 'gather', title: 'Gather', description: 'Collect experiences and examples' },
                { stage: 'link', title: 'Link', description: 'Connect to STAR structure' },
                { stage: 'launch', title: 'Launch', description: 'Practice confident delivery' }
              ].map((stage, index) => (
                <div 
                  key={stage.stage}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    session.currentStage === stage.stage 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      session.currentStage === stage.stage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <h3 className="ml-3 font-semibold">{stage.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{stage.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Content */}
        <Card>
          <CardHeader>
            <CardTitle>Session Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Preparation Session Interface</h3>
              <p className="text-gray-600 mb-6">
                The interactive preparation session interface will be implemented here with AI-powered questions, 
                STAR method guidance, and real-time feedback.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Start Wonder Stage
                </Button>
                <Button variant="outline">
                  View Previous Work
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}