import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StructuredFeedbackCard } from './StructuredFeedbackCard';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  User, 
  Bot, 
  Lightbulb,
  BookOpen,
  Target,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';

interface CoachingMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  questionData?: {
    question: string;
    stage: string;
    industry?: string;
    difficulty: string;
  };
  feedback?: {
    starAnalysis: {
      situation?: number;
      task?: number;
      action?: number;
      result?: number;
      overall: number;
    };
    tips: string[];
    modelAnswer: string;
    learningPoints: string[];
    nextSteps: string[];
  };
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

export function CoachingChat({ sessionId, sessionDetails }: CoachingChatProps) {
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages for the session
  const { data: sessionMessages } = useQuery({
    queryKey: ['coaching-messages', sessionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/coaching/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      // Filter out introduction messages since they're displayed separately
      return result.data.filter((msg: any) => msg.coachingType !== 'introduction');
    },
    enabled: !!sessionId
  });

  // Start coaching conversation
  const startConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/start`);
      if (!response.ok) throw new Error('Failed to start conversation');
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch messages to get the updated conversation
      queryClient.invalidateQueries({ queryKey: ['coaching-messages', sessionId] });
    }
  });

  // Send user response
  const sendResponseMutation = useMutation({
    mutationFn: async (response: string) => {
      const res = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/respond`, { response });
      if (!res.ok) throw new Error('Failed to send response');
      const result = await res.json();
      return result.data;
    },
    onSuccess: (data) => {
      // Add user message
      const userMessage: CoachingMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: currentResponse,
        timestamp: new Date()
      };

      // Add coach response with feedback
      const coachMessage: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: data.message,
        timestamp: new Date(),
        questionData: data.questionData,
        feedback: data.feedback
      };

      setMessages(prev => [...prev, userMessage, coachMessage]);
      setCurrentResponse('');
      queryClient.invalidateQueries({ queryKey: ['coaching-messages', sessionId] });
    }
  });

  const handleSendResponse = () => {
    if (!currentResponse.trim()) return;
    setIsLoading(true);
    sendResponseMutation.mutate(currentResponse, {
      onSettled: () => setIsLoading(false)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };

  // Sync fetched messages with local state
  useEffect(() => {
    if (sessionMessages && Array.isArray(sessionMessages)) {
      // Transform backend messages to frontend format
      const transformedMessages: CoachingMessage[] = sessionMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.messageType === 'coach' ? 'coach' : 'user',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        questionData: msg.questionData,
        feedback: msg.feedback
      }));
      setMessages(transformedMessages);
    }
  }, [sessionMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation if no messages and messages have been loaded
  useEffect(() => {
    if (sessionId && sessionMessages !== undefined && sessionMessages.length === 0 && !startConversationMutation.isPending) {
      startConversationMutation.mutate();
    }
  }, [sessionId, sessionMessages]);

  // Complete session and get model answers
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
            {feedback.starAnalysis.situation !== undefined && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.situation)}`}>
                <div className="text-xs font-medium mb-1">Situation</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.situation}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.situation)}</div>
              </div>
            )}
            {feedback.starAnalysis.task !== undefined && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.task)}`}>
                <div className="text-xs font-medium mb-1">Task</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.task}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.task)}</div>
              </div>
            )}
            {feedback.starAnalysis.action !== undefined && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.action)}`}>
                <div className="text-xs font-medium mb-1">Action</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.action}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.action)}</div>
              </div>
            )}
            {feedback.starAnalysis.result !== undefined && (
              <div className={`p-3 rounded-lg border ${getScoreColor(feedback.starAnalysis.result)}`}>
                <div className="text-xs font-medium mb-1">Result</div>
                <div className="text-lg font-bold">{feedback.starAnalysis.result}/10</div>
                <div className="text-xs">{getScoreBadge(feedback.starAnalysis.result)}</div>
              </div>
            )}
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${getScoreColor(feedback.starAnalysis.overall)} font-semibold`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Score</span>
              <span className="text-xl font-bold">{feedback.starAnalysis.overall}/10</span>
            </div>
            <div className="text-xs mt-1">{getScoreBadge(feedback.starAnalysis.overall)}</div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFeedback = (feedback: CoachingMessage['feedback']) => {
    if (!feedback) return null;

    return (
      <div className="space-y-4 mt-4">
        {renderSTARAnalysis(feedback)}

        {feedback.tips.length > 0 && (
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

        {feedback.learningPoints.length > 0 && (
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
      {/* Simplified Header */}
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
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'coach' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              )}

              <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.questionData && (
                    <div className="mb-3 p-3 bg-white/10 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {message.questionData.stage} • {message.questionData.difficulty}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{message.questionData.question}</p>
                    </div>
                  )}
                  
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <Clock className="h-3 w-3" />
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'coach' && message.feedback && (
                  <div className="mt-4 space-y-3">
                    {/* Immediate Coaching Tips */}
                    {message.feedback.tips && message.feedback.tips.length > 0 && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800 text-sm">Coach's Guidance</span>
                        </div>
                        <ul className="space-y-1 text-sm text-blue-900">
                          {message.feedback.tips.slice(0, 2).map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Quick STAR Score if available */}
                    {message.feedback.starAnalysis && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-700">Response Score</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">
                            {message.feedback.starAnalysis.overall}/10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator for conversation startup */}
          {startConversationMutation.isPending && messages.length === 0 && (
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

          {/* Loading indicator for response analysis */}
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
                    {/* Progress indicator */}
                    {messages.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Question {Math.ceil(messages.length / 2)} of {sessionDetails.totalQuestions || 15}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* End Session Early button - always visible after first question */}
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
                    
                    {/* Complete Session button for normal flow */}
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
            
            {/* Session Completion View */}
            {showCompletion && completionData && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    Session Complete! 🎉
                  </h3>
                  <p className="text-green-700 mb-4">
                    Great work! Here are the model answers for your reference:
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Model Answers & Key Insights
                  </h4>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {completionData.summary || "Your coaching session has been completed successfully. You demonstrated good interview skills and received valuable feedback throughout the session."}
                  </div>
                </div>
                
                <div className="flex justify-center mt-4">
                  <Button onClick={() => window.location.href = '/prepare'}>
                    Start New Session
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}