import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Play, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PrepareSession() {
  const params = useParams();
  const sessionId = params.sessionId;
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [response, setResponse] = useState("");
  const [isActive, setIsActive] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/prepare/sessions", sessionId],
    enabled: !!sessionId,
  });

  // Sample Wonder stage questions for WGLL framework
  const wonderQuestions = [
    {
      id: "wonder-1",
      question: "Tell me about yourself and your professional background.",
      guidance: "This is your elevator pitch. Focus on recent experience relevant to the role."
    },
    {
      id: "wonder-2", 
      question: "Why are you interested in this position?",
      guidance: "Connect your career goals with the role and company mission."
    },
    {
      id: "wonder-3",
      question: "What are your greatest strengths?",
      guidance: "Choose 2-3 strengths with specific examples of how you've used them."
    },
    {
      id: "wonder-4",
      question: "Describe a challenging situation at work and how you handled it.",
      guidance: "Use the STAR method: Situation, Task, Action, Result."
    },
    {
      id: "wonder-5",
      question: "Where do you see yourself in 5 years?",
      guidance: "Show ambition while staying realistic and relevant to this role."
    }
  ];

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/prepare/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update session');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prepare/sessions", sessionId] });
    }
  });

  const handleStartStage = () => {
    setIsActive(true);
    setCurrentQuestion(0);
  };

  const handleNextQuestion = () => {
    if (response.trim()) {
      // Save response (would integrate with backend)
      console.log(`Saving response for question ${currentQuestion}:`, response);
      
      if (currentQuestion < wonderQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setResponse("");
      } else {
        // Completed Wonder stage
        toast({
          title: "Wonder Stage Complete!",
          description: "You've completed the Wonder stage. Ready to move to Gather?",
        });
        updateSessionMutation.mutate({ stage: "gather" });
        setIsActive(false);
      }
    }
  };

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
            <CardTitle>
              {isActive ? `Wonder Stage - Question ${currentQuestion + 1} of ${wonderQuestions.length}` : 'Session Content'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isActive ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Begin Wonder Stage</h3>
                <p className="text-gray-600 mb-6">
                  Start with the Wonder stage of the WGLL framework. You'll explore fundamental interview questions 
                  to build confidence and discover your storytelling approach.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleStartStage}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Wonder Stage
                  </Button>
                  <Button variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Framework Guide
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / wonderQuestions.length) * 100}%` }}
                  ></div>
                </div>

                {/* Current Question */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {wonderQuestions[currentQuestion].question}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    💡 {wonderQuestions[currentQuestion].guidance}
                  </p>
                </div>

                {/* Response Area */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Response
                  </label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Take your time to craft a thoughtful response..."
                    className="min-h-32 resize-none"
                    rows={6}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {response.length} characters
                    </span>
                    <Button 
                      onClick={handleNextQuestion}
                      disabled={!response.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {currentQuestion < wonderQuestions.length - 1 ? (
                        <>Next Question <ChevronRight className="w-4 h-4 ml-2" /></>
                      ) : (
                        <>Complete Wonder Stage <CheckCircle className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Session Progress */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Wonder Stage Progress</span>
                    <span>{currentQuestion + 1} / {wonderQuestions.length} questions</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}