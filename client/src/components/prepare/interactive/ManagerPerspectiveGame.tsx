import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Briefcase, Trophy, Target, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ManagerPriority {
  id: number;
  priority: string;
  weight: number;
}

interface Scenario {
  id: number;
  question: string;
  weak: string;
  strong: string;
}

interface GameData {
  selectedPriorities: number[];
  impactStories: Record<number, string>;
  score: number;
  completedAt: string;
}

interface ManagerPerspectiveGameProps {
  moduleId?: string;
  onComplete?: (score: number, data: GameData) => void;
}

export default function ManagerPerspectiveGame({ moduleId, onComplete }: ManagerPerspectiveGameProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([]);
  const [impactStories, setImpactStories] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const managerPriorities: ManagerPriority[] = [
    { id: 1, priority: "Can execute independently", weight: 5 },
    { id: 2, priority: "Delivers measurable results", weight: 5 },
    { id: 3, priority: "Takes ownership of problems", weight: 5 },
    { id: 4, priority: "Aligns with team goals", weight: 4 },
    { id: 5, priority: "Communicates proactively", weight: 4 },
    { id: 6, priority: "Has relevant experience", weight: 3 },
    { id: 7, priority: "Fits company culture", weight: 3 },
    { id: 8, priority: "Shows growth potential", weight: 4 }
  ];

  const scenarios: Scenario[] = [
    {
      id: 1,
      question: "Feature Priority Decision: Your team has bandwidth for one major feature this quarter. Marketing wants a flashy new dashboard, Engineering wants to pay down technical debt, and Sales wants integration with a major partner.",
      weak: "Go with Marketing's dashboard - it'll look great for demos. (Manager's Thought: This candidate prioritizes aesthetics over substance. Not considering technical sustainability or revenue impact. Feedback: Weak - Doesn't consider long-term implications or business impact. Hiring managers want strategic thinking.)",
      strong: "I'd analyze each option's impact: dashboard for lead conversion, tech debt for team velocity, partner integration for revenue. I'd propose we quantify the impact of each, present trade-offs to stakeholders, and align the decision with our quarterly OKRs. (Manager's Thought: Excellent! Data-driven approach, considers multiple perspectives, ties to business objectives. Feedback: Strong - Shows strategic thinking, stakeholder management, and data-driven decision making.)"
    },
    {
      id: 2,
      question: "Underperforming Team Member: One of your team members has been missing deadlines and producing lower quality work for the past month. Other team members are starting to notice.",
      weak: "Redistribute their work to others and avoid confrontation. (Manager's Thought: Avoiding difficult conversations will erode team morale and enable continued poor performance. Feedback: Weak - Avoiding the issue. Hiring managers want problem-solvers, not conflict-avoiders.)",
      strong: "I'd schedule a private 1-on-1 to understand what's happening - personal issues, workload, clarity on expectations. I'd create a clear improvement plan with specific goals and regular check-ins. If there's no improvement after reasonable time, I'd involve HR for next steps. (Manager's Thought: Perfect! Empathetic but accountable. Follows proper performance management process. Feedback: Strong - Demonstrates empathy, accountability, and proper people management process.)"
    },
    {
      id: 3,
      question: "Resource Constraints: Your director wants your team to take on an additional high-priority project, but you're already at capacity. Your team is stressed and some are working overtime.",
      weak: "Just say yes and figure it out. Push the team to work harder. (Manager's Thought: Recipe for burnout. Unsustainable and shows poor resource management. Feedback: Weak - Risking team burnout. Good managers protect their team's capacity.)",
      strong: "I'd prepare a clear picture of current commitments, capacity, and trade-offs. I'd present options: delay other projects, reduce scope, or add resources. I'd advocate for my team's bandwidth while showing I understand business priorities. If we must take it on, I'd be transparent with the team about why and how we'll manage it. (Manager's Thought: Excellent! Data-driven pushback, proposes solutions, protects team while being business-aware. Feedback: Strong - Shows backbone, strategic thinking, and ability to manage up while protecting your team.)"
    }
  ];

  const impactMetrics = [
    "Revenue increase/decrease",
    "Cost savings",
    "Time saved",
    "Quality improvement (%)",
    "Customer satisfaction increase",
    "User growth/engagement",
    "Efficiency gains",
    "Error reduction (%)"
  ];

  const handlePriorityToggle = (id: number) => {
    if (selectedPriorities.includes(id)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== id));
    } else if (selectedPriorities.length < 5) {
      setSelectedPriorities([...selectedPriorities, id]);
    }
  };

  const handleComplete = () => {
    const finalScore = score + 10;
    setScore(finalScore);

    const gameData: GameData = {
      selectedPriorities,
      impactStories,
      score: finalScore,
      completedAt: new Date().toISOString()
    };

    // Call parent completion handler if provided
    if (onComplete) {
      onComplete(finalScore, gameData);
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

    toast({
      title: "Game Complete!",
      description: `You earned ${finalScore} points. Manager's perspective mastered!`,
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
      console.log('✅ ManagerPerspectiveGame progress saved successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to save ManagerPerspectiveGame progress:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  const progress = (currentStep / 7) * 100;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Manager's Perspective: Step {currentStep} of 7</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Manager Mindset */}
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
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  What Hiring Managers Really Want
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Target className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="font-semibold mb-2">The manager's #1 question:</p>
                    <p className="text-sm italic">"Can this person solve my problems and deliver results?"</p>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-4 text-center">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-purple-900 mb-1">Competence</h4>
                      <p className="text-xs text-purple-800">Can you do the job?</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4 text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-green-900 mb-1">Ownership</h4>
                      <p className="text-xs text-green-800">Will you take initiative?</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-4 text-center">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-orange-900 mb-1">Impact</h4>
                      <p className="text-xs text-orange-800">Do you deliver results?</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">🎯 The Manager's Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-800">Can execute with minimal hand-holding</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-800">Understands business goals, not just tasks</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-800">Takes ownership of problems end-to-end</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-800">Delivers measurable, business-relevant outcomes</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setScore(score + 10);
                    setCurrentStep(2);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Understand! Let's dive deeper <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Priority Ranking */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🎯 Rank Manager Priorities</CardTitle>
                <p className="text-gray-600">Select the TOP 5 things hiring managers care about most</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {managerPriorities.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handlePriorityToggle(item.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedPriorities.includes(item.id)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.priority}</span>
                        {selectedPriorities.includes(item.id) && (
                          <Badge className="bg-white text-purple-600">
                            #{selectedPriorities.indexOf(item.id) + 1}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    Selected: {selectedPriorities.length}/5
                  </p>
                  {selectedPriorities.length === 5 && (
                    <Alert className="bg-green-50 border-green-200 mt-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-900 text-sm">
                        <p className="font-semibold">Great choices! +20 points</p>
                        <p className="text-xs mt-1">All of these matter, but the top ones show you understand that managers hire for RESULTS, not just resume bullets.</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {selectedPriorities.length === 5 && (
                  <Button
                    onClick={() => {
                      setScore(score + 20);
                      setCurrentStep(3);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next: Framing Impact <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Impact Framework */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">📊 The Impact Formula</CardTitle>
                <p className="text-gray-600">How to frame your achievements in business terms</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-purple-50 border-purple-200">
                  <Target className="w-5 h-5 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    <p className="font-semibold mb-2">The Formula:</p>
                    <p className="text-sm italic">
                      "I [action verb] [what you did], which resulted in [quantifiable business outcome]"
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-900 mb-1">❌ Weak (Task-focused):</p>
                    <p className="text-sm text-red-800 italic">
                      "I managed the website redesign project."
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-900 mb-1">✅ Strong (Impact-focused):</p>
                    <p className="text-sm text-green-800 italic">
                      "I led the website redesign project, which increased conversion rates by 35% and generated an additional $500K in revenue in Q4."
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">💡 Types of Impact Metrics</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {impactMetrics.map((metric, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-blue-800">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">🎯 Your Turn: Pick an Achievement</h4>
                  <Textarea
                    placeholder="Write one of your achievements using the impact formula... Example: 'I automated the monthly reporting process, which saved the team 40 hours per month and reduced errors by 90%.'"
                    value={impactStories[1] || ''}
                    onChange={(e) => setImpactStories({...impactStories, 1: e.target.value})}
                    className="min-h-24 mb-3"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Include numbers and business impact!</span>
                    {impactStories[1] && impactStories[1].length >= 50 && (
                      <Badge className="bg-green-600">Ready!</Badge>
                    )}
                  </div>
                </div>

                {impactStories[1] && impactStories[1].length >= 50 && (
                  <Button
                    onClick={() => {
                      setScore(score + 20);
                      setCurrentStep(4);
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-pink-600"
                  >
                    Next: Practice Scenarios <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Steps 4-6: Scenario Practice */}
        {currentStep >= 4 && currentStep <= 6 && scenarios[currentStep - 4] && (
          <motion.div
            key={`step${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Scenario {currentStep - 3} of 3</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-purple-50 border-purple-200">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <AlertDescription className="text-purple-900 font-semibold">
                    {scenarios[currentStep - 4].question}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-900 mb-2">❌ Weak Answer:</p>
                    <p className="text-sm text-red-800 italic">{scenarios[currentStep - 4].weak}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-900 mb-2">✅ Strong Answer:</p>
                    <p className="text-sm text-green-800 leading-relaxed">{scenarios[currentStep - 4].strong}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">💬 Now You Try:</h4>
                  <Textarea
                    placeholder="Write your own answer to this question using STAR + Impact formula..."
                    value={impactStories[currentStep] || ''}
                    onChange={(e) => setImpactStories({...impactStories, [currentStep]: e.target.value})}
                    className="min-h-32"
                  />
                </div>

                {impactStories[currentStep] && impactStories[currentStep].length >= 100 && (
                  <Button
                    onClick={() => {
                      setScore(score + 15);
                      if (currentStep < 6) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        setCurrentStep(7);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {currentStep < 6 ? "Next Scenario" : "See Results!"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 7: Completion */}
        {currentStep === 7 && (
          <motion.div
            key="step7"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Manager's Perspective Mastered!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900">🎉 Excellent work!</p>
                    <p className="text-sm text-green-800 mt-1">Final Score: {score + 10} points</p>
                  </AlertDescription>
                </Alert>

                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-purple-900 mb-3">🎯 Key Takeaways</h4>
                    <ul className="text-sm text-purple-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Managers hire for competence, ownership, and impact</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Always frame achievements with quantifiable business outcomes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Use metrics: revenue, cost savings, time, quality, satisfaction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Show you understand business goals, not just execute tasks</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">📝 Before Your Next Manager Interview:</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Prepare 5-7 STAR stories with quantifiable impact</li>
                    <li>• Research the company's business goals and challenges</li>
                    <li>• Prepare questions about team goals and success metrics</li>
                    <li>• Practice explaining technical work in business terms</li>
                  </ul>
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={saveProgress.isPending}
                >
                  {saveProgress.isPending ? 'Saving...' : 'Complete Game'}
                  <Trophy className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
