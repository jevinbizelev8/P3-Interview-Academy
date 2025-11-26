import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, Trophy, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

interface Question {
  id: number;
  question: string;
  options: QuestionOption[];
  tips: string[];
}

interface SelectedAnswer {
  optionId: string;
  correct: boolean;
}

interface GameData {
  selectedAnswers: Record<number, SelectedAnswer>;
  userAnswers: Record<number, string>;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface HRQuestionsGameProps {
  moduleId?: string;
  onComplete?: (score: number, data: GameData) => void;
}

export default function HRQuestionsGame({ moduleId, onComplete }: HRQuestionsGameProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, SelectedAnswer>>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const questions: Question[] = [
    {
      id: 1,
      question: "Tell me about yourself",
      options: [
        {
          id: 'A',
          text: "Well, I was born in Singapore, went to university, and worked at a few places...",
          correct: false,
          feedback: "❌ Too vague and personal. Focus on your professional identity, not your life story."
        },
        {
          id: 'B',
          text: "I'm a software engineer with 5 years of experience building scalable web applications. Currently at TechCorp, I lead the platform team where I recently migrated our monolith to microservices, improving reliability by 40%. I specialise in React and Node.js, and I'm excited about this role because it aligns with my passion for building products that impact millions of users.",
          correct: true,
          feedback: "✅ Perfect! Uses a WHO-WHAT-WHY structure with specific details and metrics."
        }
      ],
      tips: [
        "Start with your current role and experience",
        "Highlight 1-2 key achievements with metrics",
        "Connect your experience to why you're interested in this role",
        "Keep it under 90 seconds"
      ]
    },
    {
      id: 2,
      question: "Why are you leaving your current job?",
      options: [
        {
          id: 'A',
          text: "My boss is terrible and micromanages everything. The company has no direction.",
          correct: false,
          feedback: "❌ Never badmouth a current or former employer. Always stay positive."
        },
        {
          id: 'B',
          text: "I've learnt a tremendous amount in my current role, especially around my cloud architecture skills. I'm now ready for a new challenge that allows me to lead larger projects and mentor junior developers, and this position offers exactly that opportunity. I'm particularly excited about your company's innovative use of AI in infrastructure.",
          correct: true,
          feedback: "✅ Excellent! Focuses on growth and what you're moving TOWARDS, not away from."
        }
      ],
      tips: [
        "Never badmouth previous employers",
        "Focus on what you're moving toward, not what you're leaving",
        "Frame it as seeking growth and new challenges",
        "Show enthusiasm for the new opportunity"
      ]
    },
    {
      id: 3,
      question: "What are your salary expectations?",
      options: [
        {
          id: 'A',
          text: "I don't know... what are you offering? I really need at least S$5,000.",
          correct: false,
          feedback: "❌ Unprepared and too demanding. Do your research and be flexible."
        },
        {
          id: 'B',
          text: "Based on my research of market rates for this role and my 5 years of experience, I'm looking for something in the range of S$6,000 - S$8,000. However, I'm flexible and would love to learn more about the complete compensation package and growth opportunities.",
          correct: true,
          feedback: "✅ Perfect! Shows research, provides a range, and demonstrates flexibility."
        }
      ],
      tips: [
        "Do your research beforehand (Glassdoor, Payscale, LinkedIn)",
        "Provide a range, not a single number",
        "Show flexibility and openness",
        "Consider total compensation, not just salary"
      ]
    },
    {
      id: 4,
      question: "Where do you see yourself in 5 years?",
      options: [
        {
          id: 'A',
          text: "I want to be a CEO running my own company. Or maybe I'll be travelling the world and pursuing my hobbies.",
          correct: false,
          feedback: "❌ Unrealistic or indicates lack of commitment to this specific role/company."
        },
        {
          id: 'B',
          text: "In 5 years, I see myself having grown significantly in cloud architecture, ideally in a senior or leadership role where I can mentor others and drive strategic initiatives for our infrastructure. I'm excited about the growth path this company offers, particularly in scaling our global services.",
          correct: true,
          feedback: "✅ Excellent! Shows ambition, realistic goals, and alignment with company growth."
        }
      ],
      tips: [
        "Show ambition but be realistic",
        "Align your goals with the company's growth path",
        "Demonstrate commitment without over-committing",
        "Focus on skill development and increasing responsibility"
      ]
    },
    {
      id: 5,
      question: "Why do you want to work here?",
      options: [
        {
          id: 'A',
          text: "I need a job and this seems like a good opportunity. The salary is good too.",
          correct: false,
          feedback: "❌ Shallow and transactional. Shows no research or genuine interest beyond basic needs."
        },
        {
          id: 'B',
          text: "I'm genuinely excited about this opportunity for three reasons: First, your company's mission to innovate in sustainable energy solutions aligns perfectly with my values of environmental responsibility. Second, I'm impressed by your recent launch of the 'GreenGrid' platform—it's a groundbreaking step. Third, the role offers the perfect blend of engineering challenges and direct impact on clean tech that I'm looking for in my next position.",
          correct: true,
          feedback: "✅ Outstanding! Shows research, specific knowledge, and values alignment."
        }
      ],
      tips: [
        "Research the company thoroughly beforehand",
        "Be specific - mention products, values, recent news",
        "Show genuine enthusiasm",
        "Connect company's mission to your career goals"
      ]
    },
    {
      id: 6,
      question: "What's your greatest weakness?",
      options: [
        {
          id: 'A',
          text: "I don't really have any weaknesses. I'm pretty perfect at everything I do.",
          correct: false,
          feedback: "❌ Lacks self-awareness and honesty. Everyone has areas for improvement."
        },
        {
          id: 'B',
          text: "I tend to be very detail-oriented, which means I sometimes spend more time on tasks than necessary. I've been actively working on this by setting clearer time boundaries and using the 80/20 rule to focus on what matters most. For example, in my last project, I used timeboxing techniques which helped me deliver faster without compromising quality.",
          correct: true,
          feedback: "✅ Perfect! Genuine weakness with self-awareness and active improvement plan."
        }
      ],
      tips: [
        "Choose a real weakness, not a humble-brag",
        "Show self-awareness and growth mindset",
        "Explain what you're doing to improve",
        "Give a specific example of progress"
      ]
    }
  ];

  const handleAnswerSelect = (questionId: number, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const option = question.options.find(o => o.id === optionId);
    if (!option) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: { optionId, correct: option.correct }
    });

