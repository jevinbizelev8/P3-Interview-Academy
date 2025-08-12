import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Keyboard, Mic } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import VoiceRecorder from "@/components/VoiceRecorder";
import type { Response } from "@shared/schema";

interface ResponseInterfaceProps {
  sessionId: string;
  questionId: string;
  currentResponse?: Response;
}

export default function ResponseInterface({ sessionId, questionId, currentResponse }: ResponseInterfaceProps) {
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [responseText, setResponseText] = useState(currentResponse?.responseText || '');
  const queryClient = useQueryClient();

  // Reset state when question changes
  useEffect(() => {
    setResponseText(currentResponse?.responseText || '');
  }, [questionId, currentResponse?.responseText]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (responseText && responseText !== currentResponse?.responseText) {
        saveResponse(responseText);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [responseText, currentResponse?.responseText]);

  const saveResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      if (currentResponse) {
        const response = await apiRequest('PATCH', `/api/responses/${currentResponse.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/responses', {
          ...data,
          sessionId,
          questionId,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/responses/session', sessionId] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveResponse = (text: string) => {
    saveResponseMutation.mutate({
      responseText: text,
      inputMode,
    });
  };

  const handleResponseChange = (text: string) => {
    setResponseText(text);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Your Response</h4>
        <div className="flex items-center space-x-2">
          <Button
            variant={inputMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('text')}
          >
            <Keyboard className="w-4 h-4 mr-1" />
            Text
          </Button>
          <Button
            variant={inputMode === 'voice' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('voice')}
          >
            <Mic className="w-4 h-4 mr-1" />
            Voice
          </Button>
        </div>
      </div>
      
      {inputMode === 'text' ? (
        <Textarea
          className="w-full h-32 resize-none"
          placeholder="Start typing your response here or switch to voice mode..."
          value={responseText}
          onChange={(e) => handleResponseChange(e.target.value)}
        />
      ) : (
        <VoiceRecorder
          value={responseText}
          onChange={handleResponseChange}
          placeholder="Start speaking or click the microphone button to begin recording..."
          className="w-full"
        />
      )}
    </div>
  );
}
