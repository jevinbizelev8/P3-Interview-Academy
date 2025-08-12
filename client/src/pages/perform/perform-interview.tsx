import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff, User, Bot, Award, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InterviewSessionWithScenario, InterviewMessage } from "@shared/schema";

interface ChatMessage {
  id: string;
  messageType: "ai" | "user";
  content: string;
  timestamp: Date;
  questionNumber?: number;
}

export default function PerformInterview() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch session data
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: [`/api/perform/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/perform/sessions/${sessionId}/messages`],
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/perform/sessions/${sessionId}/messages`, { 
        content,
        messageType: "user",
        questionNumber: currentQuestionNumber 
      });
      return await response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/perform/sessions/${sessionId}/messages`] });
      // Trigger AI response
      generateAiResponseMutation.mutate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate AI response mutation
  const generateAiResponseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/perform/sessions/${sessionId}/ai-response`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/perform/sessions/${sessionId}/messages`] });
      if (data.isCompleted) {
        setIsCompleted(true);
        toast({
          title: "Interview Completed!",
          description: "Your AI evaluation is being generated. You'll be redirected shortly.",
        });
        // Redirect to evaluation after a short delay
        setTimeout(() => {
          window.location.href = `/perform/evaluation/${sessionId}`;
        }, 2000);
      } else {
        setCurrentQuestionNumber(prev => prev + 1);
      }
    },
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/perform/sessions/${sessionId}/complete`);
      return await response.json();
    },
    onSuccess: () => {
      setIsCompleted(true);
      toast({
        title: "Interview Completed!",
        description: "Generating your comprehensive AI evaluation...",
      });
      setTimeout(() => {
        window.location.href = `/perform/evaluation/${sessionId}`;
      }, 2000);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  if (sessionLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your interview session...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                AI Interview Simulation in Progress
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  {session?.userJobPosition} at {session?.userCompanyName}
                </span>
                <Badge variant="outline" className="bg-white">
                  Question {currentQuestionNumber}
                </Badge>
                {session?.interviewLanguage && (
                  <Badge variant="outline" className="bg-white">
                    {session.interviewLanguage.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <Button
                variant="outline"
                onClick={() => completeInterviewMutation.mutate()}
                disabled={completeInterviewMutation.isPending || isCompleted}
                className="mb-2"
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  "Complete Interview"
                )}
              </Button>
              <div className="text-sm text-gray-500">
                <Clock className="w-4 h-4 inline mr-1" />
                {formatTime(Math.floor((Date.now() - new Date(session?.startedAt || Date.now()).getTime()) / 1000))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Interview Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 pb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                      <p className="text-lg font-medium mb-2">Welcome to your AI Interview!</p>
                      <p>Your AI interviewer will begin shortly with questions tailored to your role and company.</p>
                    </div>
                  )}
                  
                  {messages.map((msg: InterviewMessage) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.messageType === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          msg.messageType === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {msg.messageType === "user" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-xs opacity-75">
                            {msg.messageType === "user" ? "You" : "AI Interviewer"}
                          </span>
                          {msg.questionNumber && (
                            <Badge variant="outline" className="text-xs">
                              Q{msg.questionNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(sendMessageMutation.isPending || generateAiResponseMutation.isPending) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your response here..."
                    disabled={sendMessageMutation.isPending || isCompleted}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsRecording(!isRecording)}
                    disabled={isCompleted}
                    className={isRecording ? "bg-red-100 border-red-300" : ""}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4 text-red-600" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending || isCompleted}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Position:</span>
                <p>{session?.userJobPosition}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Company:</span>
                <p>{session?.userCompanyName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Language:</span>
                <p>{session?.interviewLanguage?.toUpperCase()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• Use the STAR method for behavioral questions</p>
              <p>• Be specific with examples and metrics</p>
              <p>• Ask clarifying questions when needed</p>
              <p>• The AI will provide real-time coaching</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}