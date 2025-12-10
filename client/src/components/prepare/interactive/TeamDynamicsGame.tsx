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
  ArrowRight,
  Users,
  Trophy,
  Lightbulb
} from 'lucide-react';

interface TeamDynamicsGameProps {
  moduleId?: string;
  onComplete?: (score: number, userData: TeamDynamicsData) => void;
}

interface TeamDynamicsData {
  selectedAnswers: Record<number, AnswerSelection>;
  completedAt: string;
}

interface AnswerSelection {
  optionId: string;
  correct: boolean;
}

interface TeamOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

interface TeamScenario {
  id: number;
  title: string;
  situation: string;
  question: string;
  options: TeamOption[];
}

export default function TeamDynamicsGame({
  moduleId,
  onComplete
}: TeamDynamicsGameProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, AnswerSelection>>({});

  const scenarios: TeamScenario[] = [
    {
      id: 1,
      title: "Collaboration Scenario",
      situation: "You're working on a feature with the design team. They want a complex animation that your engineering team says will delay the launch by 2 weeks.",
      question: "How do you handle this?",
      options: [
        {
          id: 'A',
          text: "Tell design they need to simplify their vision because engineering says so.",
          correct: false,
          feedback: "❌ Too dismissive of design's input. Doesn't seek collaboration."
        },
        {
          id: 'B',
          text: "Organize a working session with both teams to explore alternatives. Maybe there's a simpler version that achieves 80% of the impact without the delay? Or perhaps the animation is worth pushing the timeline?",
          correct: true,
          feedback: "✅ Perfect! Brings teams together, explores options, respects both perspectives."
        },
        {
          id: 'C',
          text: "Go with the design team's vision. They know what users want.",
          correct: false,
          feedback: "❌ Ignores engineering constraints and timeline impact."
        }
      ]
    },
    {
      id: 2,
      title: "Communication Style",
      situation: "During a team meeting, you notice a junior team member has a good idea but seems hesitant to speak up.",
      question: "What do you do?",
      options: [
        {
          id: 'A',
          text: "Nothing. If they have something to say, they'll say it.",
          correct: false,
          feedback: "❌ Misses opportunity to create psychological safety and get valuable input."
        },
        {
          id: 'B',
          text: "After the meeting, encourage them to share their idea with the team.",
          correct: false,
          feedback: "⚠️ Better than nothing, but the moment has passed. Could be more proactive."
        },
        {
          id: 'C',
          text: "Gently invite their input: 'Sarah, I noticed you were nodding earlier—what are your thoughts on this?'",
          correct: true,
          feedback: "✅ Excellent! Creates inclusive environment and ensures all voices are heard."
        }
      ]
    },
    {
      id: 3,
      title: "Team Lunch Scenario",
      situation: "You're at a casual team lunch and someone asks about your weekend plans.",
      question: "How do you respond?",
      options: [
        {
          id: 'A',
          text: "Give a very detailed 10-minute story about everything you did.",
          correct: false,
          feedback: "❌ Too much, too long. Remember it's a conversation, not a monologue."
        },
        {
          id: 'B',
          text: "'Nothing much, just relaxing.' Then go quiet.",
          correct: false,
          feedback: "❌ Too closed off. Misses chance to build rapport."
        },
        {
          id: 'C',
          text: "'I'm planning to try that new hiking trail near the lake. Do you do much hiking?' Share briefly, then engage them.",
          correct: true,
          feedback: "✅ Perfect balance! Share appropriately and show interest in them."
        }
      ]
    },
    {
      id: 4,
      title: "Disagreement Handling",
      situation: "In a brainstorming session, your idea gets shot down by the team. You still think it has merit.",
      question: "What's your move?",
      options: [
        {
          id: 'A',
          text: "Let it go completely. The team has spoken.",
          correct: false,
          feedback: "❌ Too passive. Sometimes good ideas need advocacy."
        },
        {
          id: 'B',
          text: "Keep pushing for it throughout the meeting until they agree.",
          correct: false,
          feedback: "❌ Too aggressive. Doesn't respect team input."
        },
        {
          id: 'C',
          text: "Ask clarifying questions: 'I'm curious what concerns you have about this approach?' Then listen and adapt or gracefully move on.",
          correct: true,
          feedback: "✅ Great! Shows you can take feedback and aren't too attached to your ideas."
        }
      ]
    }
  ];

  const teamQuestions: string[] = [
    "How does the team handle disagreements?",
    "What do you enjoy most about this team?",
    "How does the team celebrate wins?",
    "What's the communication style—meetings or async?",
    "Tell me about a recent team challenge",
    "What's one thing you wish you'd known before joining?"
  ];

  const handleScenarioSelect = (scenarioId: number, optionId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const option = scenario.options.find(o => o.id === optionId);
    if (!option) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [scenarioId]: { optionId, correct: option.correct }
    });

    if (option.correct) {
      setScore(score + 15);
    }
  };

  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/prepare/modules/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moduleId: moduleId || 'team-dynamics-game',
          progress: ((currentStep) / 6) * 100,
          completed: currentStep === 6,
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
    if (currentStep < 6) {
      await saveProgressMutation.mutateAsync();
      setCurrentStep(currentStep + 1);
    } else {
      await saveProgressMutation.mutateAsync();
      if (onComplete) {
        onComplete(score + 25, {
          selectedAnswers,
          completedAt: new Date().toISOString()
        });
      }
    }
  };

  const progress = (currentStep / 6) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Team Dynamics Module: Step {currentStep} of 6</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Why Team Interviews Matter */}
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
                  <Users className="w-6 h-6 text-purple-600" />
                  Why Team Interviews Matter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="font-semibold mb-2">It's not just about skills—it's about chemistry!</p>
                    <p className="text-sm">Your future colleagues want to know: Can we work with you day-to-day?</p>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-purple-900 mb-3">🔍 What They're Assessing</h4>
                      <ul className="text-sm text-purple-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Can you work with diverse personalities?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Do you communicate effectively?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Will you fit our culture?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Can you handle feedback?</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-green-900 mb-3">🎯 Your Mission</h4>
                      <ul className="text-sm text-green-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">1.</span>
                          <span>Show collaboration skills</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">2.</span>
                          <span>Demonstrate EQ</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">3.</span>
                          <span>Build genuine rapport</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">4.</span>
                          <span>Interview them too!</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={() => {
                    setScore(score + 10);
                    setCurrentStep(2);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Let's practice! <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2-5: Scenarios */}
        {currentStep >= 2 && currentStep <= 5 && (
          <motion.div
            key={`step${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {scenarios[currentStep - 2] && (
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {scenarios[currentStep - 2].title}
                  </CardTitle>
                  <p className="text-gray-600 mt-2">{scenarios[currentStep - 2].situation}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-purple-50 border-purple-200">
                    <Users className="w-5 h-5 text-purple-600" />
                    <AlertDescription className="text-purple-900 font-semibold">
                      {scenarios[currentStep - 2].question}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {scenarios[currentStep - 2].options.map((option) => {
                      const isSelected = selectedAnswers[scenarios[currentStep - 2].id]?.optionId === option.id;
                      const showFeedback = isSelected;

                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => !selectedAnswers[scenarios[currentStep - 2].id] && handleScenarioSelect(scenarios[currentStep - 2].id, option.id)}
                          disabled={!!selectedAnswers[scenarios[currentStep - 2].id]}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            !showFeedback
                              ? 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                              : option.correct
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                          } ${selectedAnswers[scenarios[currentStep - 2].id] ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          whileHover={!selectedAnswers[scenarios[currentStep - 2].id] ? { scale: 1.02 } : {}}
                          whileTap={!selectedAnswers[scenarios[currentStep - 2].id] ? { scale: 0.98 } : {}}
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

                  {selectedAnswers[scenarios[currentStep - 2].id] && (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {currentStep < 5 ? "Next Scenario" : "Complete!"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Step 6: Completion */}
        {currentStep === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Module Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900">🎉 Great work!</p>
                    <p className="text-sm text-green-800 mt-1">Final Score: {score + 25} points</p>
                    <p className="text-sm text-green-800 mt-2">
                      You've learned how to navigate team dynamics, adapt your communication style, and build rapport effectively!
                    </p>
                  </AlertDescription>
                </Alert>

                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-purple-900 mb-3">💡 Key Takeaways</h4>
                    <ul className="text-sm text-purple-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Team interviews assess chemistry, not just skills</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Collaboration means finding middle ground, not winning arguments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Adapt your communication style to your audience</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Remember: You're interviewing them too!</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">🤔 Questions to Ask the Team</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {teamQuestions.map((q, i) => (
                      <div key={i} className="text-xs text-blue-800 flex items-start gap-1">
                        <span className="text-blue-600">•</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
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
