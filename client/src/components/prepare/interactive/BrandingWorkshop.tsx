import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Lightbulb, Trophy, Sparkles, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";

interface BrandData {
  strengths: string[];
  identity: string;
  origin: string;
  valueProposition: string;
  stories: string[];
}

interface IdentityExample {
  format: string;
  example: string;
}

interface BrandingElement {
  id: number;
  title: string;
  description: string;
  prompt: string;
  example: string;
  tips: string[];
}

interface BrandingWorkshopProps {
  moduleId?: string;
  onComplete?: (score: number, data: BrandData) => void;
}

export default function BrandingWorkshop({ moduleId, onComplete }: BrandingWorkshopProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [brandData, setBrandData] = useState<BrandData>({
    strengths: [],
    identity: "",
    origin: "",
    valueProposition: "",
    stories: []
  });
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);

  const strengthOptions: string[] = [
    "Problem-solving", "Analytical thinking", "Leadership", "Communication",
    "Data-driven decision making", "Cross-functional collaboration",
    "Innovation", "User-centric design", "Strategic thinking", "Technical expertise",
    "Project management", "Mentorship", "Adaptability", "Creative thinking"
  ];

  const identityExamples: IdentityExample[] = [
    {
      format: "I am a [role] who [unique value] for [target] through [how]",
      example: "I am a product manager who creates delightful user experiences for mobile apps through data-driven design and rapid experimentation."
    },
    {
      format: "I am a [role] who [unique value] for [target] through [how]",
      example: "I am a software engineer who builds scalable backend systems for high-traffic applications through clean architecture and performance optimisation."
    },
    {
      format: "I am a [role] who [unique value] for [target] through [how]",
      example: "I am a marketing strategist who drives customer acquisition for B2B SaaS companies through content marketing and SEO."
    }
  ];

  const originPrompts: string[] = [
    "How did you get interested in your field?",
    "What key moments shaped your career direction?",
    "Where are you now professionally?",
    "Where are you headed next?"
  ];

  const handleStrengthToggle = (strength: string) => {
    if (selectedStrengths.includes(strength)) {
      setSelectedStrengths(selectedStrengths.filter(s => s !== strength));
    } else if (selectedStrengths.length < 3) {
      setSelectedStrengths([...selectedStrengths, strength]);
      if (selectedStrengths.length === 2) {
        setScore(score + 15);
      }
    }
  };

  const handleComplete = () => {
    const finalScore = score + 35;
    setScore(finalScore);

    // Call parent completion handler if provided
    if (onComplete) {
      onComplete(finalScore, brandData);
    }

    // Save progress to backend
    if (moduleId) {
      saveProgress.mutate({
        moduleId,
        isCompleted: true,
        score: finalScore,
        userData: brandData
      });
    }
  };

  // Mutation to save progress to backend
  const saveProgress = useMutation({
    mutationFn: async (data: { moduleId: string; isCompleted: boolean; score: number; userData: BrandData }) => {
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
      console.log('✅ BrandingWorkshop progress saved successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to save BrandingWorkshop progress:', error);
    }
  });

  const progress = (currentStep / 5) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Building Your Brand: Step {currentStep} of 5</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: What is Personal Branding? */}
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
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  What is Personal Branding?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-purple-50 border-purple-200">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    <p className="font-semibold mb-2">Your personal brand is how you present yourself professionally</p>
                    <p className="text-sm">It's the story you tell about who you are, what you stand for, and what value you bring. In interviews, your personal brand is the lasting impression you leave behind.</p>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Why It Matters
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Sets you apart from similar candidates</li>
                        <li>• Makes you memorable after interviews</li>
                        <li>• Helps you answer coherently</li>
                        <li>• Builds confidence</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        What We'll Build
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Your core strengths</li>
                        <li>• Professional identity statement</li>
                        <li>• Your origin story</li>
                        <li>• Value proposition</li>
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
                  Let's build my brand! <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Core Strengths */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">💪 Identify Your Core Strengths</CardTitle>
                <p className="text-gray-600">Select 3 strengths that best define your professional identity</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    Think about:
                    <ul className="mt-2 space-y-1">
                      <li>• What are you naturally good at?</li>
                      <li>• What do people come to you for help with?</li>
                      <li>• What aspects of your work energise you most?</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-wrap gap-2">
                  {strengthOptions.map((strength) => (
                    <button
                      key={strength}
                      onClick={() => handleStrengthToggle(strength)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        selectedStrengths.includes(strength)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {strength}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">Selected Strengths ({selectedStrengths.length}/3):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStrengths.map((strength) => (
                      <Badge key={strength} className="bg-purple-600">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedStrengths.length === 3 && (
                  <Button
                    onClick={() => {
                      setBrandData({...brandData, strengths: selectedStrengths});
                      setCurrentStep(3);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next: Professional Identity <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Professional Identity */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🎯 Your Professional Identity</CardTitle>
                <p className="text-gray-600">Craft your one-sentence professional identity statement</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-purple-50 border-purple-200">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    <p className="font-semibold mb-2">Formula:</p>
                    <p className="text-sm italic">"I am a [role] who [unique value] for [target/industry] through [how you do it]."</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Examples:</p>
                  {identityExamples.map((ex, i) => (
                    <div key={i} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-900 italic">"{ex.example}"</p>
                    </div>
                  ))}
                </div>

                <Textarea
                  placeholder="Type your professional identity statement here..."
                  value={brandData.identity}
                  onChange={(e) => setBrandData({...brandData, identity: e.target.value})}
                  className="min-h-24"
                />

                {brandData.identity.length >= 50 && (
                  <Button
                    onClick={() => {
                      setScore(score + 20);
                      setCurrentStep(4);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next: Origin Story <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Origin Story */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">📖 Your Origin Story</CardTitle>
                <p className="text-gray-600">How did you get to where you are professionally?</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-pink-50 border-pink-200">
                  <Lightbulb className="w-5 h-5 text-pink-600" />
                  <AlertDescription className="text-pink-900">
                    <p className="text-sm font-semibold mb-2">Your origin story should include:</p>
                    <ul className="text-sm space-y-1">
                      {originPrompts.map((prompt, i) => (
                        <li key={i}>• {prompt}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Example:</p>
                  <p className="text-sm text-blue-800 italic leading-relaxed">
                    "I discovered my passion for data analysis during my first internship at a retail company, where I noticed patterns in customer behaviour that no one had explored. That curiosity led me to pursue analytics formally. Over the past 5 years, I've specialised in e-commerce analytics, helping companies understand and predict customer behaviour. Now I'm looking to take that expertise to a product-focused role where I can directly influence what we build based on data insights."
                  </p>
                </div>

                <Textarea
                  placeholder="Write your origin story here (3-5 sentences)..."
                  value={brandData.origin}
                  onChange={(e) => setBrandData({...brandData, origin: e.target.value})}
                  className="min-h-32"
                />

                {brandData.origin.length >= 100 && (
                  <Button
                    onClick={() => {
                      setScore(score + 20);
                      setCurrentStep(5);
                    }}
                    className="w-full bg-gradient-to-r from-pink-600 to-orange-600"
                  >
                    Final Step: Value Proposition <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Value Proposition */}
        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">💎 Your Value Proposition</CardTitle>
                <p className="text-gray-600">What specific value do you bring?</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <p className="font-semibold mb-2">Formula:</p>
                    <p className="text-sm italic">"I help [target] achieve [desired outcome] by [your unique approach]"</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Examples:</p>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900 italic">"I help engineering teams ship products faster by implementing agile practices and removing bottlenecks in the development process."</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900 italic">"I help B2B companies increase qualified leads by 50%+ through targeted content marketing and SEO strategies."</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900 italic">"I help startups scale their infrastructure efficiently by designing cloud-native architectures that grow with demand."</p>
                  </div>
                </div>

                <Textarea
                  placeholder="Type your value proposition here..."
                  value={brandData.valueProposition}
                  onChange={(e) => setBrandData({...brandData, valueProposition: e.target.value})}
                  className="min-h-24"
                />

                {brandData.valueProposition.length >= 50 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <Alert className="bg-purple-50 border-purple-200">
                      <Trophy className="w-5 h-5 text-purple-600" />
                      <AlertDescription>
                        <p className="font-semibold text-purple-900">🎉 Your Personal Brand is Complete!</p>
                        <p className="text-sm text-purple-800 mt-1">Total Score: {score + 35} points</p>
                      </AlertDescription>
                    </Alert>

                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
                      <CardHeader>
                        <CardTitle className="text-lg">✨ Your Complete Brand</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-purple-900 mb-1">CORE STRENGTHS:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStrengths.map((strength) => (
                              <Badge key={strength} className="bg-purple-600">{strength}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-purple-900 mb-1">PROFESSIONAL IDENTITY:</p>
                          <p className="text-sm text-gray-700 italic">"{brandData.identity}"</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-purple-900 mb-1">ORIGIN STORY:</p>
                          <p className="text-sm text-gray-700">{brandData.origin}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-purple-900 mb-1">VALUE PROPOSITION:</p>
                          <p className="text-sm text-gray-700 italic">"{brandData.valueProposition}"</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Alert className="bg-blue-50 border-blue-200">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-900 text-sm">
                        <strong>Next Steps:</strong> Use these brand elements consistently in your LinkedIn, CV, and interview answers. Every interaction should reinforce who you are professionally!
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleComplete}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                      disabled={saveProgress.isPending}
                    >
                      {saveProgress.isPending ? 'Saving...' : 'Complete Workshop'} <Trophy className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