    if (option.correct) {
      setScore(score + 15);
    }
  };

  const handleComplete = () => {
    const gameData: GameData = {
      selectedAnswers,
      userAnswers,
      score,
      totalQuestions: questions.length,
      completedAt: new Date().toISOString()
    };

    // Call parent completion handler if provided
    if (onComplete) {
      onComplete(score, gameData);
    }

    // Save progress to backend
    if (moduleId) {
      saveProgress.mutate({
        moduleId,
        progress: 100,
        completed: true,
        userData: gameData
      });
    }

    const percentage = (score / (questions.length * 15)) * 100;
    toast({
      title: "Quiz Complete!",
      description: `You scored ${score} out of ${questions.length * 15} points (${percentage.toFixed(0)}%)`,
    });
  };

  // Mutation to save progress to backend
  const saveProgress = useMutation({
    mutationFn: async (data: { moduleId: string; progress: number; completed: boolean; userData: GameData }) => {
      const response = await fetch('/api/prepare/modules/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      return response.json();
    },
    onSuccess: () => {
      console.log('✅ HRQuestionsGame progress saved successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to save HRQuestionsGame progress:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  const progress = (currentStep / questions.length) * 100;
  const isQuizComplete = currentStep === questions.length && selectedAnswers[questions[currentStep - 1].id];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Question {currentStep} of {questions.length}</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {questions.map((question, index) =>
          currentStep === index + 1 && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                    "{question.question}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <AlertDescription>
                      <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {question.tips.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {question.options.map((option) => {
                      const isSelected = selectedAnswers[question.id]?.optionId === option.id;
                      const showFeedback = isSelected;

                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => !selectedAnswers[question.id] && handleAnswerSelect(question.id, option.id)}
                          disabled={!!selectedAnswers[question.id]}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            !showFeedback
                              ? 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                              : option.correct
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                          } ${selectedAnswers[question.id] ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          whileHover={!selectedAnswers[question.id] ? { scale: 1.02 } : {}}
                          whileTap={!selectedAnswers[question.id] ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                              showFeedback
                                ? option.correct ? 'bg-green-500' : 'bg-red-500'
                                : 'bg-purple-500'
                            }`}>
                              {option.id}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed mb-2">{option.text}</p>
                              {showFeedback && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 pt-2 border-t border-gray-200"
                                >
                                  <p className="text-sm font-semibold">{option.feedback}</p>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {selectedAnswers[question.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {currentStep < questions.length ? (
                        <Button
                          onClick={() => setCurrentStep(currentStep + 1)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          Next Question <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <Alert className="bg-green-50 border-green-200">
                            <Trophy className="w-5 h-5 text-green-600" />
                            <AlertDescription>
                              <p className="font-semibold text-green-900">🎉 Quiz Complete!</p>
                              <p className="text-sm text-green-800 mt-1">
                                You scored {score} out of {questions.length * 15} points!
                              </p>
                              <p className="text-sm text-green-800 mt-2">
                                {score / (questions.length * 15) >= 0.8
                                  ? "Excellent work! You're ready for HR screenings!"
                                  : "Good effort! Review the correct answers and try again."}
                              </p>
                            </AlertDescription>
                          </Alert>

                          <Button
                            onClick={handleComplete}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                            disabled={saveProgress.isPending}
                          >
                            {saveProgress.isPending ? 'Saving...' : 'Complete Quiz'}
                            <Trophy className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* User's own answer section */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">💬 Practice: Write Your Own Answer</h4>
                    <Textarea
                      placeholder="Type your answer here... (optional practice)"
                      value={userAnswers[question.id] || ''}
                      onChange={(e) => setUserAnswers({...userAnswers, [question.id]: e.target.value})}
                      className="min-h-24"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
