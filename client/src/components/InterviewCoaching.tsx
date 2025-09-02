import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Clock, 
  ChevronDown,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CoachingSession {
  id: string;
  jobPosition: string;
  companyName: string;
  interviewStage: string;
  experienceLevel: string;
  totalQuestions: number;
  timeAllocation: number;
  currentQuestion: number;
  status: string;
}

interface CoachingMessage {
  id: string;
  sessionId: string;
  messageType: 'coach' | 'user';
  content: string;
  coachingType?: 'introduction' | 'question' | 'feedback' | 'summary' | 'response';
  questionNumber?: number | null;
  timestamp: string;
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
}

interface InterviewCoachingProps {
  sessionId: string;
}

export function InterviewCoaching({ sessionId }: InterviewCoachingProps) {
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showDetails, setShowDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Language options for ASEAN support
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ms', name: 'Bahasa Malaysia', flag: '🇲🇾' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
    { code: 'my', name: 'မြန်မာ', flag: '🇲🇲' },
    { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭' },
    { code: 'lo', name: 'ລາວ', flag: '🇱🇦' },
    { code: 'zh-sg', name: '中文 (新加坡)', flag: '🇸🇬' }
  ];

  // Fetch session details
  const { data: sessionDetails } = useQuery({
    queryKey: ['coaching-session', sessionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/coaching/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      const result = await response.json();
      return result.data as CoachingSession;
    }
  });

  // Fetch messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['coaching-messages', sessionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/coaching/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return result.data as CoachingMessage[];
    },
    refetchInterval: 2000 // Auto-refresh every 2 seconds
  });

  // Start conversation with ASEAN language support
  const startConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/start`, {
        language: selectedLanguage,
        useSeaLion: selectedLanguage !== 'en' // Use SeaLion for ASEAN languages
      });
      if (!response.ok) throw new Error('Failed to start conversation');
      return response.json();
    },
    onSuccess: () => {
      refetchMessages();
    }
  });

  // Send response with ASEAN language support
  const sendResponseMutation = useMutation({
    mutationFn: async (response: string) => {
      const result = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/respond`, {
        response,
        language: selectedLanguage,
        useSeaLion: selectedLanguage !== 'en' // Use SeaLion for ASEAN languages
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

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Map language codes to speech recognition locales
    const speechLocales: { [key: string]: string } = {
      'en': 'en-US',
      'ms': 'ms-MY', 
      'id': 'id-ID',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'fil': 'fil-PH',
      'my': 'my-MM',
      'km': 'km-KH',
      'lo': 'lo-LA',
      'zh-sg': 'zh-CN'
    };
    
    recognition.lang = speechLocales[selectedLanguage] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCurrentResponse(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
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

  if (!sessionDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentQuestionNumber = messages?.filter(m => m.messageType === 'coach' && m.coachingType === 'question').length || 1;

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Interview Academy</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <Badge variant="outline" className="bg-blue-50">Prepare</Badge>
                  <span>Practice</span>
                  <span>Perform</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {sessionDetails.jobPosition} at {sessionDetails.companyName}
                </h2>
                <p className="text-sm text-gray-600 capitalize">
                  {sessionDetails.interviewStage.replace('-', ' ')} • {sessionDetails.experienceLevel} Level
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Welcome to your interview coaching session for the {sessionDetails.jobPosition} role at {sessionDetails.companyName}. 
                Remember to use the STAR method—Situation, Task, Action, Result—to structure your responses effectively. 
                You'll have {sessionDetails.timeAllocation} minutes to tackle {sessionDetails.totalQuestions} questions, 
                so stay focused and confident as you showcase your skills.
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {sessionDetails.timeAllocation}min
                </span>
                <span>{sessionDetails.totalQuestions} questions</span>
                <span>STAR Method</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages && messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.messageType === 'coach' && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        
                        <div className={`max-w-md ${message.messageType === 'user' ? 'order-first' : ''}`}>
                          {message.messageType === 'coach' && message.coachingType === 'feedback' && message.feedback ? (
                            <FeedbackCard feedback={message.feedback} />
                          ) : (
                            <div className={`p-3 rounded-lg ${
                              message.messageType === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white border border-gray-200'
                            }`}>
                              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                              <div className={`flex items-center gap-1 mt-2 text-xs ${
                                message.messageType === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <Clock className="h-3 w-3" />
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          )}
                        </div>

                        {message.messageType === 'user' && (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}

                    {(isLoading || startConversationMutation.isPending) && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-200 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600">
                              {startConversationMutation.isPending ? 'Preparing your session...' : 'Analyzing your response...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="space-y-3">
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={selectedLanguage === 'en' ? 
                        "Type your response here... Use STAR method for best results." :
                        selectedLanguage === 'ms' ? "Taip jawapan anda di sini... Gunakan kaedah STAR untuk hasil terbaik." :
                        selectedLanguage === 'id' ? "Ketik respons Anda di sini... Gunakan metode STAR untuk hasil terbaik." :
                        selectedLanguage === 'th' ? "พิมพ์คำตอบของคุณที่นี่... ใช้วิธี STAR เพื่อผลลัพธ์ที่ดีที่สุด" :
                        selectedLanguage === 'vi' ? "Nhập phản hồi của bạn ở đây... Sử dụng phương pháp STAR để có kết quả tốt nhất." :
                        selectedLanguage === 'fil' ? "I-type ang inyong sagot dito... Gamitin ang STAR method para sa pinakamahusay na resulta." :
                        selectedLanguage === 'zh-sg' ? "在此输入您的回答... 使用STAR方法以获得最佳结果。" :
                        "Type your response here... Use STAR method for best results."
                      }
                      className="min-h-[80px] resize-none"
                      disabled={isLoading}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleRecording}
                          className={isRecording ? 'bg-red-50 text-red-600 border-red-200' : ''}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          {isRecording ? 'Stop' : 'Voice'}
                        </Button>
                        <span className="text-xs text-gray-500">
                          Question {currentQuestionNumber} of {sessionDetails.totalQuestions}
                        </span>
                      </div>
                      <Button
                        onClick={handleSendResponse}
                        disabled={!currentResponse.trim() || isLoading}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Session Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Questions</span>
                    <span>{currentQuestionNumber}/{sessionDetails.totalQuestions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(currentQuestionNumber / sessionDetails.totalQuestions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">STAR Method Guide</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-600">S</span>
                    <span>Situation - Set the context</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-green-600">T</span>
                    <span>Task - Your responsibility</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-orange-600">A</span>
                    <span>Action - What you did</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-purple-600">R</span>
                    <span>Result - The outcome</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feedback Card Component
function FeedbackCard({ feedback }: { feedback: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-blue-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 text-sm">AI Preceptor - Interview Coach</span>
            <span className="bg-blue-800 text-white px-2 py-0.5 rounded text-xs font-medium">Professional</span>
          </div>
          <ChevronDown className="h-4 w-4 text-blue-600" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* STAR Scores */}
        {feedback.starScores && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600">STAR:</span>
            <div className="flex items-center gap-2">
              {Object.entries(feedback.starScores).filter(([key]) => key !== 'overall').map(([key, score]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-500 uppercase">{key[0]}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div
                        key={dot}
                        className={`w-2 h-2 rounded-full ${
                          dot <= (score as number) ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback.improvementPoints && feedback.improvementPoints.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 text-sm mb-2">Feedback</h4>
            <div className="text-sm text-gray-700 space-y-1">
              {feedback.improvementPoints.map((point: string, index: number) => (
                <div key={index}>{point}</div>
              ))}
            </div>
          </div>
        )}

        {/* Model Answer */}
        {feedback.modelAnswer && (
          <div>
            <h4 className="font-medium text-gray-900 text-sm mb-2">Model Answer</h4>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
              {feedback.modelAnswer}
            </div>
          </div>
        )}

        {/* Learning Tip */}
        <div>
          <h4 className="font-medium text-gray-900 text-sm mb-2">Learning Tip</h4>
          <div className="text-sm text-gray-700">
            Structure responses using STAR method. Include specific metrics and focus on your role in achieving business outcomes.
          </div>
        </div>

        {/* Next Interview Question */}
        <div>
          <h4 className="font-medium text-gray-900 text-sm mb-2">Next Interview Question</h4>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-sm text-gray-600 italic">
              Ready for the next question? Continue the conversation above.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}