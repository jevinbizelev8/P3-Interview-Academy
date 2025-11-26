import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Lightbulb, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const REFLECTION_PROMPTS = [
  "What was the most challenging question in this interview, and how did you handle it?",
  "If you could redo one response, which would it be and why?",
  "What specific actions will you take to improve based on this simulation?",
  "How did your performance compare to your expectations? What surprised you?",
  "What did you learn about your interview style and communication approach?"
];

interface ReflectionJournalProps {
  simulationId: string;
  onClose?: () => void;
}

interface ReflectionJournal {
  id: string;
  userId: string;
  practiceSessionId: string;
  strengths: string;
  improvements: string;
  actionItems: string;
  overallFeeling: string;
  moodScore: number;
  createdAt: Date;
}

export default function ReflectionJournal({ simulationId, onClose }: ReflectionJournalProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [reflectionText, setReflectionText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
  const [userMessage, setUserMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing reflections for this simulation
  const { data: existingReflections = [] } = useQuery<ReflectionJournal[]>({
    queryKey: ['reflections', simulationId],
    queryFn: async () => {
      const response = await fetch('/api/practice/reflection-journals', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reflections');
      }

      const result = await response.json();
      return result.journals || [];
    },
    enabled: !!simulationId
  });

  // Submit reflection mutation
  const submitReflectionMutation = useMutation({
    mutationFn: async (data: { simulationId: string; reflections: string; insights?: string }) => {
      const response = await fetch('/api/practice/reflection-journal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit reflection');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAiResponse(data.journal);
      setReflectionText("");
      queryClient.invalidateQueries({ queryKey: ['reflections', simulationId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      toast({
        title: "Reflection submitted!",
        description: "Your reflection has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting reflection",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const sendChatMessage = async () => {
    if (!userMessage.trim()) return;

    const currentChatHistory = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(currentChatHistory);
    setUserMessage("");
    setIsProcessing(true);

    // Simulate AI response (would normally call API)
    setTimeout(() => {
      const aiMessage = {
        role: 'ai' as const,
        content: "That's a great insight! Consider focusing on providing more specific examples with measurable outcomes in your next practice session."
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Reflection Journal
          </CardTitle>
          <p className="text-sm text-gray-600">
            Deepen your learning by reflecting on your performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-purple-900">Reflection Prompt:</h3>
              <div className="flex gap-1">
                {REFLECTION_PROMPTS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPromptIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentPromptIndex
                        ? 'bg-purple-600 w-6'
                        : 'bg-purple-300 hover:bg-purple-400'
                    }`}
                    aria-label={`Prompt ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <Alert className="bg-white border-purple-200">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                {REFLECTION_PROMPTS[currentPromptIndex]}
              </AlertDescription>
            </Alert>
          </div>

          {!aiResponse ? (
            <div>
              <Textarea
                placeholder="Write your reflection here... Be honest and detailed about your experience."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="min-h-40 mb-3"
              />
              <Button
                onClick={() => submitReflectionMutation.mutate({
                  simulationId,
                  reflections: reflectionText
                })}
                disabled={!reflectionText.trim() || submitReflectionMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {submitReflectionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Your Reflection...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Reflection
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div>
              <div className="max-h-96 overflow-y-auto space-y-3 mb-4 bg-white p-4 rounded-lg border-2 border-purple-100">
                <AnimatePresence>
                  <motion.div
                    key="initial-user-reflection"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-4 py-2 max-w-[85%]">
                        <p className="text-sm">{reflectionText || aiResponse.strengths}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    key="initial-ai-response"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-900 mb-3">
                        Great reflection! Your insights show strong self-awareness and commitment to improvement.
                      </p>

                      <div className="mb-3">
                        <p className="text-xs font-semibold text-purple-700 mb-2">Explore Further:</p>
                        <ul className="space-y-1">
                          <li className="text-xs text-purple-600 flex items-start gap-2">
                            <span>•</span>
                            What specific metrics could you use to measure your improvement?
                          </li>
                          <li className="text-xs text-purple-600 flex items-start gap-2">
                            <span>•</span>
                            How can you apply these learnings to real interviews?
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {chatMessages.map((msg, index) => (
                    <motion.div
                      key={`chat-msg-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-4 py-2 max-w-[85%]">
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                          <p className="text-sm text-purple-900">{msg.content}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Continue the conversation with the AI coach..."
                  value={userMessage}
                  onChange={(e) => e.target.value.length <= 1000 && setUserMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  className="flex-1 min-h-20"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!userMessage.trim() || isProcessing}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 self-end"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
