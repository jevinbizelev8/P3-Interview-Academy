import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Lightbulb, Trophy, ArrowLeft, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PitchBreakdown {
  who: string;
  what: string;
  why: string;
}

interface PitchExample {
  id: number;
  role: string;
  pitch: string;
  breakdown: PitchBreakdown;
}

interface GameData {
  viewedExamples: number[];
  completedAt: string;
}

interface ElevatorPitchBuilderProps {
  moduleId?: string;
  onComplete?: (score: number, data: GameData) => void;
}

export default function ElevatorPitchBuilder({ moduleId, onComplete }: ElevatorPitchBuilderProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [viewedExamples, setViewedExamples] = useState<number[]>([]);
  const { toast } = useToast();

  const examples: PitchExample[] = [
    {
      id: 1,
      role: "Software Engineer",
      pitch: "I'm a full-stack developer with 5 years of experience building scalable web applications, currently at TechCorp where I work on the core platform team. I specialise in React and Node.js and recently led the migration of our monolith to microservices, which improved system reliability by 40% and reduced deployment time from hours to minutes. I'm excited about this opportunity because I want to work on products that directly impact millions of users, and your company's mission to make technology more accessible really resonates with me.",
      breakdown: {
        who: "Full-stack developer, 5 years experience, TechCorp platform team",
        what: "Specialise in React/Node.js, led microservices migration, 40% reliability improvement",
        why: "Want to impact millions of users, mission alignment with accessibility"
      }
    },
    {
      id: 2,
      role: "Marketing Manager",
      pitch: "I'm a digital marketing manager with 6 years of experience in B2B SaaS, currently leading demand generation at MarketCo. I specialise in content marketing and SEO, and I've grown organic traffic by 300% and generated over $2M in pipeline over the past year through strategic content initiatives. I'm particularly interested in this role because I want to work with a product that's disrupting its industry, and your innovative approach to solving customer pain points is exactly the kind of challenge I'm looking for.",
      breakdown: {
        who: "Digital marketing manager, 6 years B2B SaaS, leading demand gen",
        what: "Content marketing/SEO expert, 300% traffic growth, $2M pipeline",
        why: "Want disruptive product, excited about innovative approach"
      }
    },
    {
      id: 3,
      role: "Product Manager",
      pitch: "I'm a product manager with 7 years of experience in e-commerce, currently leading the checkout experience team at ShopCo. I specialise in user experience optimisation and data-driven decision making, and in my current role, I led a redesign that increased conversion rates by 23% and reduced cart abandonment by 15%. I'm particularly excited about this opportunity because I'm passionate about creating seamless digital experiences, and your company's focus on innovation in payment technology aligns perfectly with where I want to take my career next.",
      breakdown: {
        who: "Product manager, 7 years e-commerce, leading checkout team",
        what: "UX optimisation expert, 23% conversion increase, 15% lower abandonment",
        why: "Passionate about seamless experiences, excited about payment innovation"
      }
    }
  ];

  const handleExampleClick = (exampleId: number) => {
    const newSelectedExample = selectedExample === exampleId ? null : exampleId;
    setSelectedExample(newSelectedExample);

    // Track viewed examples for progress
    if (newSelectedExample !== null && !viewedExamples.includes(exampleId)) {
      setViewedExamples([...viewedExamples, exampleId]);
      setScore(score + 10);
    }
  };

  const handleGoToSelfIntro = () => {
    const finalScore = score + 30;
    setScore(finalScore);

    const gameData: GameData = {
      viewedExamples,
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

    // Trigger navigation to self-intro tab
    window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'intro' }));

    toast({
      title: "Game Complete!",
      description: `You earned ${finalScore} points. Redirecting to Self-Introduction...`,
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
      console.log('✅ ElevatorPitchBuilder progress saved successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to save ElevatorPitchBuilder progress:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  const progress = (currentStep / 2) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Step {currentStep} of 2</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: What is an Elevator Pitch? */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🎯 1. What is an Elevator Pitch?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="font-semibold mb-2">An elevator pitch is your 60-90 second professional story</p>
                    <p className="text-sm">It's who you are, what you do, and why you're perfect for the opportunity — delivered with clarity and confidence.</p>
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-4">📊 The 3-Part Formula</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-500">20-30s</Badge>
                        <h4 className="font-semibold text-blue-900">WHO you are</h4>
                      </div>
                      <p className="text-sm text-gray-700">Current role, experience, industry/domain</p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Example: "I'm a product manager with 7 years in e-commerce..."
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-500">20-30s</Badge>
                        <h4 className="font-semibold text-purple-900">WHAT you bring</h4>
                      </div>
                      <p className="text-sm text-gray-700">Key skills, achievements with metrics, unique value</p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Example: "I specialise in UX optimisation and recently increased conversion by 23%..."
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-pink-500">20-30s</Badge>
                        <h4 className="font-semibold text-pink-900">WHY this opportunity</h4>
                      </div>
                      <p className="text-sm text-gray-700">Motivation, alignment with goals, genuine interest</p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Example: "I'm excited about your company's focus on innovation in payment tech..."
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="bg-yellow-50 border-yellow-200">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    <p className="font-semibold mb-1">💡 Why This Matters</p>
                    <p className="text-sm">A strong elevator pitch helps you:</p>
                    <ul className="text-sm mt-2 space-y-1 ml-4">
                      <li>• Make a memorable first impression</li>
                      <li>• Communicate your value quickly and clearly</li>
                      <li>• Show you've prepared and care about the opportunity</li>
                      <li>• Stand out from other candidates</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    disabled={true}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={() => {
                      setScore(score + 15);
                      setCurrentStep(2);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Show me examples
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Example Analysis */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🔍 2. Analyze Real Examples</CardTitle>
                <p className="text-gray-600">Click on each example to see how the WHO-WHAT-WHY formula works</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {examples.map((example) => (
                  <div key={example.id} className="space-y-2">
                    <button
                      onClick={() => handleExampleClick(example.id)}
                      className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-purple-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-purple-900">{example.role}</h4>
                        <Badge variant="outline">
                          {selectedExample === example.id ? 'Click to collapse' : 'Click to analyse'}
                        </Badge>
                      </div>
                    </button>

                    {selectedExample === example.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white p-4 rounded-lg border border-purple-200"
                      >
                        <p className="text-sm text-gray-700 italic mb-4 leading-relaxed">"{example.pitch}"</p>

                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 mb-1">👤 WHO:</p>
                            <p className="text-sm text-blue-800">{example.breakdown.who}</p>
                          </div>

                          <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-xs font-semibold text-purple-900 mb-1">💼 WHAT:</p>
                            <p className="text-sm text-purple-800">{example.breakdown.what}</p>
                          </div>

                          <div className="p-3 bg-pink-50 rounded-lg">
                            <p className="text-xs font-semibold text-pink-900 mb-1">🎯 WHY:</p>
                            <p className="text-sm text-pink-800">{example.breakdown.why}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}

                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900">✨ Key Patterns to Notice:</p>
                    <ul className="text-sm text-green-800 mt-2 space-y-1 ml-4">
                      <li>• <strong>Specific numbers</strong> make achievements concrete</li>
                      <li>• <strong>Current context</strong> establishes credibility</li>
                      <li>• <strong>Clear motivation</strong> shows genuine interest</li>
                      <li>• <strong>Natural flow</strong> makes it conversational, not rehearsed</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-purple-300">
                  <div className="flex items-start gap-4">
                    <Video className="w-12 h-12 text-purple-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-purple-900 text-lg mb-2">Ready to Build Yours?</h3>
                      <p className="text-sm text-purple-800 mb-4">
                        Now that you understand the framework, head to the <strong>Self-Introduction</strong> tab where you'll:
                      </p>
                      <ul className="text-sm text-purple-700 space-y-1 ml-4 mb-4">
                        <li>✅ Draft your WHO-WHAT-WHY script step-by-step</li>
                        <li>✅ Get AI feedback to polish your pitch</li>
                        <li>✅ Record your video introduction</li>
                        <li>✅ Receive detailed assessment and coaching</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleGoToSelfIntro}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                    disabled={saveProgress.isPending}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {saveProgress.isPending ? 'Saving...' : 'Go to Self-Introduction'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
