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
  ChevronRight
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { FeedbackCard } from './FeedbackCard';
import { STARScoreBar } from './STARScoreBar';
import { QuestionCard } from './QuestionCard';

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


  // Get current question and latest feedback
  const currentQuestionMsg = messages
    .filter(m => m.messageType === 'coach' && m.coachingType === 'question')
    .pop();
  
  const latestFeedbackMsg = messages
    .filter(m => m.messageType === 'coach' && m.coachingType === 'feedback')
    .pop();

  const currentQuestionNumber = currentQuestionMsg?.questionNumber || 1;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Interview Coach</h1>
              <p className="text-xs text-gray-600">
                {sessionDetails.jobPosition} • Question {currentQuestionNumber}/{sessionDetails.totalQuestions || 15}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionDetails.primaryIndustry && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                {sessionDetails.primaryIndustry}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReferencePanel(!showReferencePanel)}
              className="lg:hidden"
            >
              {showReferencePanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${
          showReferencePanel ? 'lg:mr-96' : ''
        } transition-all duration-300`}>
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages && messages.map((message) => {
                // Skip feedback messages in chat - they're shown in reference panel
                if (message.messageType === 'coach' && message.coachingType === 'feedback') {
                  return null;
                }

                const cleanedContent = cleanMessageContent(message.content);

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.messageType === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.messageType === 'coach' && (
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}

                    <div className={`max-w-lg ${
                      message.messageType === 'user' ? 'order-first' : ''
                    }`}>
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          message.messageType === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div 
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: cleanedContent }}
                        />
                        
                        <div className={`flex items-center gap-2 mt-2 text-xs ${
                          message.messageType === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {message.messageType === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {startConversationMutation.isPending && (!messages || messages.length === 0) && (
                <div className="flex justify-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">
                        Preparing your interview session...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Analyzing your response...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            {!showCompletion && (
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="flex gap-3">
                  <Textarea
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your STAR response here... (Press Enter to send)"
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
                  <p className="text-xs text-gray-500">
                    Use STAR method • Enter to send • Shift+Enter for new line
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {messages.length > 4 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCompleteSession}
                        disabled={isCompleting}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        {isCompleting ? "Completing..." : "Complete Session"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Reference Panel - Right Side */}
        {showReferencePanel && (
          <div className="hidden lg:flex lg:w-96 lg:fixed lg:right-0 lg:top-16 lg:bottom-0 bg-white border-l border-gray-200 overflow-hidden">
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Session Reference</h3>
              </div>
              
              <ScrollArea className="flex-1 p-4 space-y-4">
                {/* Current Question Card */}
                {currentQuestionMsg && (
                  <QuestionCard
                    question={currentQuestionMsg.content}
                    questionNumber={currentQuestionNumber}
                    totalQuestions={sessionDetails.totalQuestions}
                    sessionDetails={sessionDetails}
                    isActive={true}
                  />
                )}

                {/* STAR Scores */}
                {latestFeedbackMsg?.feedback?.starScores && (
                  <STARScoreBar 
                    scores={latestFeedbackMsg.feedback.starScores}
                    questionNumber={latestFeedbackMsg.questionNumber}
                  />
                )}

                {/* Latest Feedback */}
                {latestFeedbackMsg?.feedback && (
                  <FeedbackCard 
                    feedback={latestFeedbackMsg.feedback}
                    questionNumber={latestFeedbackMsg.questionNumber}
                  />
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}