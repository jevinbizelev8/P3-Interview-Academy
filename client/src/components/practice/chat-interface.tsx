import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, Save, CheckCircle, AlertCircle } from "lucide-react";
import type { InterviewSessionWithScenario, InterviewMessage } from "@shared/schema";

interface ChatInterfaceProps {
  session: InterviewSessionWithScenario;
  onSendResponse: (content: string) => void;
  isLoading: boolean;
  autoSaveStatus: 'saving' | 'saved';
}

export default function ChatInterface({ 
  session, 
  onSendResponse, 
  isLoading,
  autoSaveStatus 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendResponse(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    // TODO: Implement voice input functionality
    console.log("Voice input not yet implemented");
  };

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFeedbackColor = (feedback?: string | null) => {
    if (!feedback) return '';
    
    const lowerFeedback = feedback.toLowerCase();
    if (lowerFeedback.includes('excellent') || lowerFeedback.includes('good') || lowerFeedback.includes('strong')) {
      return 'text-green-600';
    } else if (lowerFeedback.includes('consider') || lowerFeedback.includes('could')) {
      return 'text-yellow-600';
    }
    return 'text-blue-600';
  };

  return (
    <Card className="h-96 flex flex-col">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-gray-600">
              {session.scenario.interviewerName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{session.scenario.interviewerName}</p>
            <div className="text-sm text-green-600 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {session.messages.map((msg, index) => (
          <div key={msg.id || index}>
            {msg.messageType === 'ai' ? (
              // AI Message
              <div className="flex items-start">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {session.scenario.interviewerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-md">
                  <p className="text-gray-900">{msg.content}</p>
                  <span className="text-xs text-gray-500 mt-2 block">
                    {msg.timestamp ? formatTime(msg.timestamp) : ''}
                  </span>
                </div>
              </div>
            ) : (
              // User Message
              <div className="flex items-start justify-end">
                <div className="mr-3 mt-1 flex flex-col items-end">
                  {msg.feedback && (
                    <div className="mb-2 text-right">
                      <Badge variant="outline" className={`text-xs ${getFeedbackColor(msg.feedback)}`}>
                        {msg.feedback.length > 50 ? `${msg.feedback.substring(0, 50)}...` : msg.feedback}
                      </Badge>
                    </div>
                  )}
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="bg-primary rounded-lg px-4 py-3 max-w-md text-primary-foreground">
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-80 mt-2 block">
                    {msg.timestamp ? formatTime(msg.timestamp) : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 mt-1">
              <span className="text-xs font-medium text-gray-600">
                {session.scenario.interviewerName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex space-x-3">
          <Textarea
            ref={textareaRef}
            placeholder="Type your response here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
            <Button
              onClick={handleVoiceInput}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Mic className="w-4 h-4 mr-1" />
              Voice
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span className="flex items-center">
            {autoSaveStatus === 'saving' ? (
              <>
                <Save className="w-3 h-3 mr-1 animate-pulse" />
                Auto-saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                Auto-saved
              </>
            )}
          </span>
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="text-gray-400">
              Powered by{" "}
              <a 
                href="https://sea-lion.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                SeaLion AI
              </a>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
