import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Code,
  ArrowRight,
  Trophy,
  Brain,
  Lightbulb
} from 'lucide-react';

interface TechnicalFrameworkGameProps {
  moduleId?: string;
  onComplete?: (score: number, userData: TechnicalFrameworkData) => void;
}

interface TechnicalFrameworkData {
  selectedAnswers: Record<number, AnswerSelection>;
  completedAt: string;
}

interface AnswerSelection {
  optionId: string;
  correct: boolean;
}

interface TechnicalOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

interface TechnicalScenario {
  id: number;
  question: string;
  options: TechnicalOption[];
}

interface FrameworkStep {
  step: number;
  title: string;
  description: string;
}

export default function TechnicalFrameworkGame({
  moduleId,
  onComplete
}: TechnicalFrameworkGameProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, AnswerSelection>>({});

  const technicalScenarios: TechnicalScenario[] = [
    {
      id: 1,
      question: "How do you approach a technical problem you've never seen before?",
      options: [
        {
          id: 'A',
          text: "Google it immediately and copy the first solution I find.",
          correct: false,
          feedback: "❌ Too hasty. You need to understand the problem first."
        },
        {
          id: 'B',
          text: "First, I break down the problem into smaller components, identify what I know vs. don't know, research similar patterns, evaluate tradeoffs of different approaches, then implement the best solution while documenting my reasoning.",
          correct: true,
          feedback: "✅ Perfect! Shows structured thinking and problem-solving process."
        },
        {
          id: 'C',
          text: "Ask my team lead to solve it for me.",
          correct: false,
          feedback: "❌ Shows lack of initiative and problem-solving ability."
        }
      ]
    },
    {
      id: 2,
      question: "Your solution works but is slow. The interviewer asks you to optimize it.",
      options: [
        {
          id: 'A',
          text: "Start randomly changing code hoping something works faster.",
          correct: false,
          feedback: "❌ No methodology. Need systematic approach."
        },
        {
          id: 'B',
          text: "Profile the code to identify bottlenecks, analyze time/space complexity, consider data structures and algorithms that could improve performance, implement optimizations, then measure impact.",
          correct: true,
          feedback: "✅ Excellent! Systematic optimization approach."
        },
        {
          id: 'C',
          text: "Say it's fast enough and move on.",
          correct: false,
          feedback: "❌ Dismissive of feedback and optimization opportunities."
        }
      ]
    },
    {
      id: 3,
      question: "Interviewer asks: 'Explain [complex technical concept] to a non-technical person.'",
      options: [
        {
          id: 'A',
          text: "Use all the technical jargon I know to sound smart.",
          correct: false,
          feedback: "❌ Defeats the purpose. Can't adapt communication."
        },
        {
          id: 'B',
          text: "Use an analogy or real-world example they can relate to, then build up complexity gradually with simple language.",
          correct: true,
          feedback: "✅ Perfect! Shows strong communication and teaching ability."
        },
        {
          id: 'C',
          text: "Tell them it's too technical for them to understand.",
          correct: false,
          feedback: "❌ Condescending and shows poor communication skills."
        }
      ]
    }
  ];

  const problemSolvingFramework: FrameworkStep[] = [
    { step: 1, title: "Understand", description: "Clarify requirements, constraints, edge cases" },
    { step: 2, title: "Plan", description: "Break down problem, identify patterns, consider approaches" },
    { step: 3, title: "Implement", description: "Write clean, working code with good practices" },
    { step: 4, title: "Test", description: "Verify correctness, edge cases, performance" },
    { step: 5, title: "Optimize", description: "Analyze complexity, improve efficiency" },
    { step: 6, title: "Explain", description: "Articulate reasoning, tradeoffs, alternatives" }
  ];

  const handleAnswerSelect = (scenarioId: number, optionId: string) => {
    const scenario = technicalScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const option = scenario.options.find(o => o.id === optionId);
    if (!option) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [scenarioId]: { optionId, correct: option.correct }
    });

    if (option.correct) {
      setScore(score + 20);
    }
  };

  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/prepare/modules/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moduleId: moduleId || 'technical-framework-game',
          progress: ((currentStep) / 5) * 100,
          completed: currentStep === 5,
          userData: {
            selectedAnswers,
            completedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress saved",
        description: "Your progress has been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleNext = async () => {
    if (currentStep < 5) {
      await saveProgressMutation.mutateAsync();
      setCurrentStep(currentStep + 1);
    } else {
      await saveProgressMutation.mutateAsync();
      if (onComplete) {
        onComplete(score, {
          selectedAnswers,
          completedAt: new Date().toISOString()
        });
      }
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Technical Framework: Step {currentStep} of 5</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Problem-Solving Framework */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  The Technical Problem-Solving Framework
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="font-semibold mb-2">Technical interviews assess two things:</p>
                    <p className="text-sm">1. Can you solve problems? 2. Can you communicate your thinking?</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {problemSolvingFramework.map((item) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.step * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                    >
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900">{item.title}</h4>
                        <p className="text-sm text-purple-800">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">💡 Pro Tip: Think Out Loud!</h4>
                  <p className="text-sm text-green-800">
                    Interviewers want to see your thought process. Always verbalize your reasoning:
                    "I'm thinking about using a hash map here because..." or "Let me consider the edge cases..."
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setScore(score + 15);
                    setCurrentStep(2);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Practice with scenarios! <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Steps 2-4: Technical Scenarios */}
        {currentStep >= 2 && currentStep <= 4 && (
          <motion.div
            key={`step${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {technicalScenarios[currentStep - 2] && (
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Scenario {currentStep - 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-purple-50 border-purple-200">
                    <Code className="w-5 h-5 text-purple-600" />
                    <AlertDescription className="text-purple-900 font-semibold">
                      {technicalScenarios[currentStep - 2].question}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {technicalScenarios[currentStep - 2].options.map((option) => {
                      const isSelected = selectedAnswers[technicalScenarios[currentStep - 2].id]?.optionId === option.id;
                      const showFeedback = isSelected;

                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => !selectedAnswers[technicalScenarios[currentStep - 2].id] && handleAnswerSelect(technicalScenarios[currentStep - 2].id, option.id)}
                          disabled={!!selectedAnswers[technicalScenarios[currentStep - 2].id]}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            !showFeedback
                              ? 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                              : option.correct
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                          } ${selectedAnswers[technicalScenarios[currentStep - 2].id] ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          whileHover={!selectedAnswers[technicalScenarios[currentStep - 2].id] ? { scale: 1.02 } : {}}
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
                              <p className="text-sm leading-relaxed">{option.text}</p>
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

                  {selectedAnswers[technicalScenarios[currentStep - 2].id] && (
                    <Button
                      onClick={handleNext}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {currentStep < 4 ? "Next Scenario" : "Final Challenge!"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Step 5: Completion */}
        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Technical Framework Mastered!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900">🎉 Excellent work!</p>
                    <p className="text-sm text-green-800 mt-1">Final Score: {score} points</p>
                  </AlertDescription>
                </Alert>

                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-purple-900 mb-3">🎯 Key Takeaways</h4>
                    <ul className="text-sm text-purple-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Follow the 6-step framework: Understand → Plan → Implement → Test → Optimize → Explain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Always think out loud—show your reasoning</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Clarify requirements before diving into code</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Communicate technical concepts clearly to any audience</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📝 Before Your Technical Interview:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Practice explaining your past projects in detail</li>
                    <li>• Review fundamental data structures and algorithms</li>
                    <li>• Practice whiteboarding or live coding</li>
                    <li>• Prepare questions about tech stack and architecture</li>
                  </ul>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={saveProgressMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {saveProgressMutation.isPending ? 'Saving...' : 'Complete Game'} <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
