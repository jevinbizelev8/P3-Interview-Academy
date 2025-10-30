
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Lightbulb, Send, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { awardXP, updateStreak, XP_VALUES } from "../utils/scoring";

const REFLECTION_PROMPTS = [
  "What was the most challenging question in this interview, and how did you handle it?",
  "If you could redo one response, which would it be and why?",
  "What specific actions will you take to improve based on this simulation?",
  "How did your performance compare to your expectations? What surprised you?",
  "What did you learn about your interview style and communication approach?"
];

export default function ReflectionJournal({ simulationId, onClose }) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [reflectionText, setReflectionText] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const queryClient = useQueryClient();

  const { data: existingReflections = [] } = useQuery({
    queryKey: ['reflections', simulationId],
    queryFn: async () => {
      const response = await fetch(`/api/perform/reflections?practiceSessionId=${simulationId}`);
      if (!response.ok) throw new Error('Failed to fetch reflections');
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!simulationId
  });

  const submitReflectionMutation = useMutation({
    mutationFn: async (data) => {
      // First, generate AI analysis
      const aiResponse = await fetch('/api/prepare/modules/screening-interview/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "Reflect on your interview performance",
          userAnswer: data.reflection_text,
          weakExample: "I did okay but could have been better.",
          strongExample: "I struggled with the technical questions but excelled in behavioral scenarios. I need to practice more coding problems and work on my communication skills."
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to generate AI analysis');
      }

      const aiResult = await aiResponse.json();
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }

      // Create the reflection with AI data
      const reflectionResponse = await fetch('/api/perform/reflections/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practiceSessionId: simulationId,
          reflectionText: data.reflection_text,
          aiSummary: aiResult.data.strengths.join(' ') + ' ' + aiResult.data.improvements.join(' '),
          aiFollowUpQuestions: aiResult.data.improvements,
          suggestedResources: [
            {
              title: "Practice More Interview Simulations",
              description: "Continue practicing with AI-powered interview simulations to build confidence.",
              link: "/practice"
            },
            {
              title: "Review STAR Method",
              description: "Study the STAR method for structuring behavioral interview responses.",
              link: "/prepare"
            }
          ]
        }),
      });

      if (!reflectionResponse.ok) {
        throw new Error('Failed to create reflection');
      }

      const reflectionResult = await reflectionResponse.json();
      if (!reflectionResult.success) {
        throw new Error(reflectionResult.error || 'Failed to create reflection');
      }

      const reflection = reflectionResult.data;

      // Award XP for reflection
      try {
        await awardXP('current-user', XP_VALUES.REFLECTION_JOURNAL, "Submitted reflection journal", reflection.id);
        await updateStreak('current-user');
      } catch (xpError) {
        console.warn("XP/Streak update failed:", xpError);
      }

      return {
        ...reflection,
        reflection_text: data.reflection_text,
        ai_summary: aiResult.data.strengths.join(' ') + ' ' + aiResult.data.improvements.join(' '),
        ai_follow_up_questions: aiResult.data.improvements,
        suggested_resources: [
          {
            title: "Practice More Interview Simulations",
            description: "Continue practicing with AI-powered interview simulations to build confidence.",
            link: "/practice"
          },
          {
            title: "Review STAR Method",
            description: "Study the STAR method for structuring behavioral interview responses.",
            link: "/prepare"
          }
        ]
      };
    },
    onSuccess: (data) => {
      setAiResponse(data);
      setReflectionText("");
      queryClient.invalidateQueries({ queryKey: ['reflections', simulationId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error) => {
      console.error("Error submitting reflection:", error);
    }
  });

  const sendChatMessage = async () => {
    if (!userMessage.trim()) return;

    let fullConversationContext = [];
    if (aiResponse) {
      fullConversationContext.push({ role: "user", content: aiResponse.reflection_text });
      fullConversationContext.push({ role: "ai", content: aiResponse.ai_summary });
    }
    const currentChatHistory = [...chatMessages, { role: "user", content: userMessage }];
    fullConversationContext = [...fullConversationContext, ...currentChatHistory];

    setChatMessages(currentChatHistory);
    setUserMessage("");
    setIsProcessing(true);

    try {
      const conversationPrompt = fullConversationContext
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI Coach'}: ${msg.content}`)
        .join('\n');

      // Use the same coaching API for chat
      const response = await fetch('/api/prepare/modules/screening-interview/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `AI Coach Conversation: ${conversationPrompt}`,
          userAnswer: userMessage,
          weakExample: "I need help with this.",
          strongExample: "I'm looking for specific advice on how to improve my interview performance."
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI coaching response');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'AI coaching failed');
      }

      const aiMessage = result.data.strengths.join(' ') + ' ' + result.data.improvements.join(' ') + ' Consider practicing more simulations to build confidence.';

      setChatMessages(prevMessages => [...prevMessages, { role: "ai", content: aiMessage }]);
    } catch (error) {
      console.error("Error in chat:", error);
      setChatMessages(currentChatHistory);
    }
    setIsProcessing(false);
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
                onClick={() => submitReflectionMutation.mutate({ reflection_text: reflectionText })}
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
                        <p className="text-sm">{aiResponse.reflection_text}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    key="initial-ai-response"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-900 mb-3">{aiResponse.ai_summary}</p>
                      
                      {aiResponse.ai_follow_up_questions && aiResponse.ai_follow_up_questions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-purple-700 mb-2">Explore Further:</p>
                          <ul className="space-y-1">
                            {aiResponse.ai_follow_up_questions.map((q, i) => (
                              <li key={i} className="text-xs text-purple-600 flex items-start gap-2">
                                <span>•</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {aiResponse.suggested_resources && aiResponse.suggested_resources.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-purple-700 mb-2">Recommended Resources:</p>
                          <div className="space-y-2">
                            {aiResponse.suggested_resources.map((resource, i) => (
                              <div key={i} className="bg-white p-2 rounded border border-purple-200">
                                <p className="text-xs font-semibold text-gray-900">{resource.title}</p>
                                <p className="text-xs text-gray-600">{resource.description}</p>
                                {resource.link && (
                                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                    Learn more
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                          <p className="text-sm text-purple-900 mb-3">{msg.content}</p>
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
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
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
