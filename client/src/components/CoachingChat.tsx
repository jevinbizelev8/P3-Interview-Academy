import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Clock, 
  Star, 
  Lightbulb, 
  Target, 
  BookOpen 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CoachingMessage {
  id: string;
  sessionId: string;
  messageType: 'coach' | 'user';
  content: string;
  coachingType?: 'introduction' | 'question' | 'feedback' | 'summary' | 'response';
  questionNumber?: number | null;
  feedback?: {
    tips: string[];
    modelAnswer?: string;
    starAnalysis?: {
      situation?: { score: number; feedback: string; improvementAreas: string[] };
      task?: { score: number; feedback: string; improvementAreas: string[] };
      action?: { score: number; feedback: string; improvementAreas: string[] };
      result?: { score: number; feedback: string; improvementAreas: string[] };
      overallFlow?: { score: number; feedback: string; improvementAreas: string[] };
      overall?: number;
    };
    learningPoints: string[];
    nextSteps: string[];
  };
  timestamp: string;
}

interface CoachingChatProps {
  sessionId: string;
  sessionDetails: {
    jobPosition: string;
    companyName?: string;
    interviewStage: string;
    primaryIndustry?: string;
    experienceLevel: string;
    totalQuestions?: number;
    currentQuestion?: number;
  };
}

const cleanMessageContent = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n/g, '<br>');
};

export function CoachingChat({ sessionId, sessionDetails }: CoachingChatProps) {
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: sessionMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['coaching-messages', sessionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/coaching/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return result.data;
    }
  });

  const messages: CoachingMessage[] = sessionMessages || [];

  const startConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/start`);
      if (!response.ok) throw new Error('Failed to start conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-messages', sessionId] });
    }
  });

  const sendResponseMutation = useMutation({
    mutationFn: async (response: string) => {
      const result = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/respond`, {
        response
      });
      if (!result.ok) throw new Error('Failed to send response');
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-messages', sessionId] });
      setCurrentResponse('');
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await sendResponseMutation.mutateAsync(currentResponse);
    } catch (error) {
      console.error('Error sending response:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (messages && messages.length === 0 && !startConversationMutation.isPending) {
      startConversationMutation.mutate();
    }
  }, [sessionId, messages]);

  const handleCompleteSession = async () => {
    setIsCompleting(true);
    try {
      const response = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/complete`);
      if (response.ok) {
        const result = await response.json();
        setCompletionData(result.data);
        setShowCompletion(true);
      }
    } catch (error) {
      console.error('Error completing session:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderSTARAnalysis = (feedback: CoachingMessage['feedback']) => {
    if (!feedback?.starAnalysis) return null;

    const getScoreColor = (score: number) => {
      if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
      if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    };

    const getScoreBadge = (score: number) => {
      if (score >= 8) return 'Excellent';
      if (score >= 6) return 'Good';
      return 'Needs Work';
    };

    return (
      <Card className="mt-3 border-l-4 border-l-blue-500 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-900">
            <Star className="h-4 w-4 text-blue-600" />
            STAR Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {feedback.starAnalysis.situation && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.situation.score)}`}>
                <div className="text-xs font-medium mb-1">Situation</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.situation.score}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.situation.score)}</div>
              </div>
            )}
            {feedback.starAnalysis.task && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.task.score)}`}>
                <div className="text-xs font-medium mb-1">Task</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.task.score}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.task.score)}</div>
              </div>
            )}
            {feedback.starAnalysis.action && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.action.score)}`}>
                <div className="text-xs font-medium mb-1">Action</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.action.score}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.action.score)}</div>
              </div>
            )}
            {feedback.starAnalysis.result && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.result.score)}`}>
                <div className="text-xs font-medium mb-1">Result</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.result.score}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.result.score)}</div>
              </div>
            )}
          </div>
          
          {feedback.starAnalysis.overall && (
            <div className={`p-4 rounded-lg border-2 ${getScoreColor(feedback.starAnalysis.overall)} font-semibold`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Score</span>
                <span className="text-xl font-bold">{feedback.starAnalysis.overall}/10</span>
              </div>
              <div className="text-xs mt-1">{getScoreBadge(feedback.starAnalysis.overall)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderFeedback = (feedback: CoachingMessage['feedback']) => {
    if (!feedback) return null;

    return (
      <div className="space-y-4 mt-4">
        {renderSTARAnalysis(feedback)}

        {feedback.tips && feedback.tips.length > 0 && (
          <Card className="mt-3 border-l-4 border-l-green-500 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-900">
                <Lightbulb className="h-4 w-4 text-green-600" />
                Coaching Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedback.tips.map((tip, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-700">{index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">{tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {feedback.modelAnswer && (
          <Card className="mt-3 border-l-4 border-l-purple-500 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-900">
                <Target className="h-4 w-4 text-purple-600" />
                Model Answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed">{feedback.modelAnswer}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {feedback.learningPoints && feedback.learningPoints.length > 0 && (
          <Card className="mt-3 border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-900">
                <BookOpen className="h-4 w-4 text-orange-600" />
                Learning Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedback.learningPoints.map((point, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-orange-700">{index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Interview Coach</h1>
              <p className="text-sm text-gray-600">
                {sessionDetails.jobPosition} • {sessionDetails.interviewStage.replace('-', ' ')}
              </p>
            </div>
          </div>
          {sessionDetails.primaryIndustry && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {sessionDetails.primaryIndustry}
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages && messages.map((message) => {
            const cleanedContent = cleanMessageContent(message.content);

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.messageType === 'coach' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                )}

                <div className={`max-w-2xl ${message.messageType === 'user' ? 'order-first' : ''}`}>
                  {message.messageType === 'coach' && message.coachingType === 'feedback' && message.feedback ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                        <Bot className="h-4 w-4 inline mr-2 text-blue-600" />
                        Your response has been analyzed. Here is your detailed feedback:
                      </div>
                      {renderFeedback(message.feedback)}
                    </div>
                  ) : (
                    <div
                      className={`p-4 rounded-lg ${
                        message.messageType === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div 
                        className="whitespace-pre-wrap prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: cleanedContent }}
                      />
                      
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>

                {message.messageType === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {startConversationMutation.isPending && (!messages || messages.length === 0) && (
            <div className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Coach is preparing your personalized interview session...
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Coach is analyzing your response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {!showCompletion && (
              <>
                <div className="flex gap-3">
                  <Textarea
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your response here... (Press Enter to send)"
                    className="flex-1 min-h-[60px] resize-none"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="icon"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={() => setIsRecording(!isRecording)}
                      disabled={isLoading}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSendResponse}
                      disabled={!currentResponse.trim() || isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-500">
                      Press Enter to send • Shift+Enter for new line
                    </p>
                    {messages.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Question {Math.ceil(messages.length / 2)} of {sessionDetails.totalQuestions || 15}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {messages.length > 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCompleteSession}
                        disabled={isCompleting}
                        className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                      >
                        End Session Early
                      </Button>
                    )}
                    
                    {messages.length > 6 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCompleteSession}
                        disabled={isCompleting}
                        className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                      >
                        {isCompleting ? "Generating Summary..." : "Complete Session"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}