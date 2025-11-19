import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, ArrowRight, Trophy, Sparkles, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ExecutivePresenceBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [visionStatement, setVisionStatement] = useState("");

  const executiveScenarios = [
    {
      id: 1,
      question: "CEO asks: 'Where do you see this industry in 5 years?'",
      options: [
        {
          id: 'A',
          text: "I don't know, I just focus on my current work.",
          correct: false,
          feedback: "❌ Shows lack of strategic thinking and industry awareness."
        },
        {
          id: 'B',
          text: "I see three major shifts: [1] AI automation will transform how we work, [2] regulatory changes around data privacy will reshape product design, and [3] customer expectations for personalization will drive competitive advantage. Companies that adapt early will lead.",
          correct: true,
          feedback: "✅ Excellent! Shows strategic thinking, industry awareness, and confidence."
        },
        {
          id: 'C',
          text: "Things will probably stay mostly the same.",
          correct: false,
          feedback: "❌ Shows no vision or understanding of market dynamics."
        }
      ]
    },
    {
      id: 2,
      question: "Executive asks: 'What's your leadership philosophy?'",
      options: [
        {
          id: 'A',
          text: "I believe in leading by example, empowering my team to take ownership, and creating psychological safety where people can take risks and learn from failures. I measure success not just by what I deliver, but by how much my team grows.",
          correct: true,
          feedback: "✅ Perfect! Clear philosophy with specific principles and outcomes."
        },
        {
          id: 'B',
          text: "I'm a good leader who gets things done.",
          correct: false,
          feedback: "❌ Vague and self-promotional without substance."
        },
        {
          id: 'C',
          text: "I don't have a philosophy yet since I'm not in leadership.",
          correct: false,
          feedback: "❌ Everyone can demonstrate leadership. Missed opportunity."
        }
      ]
    },
    {
      id: 3,
      question: "Executive asks: 'Tell me about a time you influenced a strategic decision.'",
      options: [
        {
          id: 'A',
          text: "I haven't been involved in strategy.",
          correct: false,
          feedback: "❌ Misses chance to show strategic impact at any level."
        },
        {
          id: 'B',
          text: "I noticed our customer churn was increasing in a specific segment. I analyzed the data, identified that our pricing model wasn't aligned with their usage patterns, and proposed a new tier. I built a business case showing £500K potential revenue recovery, presented to leadership, and it was approved. We saw churn in that segment drop by 60% within 6 months.",
          correct: true,
          feedback: "✅ Excellent! Shows initiative, data-driven thinking, influence, and measurable impact."
        },
        {
          id: 'C',
          text: "I suggested an idea once but it didn't go anywhere.",
          correct: false,
          feedback: "❌ Passive and shows no follow-through or influence."
        }
      ]
    }
  ];

  const presenceElements = [
    { id: 1, element: "Confidence", description: "Speak with conviction, own your expertise" },
    { id: 2, element: "Gravitas", description: "Thoughtful, measured responses with substance" },
    { id: 3, element: "Strategic Thinking", description: "See the big picture and long-term impact" },
    { id: 4, element: "Conciseness", description: "Respect their time, get to the point quickly" },
    { id: 5, element: "Vision", description: "Articulate where you want to go and why" },
    { id: 6, element: "Business Acumen", description: "Speak in terms of ROI, risk, opportunity" }
  ];

  const handleScenarioSelect = (scenarioId, optionId) => {
    const scenario = executiveScenarios.find(s => s.id === scenarioId);
    const option = scenario.options.find(o => o.id === optionId);
    
    setSelectedAnswers({
      ...selectedAnswers,
      [scenarioId]: { optionId, correct: option.correct }
    });

    if (option.correct) {
      setScore(score + 25);
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Executive Presence: Step {currentStep} of 5</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: What is Executive Presence */}
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
                  <Crown className="w-6 h-6 text-purple-600" />
                  What is Executive Presence?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="font-semibold mb-2">Executive presence is the ability to project confidence, credibility, and leadership potential.</p>
                    <p className="text-sm">It's how you command the room, even if you're not the most senior person in it.</p>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  {presenceElements.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item.id * 0.1 }}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                    >
                      <h4 className="font-bold text-purple-900 mb-1">{item.element}</h4>
                      <p className="text-sm text-purple-800">{item.description}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">🎯 What Executives Are Really Assessing</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Can you think strategically, not just tactically?</li>
                    <li>• Do you understand business, not just your function?</li>
                    <li>• Can you influence and inspire others?</li>
                    <li>• Are you ready for greater responsibility?</li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setScore(score + 10);
                    setCurrentStep(2);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Master executive presence! <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Steps 2-4: Executive Scenarios */}
        {currentStep >= 2 && currentStep <= 4 && (
          <motion.div
            key={`step${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {executiveScenarios[currentStep - 2] && (
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Scenario {currentStep - 1} of 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-purple-50 border-purple-200">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <AlertDescription className="text-purple-900 font-semibold">
                      {executiveScenarios[currentStep - 2].question}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {executiveScenarios[currentStep - 2].options.map((option) => {
                      const isSelected = selectedAnswers[executiveScenarios[currentStep - 2].id]?.optionId === option.id;
                      const showFeedback = isSelected;

                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => !selectedAnswers[executiveScenarios[currentStep - 2].id] && handleScenarioSelect(executiveScenarios[currentStep - 2].id, option.id)}
                          disabled={selectedAnswers[executiveScenarios[currentStep - 2].id]}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            !showFeedback
                              ? 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                              : option.correct
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                          } ${selectedAnswers[executiveScenarios[currentStep - 2].id] ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          whileHover={!selectedAnswers[executiveScenarios[currentStep - 2].id] ? { scale: 1.02 } : {}}
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

                  {selectedAnswers[executiveScenarios[currentStep - 2].id] && (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {currentStep < 4 ? "Next Scenario" : "Final Step!"} <ArrowRight className="w-4 h-4 ml-2" />
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
                  Executive Presence Mastered!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900">🎉 Outstanding!</p>
                    <p className="text-sm text-green-800 mt-1">Final Score: {score} points</p>
                  </AlertDescription>
                </Alert>

                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-purple-900 mb-3">👑 Key Takeaways</h4>
                    <ul className="text-sm text-purple-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Think strategically—connect your work to business outcomes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Speak with confidence and gravitas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Show you can influence at all levels</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Be concise—executives value their time</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📝 Before Your Executive Interview:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Research the company's strategic priorities and challenges</li>
                    <li>• Prepare thoughtful questions about vision and direction</li>
                    <li>• Practice speaking in business outcomes, not just features</li>
                    <li>• Have a clear articulation of your leadership philosophy</li>
                    <li>• Prepare stories that show strategic thinking and influence</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}