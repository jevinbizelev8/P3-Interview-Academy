import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  Mic,
  Volume2,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';

interface Message {
  id: string;
  type: 'question' | 'response';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  evaluation?: {
    starScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    modelAnswer?: string;
    categories?: {
      relevance: number;
      structure: number;
      evidence: number;
      alignment: number;
      outcome: number;
    };
  };
  isProcessing?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  currentResponse: string;
  isLoading: boolean;
  isRecording: boolean;
  voiceEnabled: boolean;
  onResponseChange: (response: string) => void;
  onSubmitResponse: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayMessage: (content: string) => void;
  className?: string;
}

export default function ChatInterface({
  messages,
  currentResponse,
  isLoading,
  isRecording,
  voiceEnabled,
  onResponseChange,
  onSubmitResponse,
  onStartRecording,
  onStopRecording,
  onPlayMessage,
  className = ''
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expandedEvaluations, setExpandedEvaluations] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentResponse]);

  const toggleEvaluationExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedEvaluations);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedEvaluations(newExpanded);
  };

  const getStarColor = (score: number) => {
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCategoryScore = (score: number) => {
    if (score >= 4) return { color: 'bg-green-500', label: 'Excellent' };
    if (score >= 3) return { color: 'bg-yellow-500', label: 'Good' };
    if (score >= 2) return { color: 'bg-orange-500', label: 'Fair' };
    return { color: 'bg-red-500', label: 'Needs Work' };
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentResponse.trim()) {
        onSubmitResponse();
      }
    }
  };

  return (
    <div className={className}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              AI Interview Practice
            </div>
            <Badge variant="secondary" className="text-xs">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </Badge>
          </CardTitle>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
            <div className="space-y-6 pb-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Ready to start your interview practice</p>
                  <p className="text-sm">Your AI interviewer will generate personalized questions</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    {/* Message Bubble */}
                    <div className={`flex ${message.type === 'response' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg p-4 ${
                        message.type === 'question'
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-green-50 border border-green-200'
                      }`}>
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              message.type === 'question' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {message.type === 'question' ? (
                                <Bot className="w-4 h-4 text-white" />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="font-medium text-sm">
                              {message.type === 'question' ? 'AI Interviewer' : 'You'}
                            </span>
                            {message.isAudio && (
                              <Badge variant="outline" className="text-xs">
                                <Mic className="w-3 h-3 mr-1" />
                                Voice
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {message.type === 'question' && voiceEnabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onPlayMessage(message.content)}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className="text-gray-800 leading-relaxed">
                          {message.content}
                        </div>

                        {/* Processing Indicator */}
                        {message.isProcessing && (
                          <div className="mt-3 flex items-center space-x-2 text-blue-600">
                            <Zap className="w-4 h-4 animate-pulse" />
                            <span className="text-sm">AI is evaluating your response...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STAR Method Evaluation */}
                    {message.evaluation && (
                      <div className="ml-8 mr-0">
                        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
                          <CardContent className="p-4">
                            {/* Score Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Star className={`w-5 h-5 ${getStarColor(message.evaluation.starScore)}`} />
                                <span className="font-semibold">STAR Method Evaluation</span>
                              </div>
                              <Badge variant="outline" className="text-lg px-3 py-1">
                                {message.evaluation.starScore}/5
                              </Badge>
                            </div>

                            {/* Overall Feedback */}
                            <p className="text-gray-700 mb-4 leading-relaxed">
                              {message.evaluation.feedback}
                            </p>

                            {/* Category Breakdown */}
                            {message.evaluation.categories && (
                              <div className="mb-4">
                                <h4 className="font-medium text-sm mb-3">Detailed Scoring:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {Object.entries(message.evaluation.categories).map(([category, score]) => {
                                    const { color, label } = getCategoryScore(score);
                                    return (
                                      <div key={category} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{category}:</span>
                                        <div className="flex items-center space-x-2">
                                          <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full ${color} mr-1`} />
                                            <span className="text-xs text-gray-600">{label}</span>
                                          </div>
                                          <span className="text-sm font-medium">{score}/5</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Collapsible Details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEvaluationExpanded(message.id)}
                              className="w-full justify-center"
                            >
                              {expandedEvaluations.has(message.id) ? 'Show Less' : 'Show Details'}
                            </Button>

                            {expandedEvaluations.has(message.id) && (
                              <div className="mt-4 space-y-4">
                                {/* Strengths */}
                                {message.evaluation.strengths.length > 0 && (
                                  <div>
                                    <div className="flex items-center space-x-1 mb-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      <span className="font-medium text-green-800">Strengths</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {message.evaluation.strengths.map((strength, i) => (
                                        <li key={i} className="text-sm text-green-700 flex items-start">
                                          <TrendingUp className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                                          {strength}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Improvements */}
                                {message.evaluation.improvements.length > 0 && (
                                  <div>
                                    <div className="flex items-center space-x-1 mb-2">
                                      <AlertCircle className="w-4 h-4 text-amber-600" />
                                      <span className="font-medium text-amber-800">Areas for Improvement</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {message.evaluation.improvements.map((improvement, i) => (
                                        <li key={i} className="text-sm text-amber-700 flex items-start">
                                          <TrendingDown className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                                          {improvement}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Model Answer */}
                                {message.evaluation.modelAnswer && (
                                  <div className="pt-3 border-t border-gray-200">
                                    <h4 className="font-medium text-sm mb-2 text-blue-800">
                                      💡 Example Strong Response:
                                    </h4>
                                    <p className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-l-blue-300">
                                      {message.evaluation.modelAnswer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center space-x-3 text-blue-600">
                    <Zap className="w-5 h-5 animate-pulse" />
                    <span className="text-sm">AI is processing your response...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Input Area */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Voice Recording Button */}
              {voiceEnabled && (
                <div className="flex justify-center">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    onMouseDown={onStartRecording}
                    onMouseUp={onStopRecording}
                    onMouseLeave={onStopRecording}
                    disabled={isLoading}
                    className="px-8 py-3"
                  >
                    <Mic className={`w-5 h-5 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording ? 'Release to Stop Recording' : 'Hold to Record Voice Response'}
                  </Button>
                </div>
              )}

              {voiceEnabled && <Separator className="my-4" />}

              {/* Text Input */}
              <div className="space-y-3">
                <Textarea
                  ref={textareaRef}
                  value={currentResponse}
                  onChange={(e) => onResponseChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response here... (Press Enter to send, Shift+Enter for new line)"
                  className="min-h-[80px] max-h-[200px] resize-none"
                  disabled={isLoading}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{currentResponse.length} characters</span>
                    {voiceEnabled && (
                      <div className="flex items-center space-x-1">
                        <Volume2 className="w-3 h-3" />
                        <span>Voice enabled</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={onSubmitResponse}
                    disabled={!currentResponse.trim() || isLoading}
                    className="min-w-[120px]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? 'Sending...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}