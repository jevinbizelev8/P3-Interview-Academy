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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { FeedbackCard } from './FeedbackCard';
import { STARScoreBar } from './STARScoreBar';

interface CoachingMessage {
  id: string;
  sessionId: string;
  messageType: 'coach' | 'user';
  content: string;
  coachingType?: 'introduction' | 'question' | 'feedback' | 'summary' | 'response';
  questionNumber?: number | null;
  feedback?: {
    improvementPoints?: string[];
    modelAnswer?: string;
    starScores?: {
      situation: number;
      task: number;
      action: number;
      result: number;
      overall: number;
    };
  };
  aiMetadata?: {
    type?: string;
    translation?: string;
    questionNumber?: number;
    generated?: boolean;
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
    .replace(/\*\*Question:\*\*/g, '') // Remove question prefix
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n/g, '<br>')
    .replace(/^Question \d+:\s*/gm, '') // Remove question numbering
    .trim();
};

export function CoachingChat({ sessionId, sessionDetails }: CoachingChatProps) {
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [showReferencePanel, setShowReferencePanel] = useState(true);
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

  const restartSessionMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/restart`);
      if (!result.ok) throw new Error('Failed to restart session');
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-messages', sessionId] });
      setCurrentResponse('');
      setShowCompletion(false);
      setCompletionData(null);
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

  const handleRestartSession = () => {
    if (confirm('Are you sure you want to restart this coaching session? All progress will be lost.')) {
      restartSessionMutation.mutate();
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


  // Get current question and latest feedback
  const currentQuestionMsg = messages
    .filter(m => m.messageType === 'coach' && m.coachingType === 'question')
    .pop();
  
  const latestFeedbackMsg = messages
    .filter(m => m.messageType === 'coach' && m.coachingType === 'feedback')
    .pop();

  const currentQuestionNumber = currentQuestionMsg?.questionNumber || 1;

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
                {sessionDetails.jobPosition} • Question {currentQuestionNumber}/{sessionDetails.totalQuestions || 15}
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
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900 text-sm">Your Response Analysis</span>
                        </div>
                        
                        {/* Compact STAR Scores */}
                        {message.feedback.starScores && (
                          <div className="mb-4">
                            <STARScoreBar scores={message.feedback.starScores} questionNumber={message.questionNumber} />
                          </div>
                        )}
                        
                        {/* Feedback Card */}
                        <FeedbackCard feedback={message.feedback} questionNumber={message.questionNumber} />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-4 rounded-lg ${
                        message.messageType === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {/* Primary content (English) */}
                      <div 
                        className="whitespace-pre-wrap prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: cleanedContent }}
                      />
                      
                      {/* Translation if available and this is a coach message */}
                      {message.messageType === 'coach' && message.aiMetadata?.translation && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-xs font-medium text-blue-600">🌐 Bahasa Malaysia</span>
                          </div>
                          <div 
                            className="text-sm text-gray-700 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: cleanMessageContent(message.aiMetadata.translation) }}
                          />
                        </div>
                      )}
                      
                      <div className={`flex items-center gap-2 mt-2 text-xs ${
                        message.messageType === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
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
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
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
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
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
                    placeholder="Type your response here using the STAR method... (Press Enter to send)"
                    className="flex-1 min-h-[80px] resize-none"
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
                      Press Enter to send • Shift+Enter for new line • Use STAR method
                    </p>
                    {messages.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Question {Math.ceil(messages.filter(m => m.messageType === 'coach' && m.coachingType === 'question').length)} of {sessionDetails.totalQuestions || 15}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestartSession}
                        disabled={restartSessionMutation.isPending}
                        className="bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {restartSessionMutation.isPending ? "Restarting..." : "Restart Session"}
                      </Button>
                    )}
                    {messages.length > 4 && (
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