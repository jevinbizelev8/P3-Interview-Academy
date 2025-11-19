import React, { useState } from "react";
// TODO: Implement AI coaching API endpoint for interactive modules
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Trophy, ArrowRight, ArrowLeft, Lightbulb, Loader2, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ScreeningInterviewGame() {
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [flippedCards, setFlippedCards] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [rapidFireAnswers, setRapidFireAnswers] = useState({});
  const [aiCoaching, setAiCoaching] = useState({});
  const [isGettingCoaching, setIsGettingCoaching] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [reflectionText, setReflectionText] = useState("");

  const recruiterOptions = [
    {
      id: 'A',
      text: "Logs in 5 minutes late, apologises repeatedly, talks about being 'open to anything right now.'",
      correct: false,
      feedback: "❌ Red flags: Late, unfocused, unprepared"
    },
    {
      id: 'B',
      text: "Joins on time, greets politely, summarises their experience clearly, and asks one question about your company's new product.",
      correct: true,
      feedback: "✅ Perfect! Shows professionalism, clarity, and genuine interest"
    },
    {
      id: 'C',
      text: "Joins early, speaks confidently, but talks non-stop for 10 minutes about unrelated projects.",
      correct: false,
      feedback: "❌ Red flag: Poor communication skills, lacks focus"
    }
  ];

  const recruiterCards = [
    { id: 1, hint: "⏰", title: "Professionalism", description: "Joins on time, clear camera, polite greeting" },
    { id: 2, hint: "💼", title: "Basic Qualifications", description: "Relevant experience, clear articulation" },
    { id: 3, hint: "🤝", title: "Cultural Fit", description: "Values align with company, genuine interest" },
    { id: 4, hint: "🗣️", title: "Communication Skills", description: "Speaks clearly, listens well" }
  ];

  const quizQuestions = [
    {
      id: 1,
      question: 'Recruiter asks: "Why this company?" You reply: "Honestly, I\'m open to any opportunity right now."',
      correct: 'red',
      explanation: "🚩 RED FLAG — Sounds desperate or unfocused. Shows no research or genuine interest.",
      betterAnswer: "I'm excited about this company because [specific reason related to company mission, product, or values]."
    },
    {
      id: 2,
      question: 'You say: "I\'m looking for growth and more strategic challenges in my next role."',
      correct: 'green',
      explanation: "✅ GREEN FLAG — Clear, future-oriented, shows ambition and direction."
    },
    {
      id: 3,
      question: "You join the Zoom call from your car or a noisy café.",
      correct: 'red',
      explanation: "🚩 RED FLAG — Unprofessional setting shows lack of preparation.",
      betterAnswer: "Find a quiet, professional space with good lighting and minimal distractions."
    },
    {
      id: 4,
      question: 'You say: "My boss is terrible and micromanages everything. That\'s why I\'m leaving."',
      correct: 'red',
      explanation: "🚩 RED FLAG — Never badmouth previous employers.",
      betterAnswer: "I've learned valuable skills in my current role, and I'm now ready for new challenges that allow me to grow in [specific area]."
    },
    {
      id: 5,
      question: 'You say: "Based on my research, I\'m looking for something in the range of $X-$Y, but I\'m flexible."',
      correct: 'green',
      explanation: "✅ GREEN FLAG — Shows you've done research and are open to discussion."
    }
  ];

  const rapidFireScenarios = [
    {
      id: 1,
      title: "Why are you leaving?",
      weak: "My boss was terrible, so I'm leaving.",
      strong: "I've learned a lot in my current role but am ready for a new environment that challenges me in different ways and aligns better with my career goals."
    },
    {
      id: 2,
      title: "Tell me about yourself",
      weak: "Well, I grew up in London, went to university, and have worked at a few places.",
      strong: "I'm a [role] with [X] years of experience in [industry]. I specialize in [key skills], and recently [specific achievement with metrics]."
    },
    {
      id: 3,
      title: "What are your weaknesses?",
      weak: "I don't really have any weaknesses.",
      strong: "I tend to be very detail-oriented, which sometimes means I spend longer on tasks than necessary. I've been working on this by setting clearer time boundaries."
    }
  ];

  const checklistItems = {
    correct: [
      "Research the company beforehand",
      "Join 2-3 minutes early (not too early!)",
      "Have a clean, professional background",
      "Keep answers concise (under 2 minutes)",
      "Ask 1-2 thoughtful questions",
      "Send a thank-you note within 24 hours"
    ],
    avoid: [
      "Badmouthing previous employers",
      "Being vague about your goals",
      "Appearing desperate or unfocused",
      "Multitasking during the call",
      "Bringing up salary too early",
      "Oversharing personal information"
    ]
  };

  const handleRecruiterSelect = (id, isCorrect) => {
    setSelectedRecruiter(id);
    if (isCorrect) {
      setScore(score + 20);
    }
  };

  const handleCardFlip = (cardId) => {
    if (!flippedCards.includes(cardId)) {
      setFlippedCards([...flippedCards, cardId]);
    }
  };

  const handleQuizAnswer = (questionId, answer) => {
    const question = quizQuestions.find(q => q.id === questionId);
    const isCorrect = answer === question.correct;
    
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: { answer, isCorrect }
    });

    if (isCorrect) {
      setScore(score + 10);
    }
  };

  const handleGetAICoaching = async (scenarioId) => {
    const userAnswer = rapidFireAnswers[scenarioId];
    if (!userAnswer || userAnswer.trim().length < 10) {
      alert("Please write at least a short answer (10+ characters) to get AI coaching.");
      return;
    }

    setIsGettingCoaching(scenarioId);

    try {
      const scenario = rapidFireScenarios.find(s => s.id === scenarioId);

      const response = await fetch('/api/prepare/modules/screening-interview/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: scenario.title,
          userAnswer: userAnswer,
          weakExample: scenario.weak,
          strongExample: scenario.strong,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI coaching');
      }

      setAiCoaching({
        ...aiCoaching,
        [scenarioId]: result.data
      });

      setScore(score + 10);
    } catch (error) {
      console.error("Error getting AI coaching:", error);
      alert("Failed to get AI coaching. Please try again.");
    }

    setIsGettingCoaching(null);
  };

  const handleUseRefinedAnswer = (scenarioId) => {
    const coaching = aiCoaching[scenarioId];
    if (coaching && coaching.refined_answer) {
      setRapidFireAnswers({
        ...rapidFireAnswers,
        [scenarioId]: coaching.refined_answer
      });
      setScore(score + 5);
    }
  };

  const handleChecklistToggle = (item) => {
    if (checkedItems.includes(item)) {
      setCheckedItems(checkedItems.filter(i => i !== item));
    } else {
      setCheckedItems([...checkedItems, item]);
      setScore(score + 5);
    }
  };

  const progress = (currentStep / 6) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Step {currentStep} of 6</span>
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {score} points
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: You're the Recruiter */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🧩 1. Warm-up: "You're the Recruiter" Game</CardTitle>
                <p className="text-gray-600">
                  Flip the perspective! You have 10 screening calls today and 15 minutes per candidate. Your goal: shortlist 3.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription>
                    <p className="text-sm text-blue-900 mb-2">
                      <strong>👋 Scenario:</strong> You're the HR recruiter. Below are 3 candidates. Who would you move to the next round?
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {recruiterOptions.map((option) => {
                    const isSelected = selectedRecruiter === option.id;
                    const showFeedback = selectedRecruiter === option.id;

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleRecruiterSelect(option.id, option.correct)}
                        disabled={selectedRecruiter}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          !showFeedback
                            ? 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                            : option.correct
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                        } ${selectedRecruiter ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        whileHover={!selectedRecruiter ? { scale: 1.02 } : {}}
                        whileTap={!selectedRecruiter ? { scale: 0.98 } : {}}
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

                {selectedRecruiter && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="bg-purple-50 border-purple-200">
                      <Lightbulb className="w-4 h-4 text-purple-600" />
                      <AlertDescription>
                        <p className="font-semibold text-purple-900">🎯 Key Takeaway</p>
                        <p className="text-sm text-purple-800 mt-1">
                          Recruiters look for professionalism, clarity, and genuine interest. First impressions matter!
                        </p>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!selectedRecruiter}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Card Flip Game */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🎴 2. What Recruiters Look For</CardTitle>
                <p className="text-gray-600">
                  Click each card to reveal what recruiters are really assessing!
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {recruiterCards.map((card) => {
                    const isFlipped = flippedCards.includes(card.id);
                    return (
                      <motion.div
                        key={card.id}
                        onClick={() => handleCardFlip(card.id)}
                        className="relative h-40 cursor-pointer"
                        style={{ perspective: '1000px' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div 
                          className="relative w-full h-full transition-transform duration-500"
                          style={{ 
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                          }}
                        >
                          {/* Front of card */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ 
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden'
                            }}
                          >
                            <span className="text-6xl">{card.hint}</span>
                          </div>
                          
                          {/* Back of card */}
                          <div 
                            className="absolute inset-0 bg-white border-2 border-purple-200 rounded-xl p-4 shadow-lg"
                            style={{ 
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)'
                            }}
                          >
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="text-4xl mb-2">{card.hint}</div>
                              <h3 className="font-bold text-purple-900 text-lg mb-2">{card.title}</h3>
                              <p className="text-sm text-gray-600">{card.description}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {flippedCards.length === 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="bg-green-50 border-green-200 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription>
                        <p className="font-semibold">🎉 All cards revealed! +20 bonus points!</p>
                        <p className="text-sm mt-1">These four areas are what every recruiter evaluates. Keep them in mind for every interview!</p>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (flippedCards.length === 4) {
                        setScore(score + 20);
                      }
                      setCurrentStep(currentStep + 1);
                    }}
                    disabled={flippedCards.length < 4}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Quiz */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">🚦 3. Red Flag or Green Flag?</CardTitle>
                <p className="text-gray-600">
                  Test your judgment! Identify whether these scenarios are red flags or green flags.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizQuestions.map((question) => {
                  const userAnswer = quizAnswers[question.id];
                  const showFeedback = !!userAnswer;

                  return (
                    <div key={question.id} className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium">{question.question}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleQuizAnswer(question.id, 'red')}
                          disabled={showFeedback}
                          variant={showFeedback ? (userAnswer.answer === 'red' ? (userAnswer.isCorrect ? 'default' : 'destructive') : 'outline') : 'outline'}
                          className={`h-auto py-4 ${
                            !showFeedback
                              ? 'border-2 border-red-300 hover:bg-red-50'
                              : userAnswer.answer === 'red'
                              ? userAnswer.isCorrect
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                              : 'opacity-50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl">🚩</span>
                            <span className="font-semibold">Red Flag</span>
                          </div>
                        </Button>

                        <Button
                          onClick={() => handleQuizAnswer(question.id, 'green')}
                          disabled={showFeedback}
                          variant={showFeedback ? (userAnswer.answer === 'green' ? (userAnswer.isCorrect ? 'default' : 'destructive') : 'outline') : 'outline'}
                          className={`h-auto py-4 ${
                            !showFeedback
                              ? 'border-2 border-green-300 hover:bg-green-50'
                              : userAnswer.answer === 'green'
                              ? userAnswer.isCorrect
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                              : 'opacity-50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <span className="font-semibold">Green Flag</span>
                          </div>
                        </Button>
                      </div>

                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg border-2 ${
                            userAnswer.isCorrect
                              ? 'bg-green-50 border-green-200'
                              : 'bg-orange-50 border-orange-200'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {userAnswer.isCorrect ? '✅ Correct!' : '❌ Not quite!'}
                          </p>
                          <p className="text-sm">{question.explanation}</p>
                          {question.betterAnswer && (
                            <p className="text-sm mt-2 italic text-gray-700">
                              <strong>Better approach:</strong> {question.betterAnswer}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}

                {Object.keys(quizAnswers).length === quizQuestions.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="bg-purple-50 border-purple-200">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      <AlertDescription>
                        <p className="font-semibold text-purple-900">
                          Quiz Complete! You scored {Object.values(quizAnswers).filter(a => a.isCorrect).length}/{quizQuestions.length}
                        </p>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Rapid Fire Challenge */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">💬 4. Rapid Fire: Say It Better</CardTitle>
                <p className="text-gray-600">
                  Transform weak answers into professional responses. Get AI coaching on your answers!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {rapidFireScenarios.map((scenario) => {
                  const hasAnswer = rapidFireAnswers[scenario.id] && rapidFireAnswers[scenario.id].trim().length > 0;
                  const hasCoaching = aiCoaching[scenario.id];
                  
                  return (
                    <div key={scenario.id} className="space-y-3">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="font-semibold text-orange-900 mb-1">{scenario.title}</p>
                        <p className="text-sm text-orange-800 mb-2">
                          <strong>❌ Weak:</strong> "{scenario.weak}"
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">✅ Your Better Version:</label>
                        <Textarea
                          placeholder="Type your professional response here..."
                          value={rapidFireAnswers[scenario.id] || ''}
                          onChange={(e) => setRapidFireAnswers({...rapidFireAnswers, [scenario.id]: e.target.value})}
                          className="min-h-24"
                          disabled={hasCoaching}
                        />
                      </div>

                      {hasAnswer && !hasCoaching && (
                        <Button
                          onClick={() => handleGetAICoaching(scenario.id)}
                          disabled={isGettingCoaching === scenario.id}
                          variant="outline"
                          className="w-full border-2 border-purple-300 hover:bg-purple-50"
                        >
                          {isGettingCoaching === scenario.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Getting AI Coaching...
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Get AI Coaching
                            </>
                          )}
                        </Button>
                      )}

                      {hasCoaching && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                AI Coaching Results
                              </h4>
                              <Badge className="bg-purple-600 text-white">
                                Score: {hasCoaching.score}/10
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-green-900 mb-1">✅ Strengths:</p>
                                <ul className="text-sm text-green-800 space-y-1">
                                  {hasCoaching.strengths?.map((strength, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span>•</span>
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-orange-50 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-orange-900 mb-1">💡 Improvements:</p>
                                <ul className="text-sm text-orange-800 space-y-1">
                                  {hasCoaching.improvements?.map((improvement, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span>•</span>
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                <p className="text-sm font-semibold text-blue-900 mb-2">✨ Refined Version:</p>
                                <p className="text-sm text-blue-800 leading-relaxed italic">
                                  "{hasCoaching.refined_answer}"
                                </p>
                                <Button
                                  onClick={() => handleUseRefinedAnswer(scenario.id)}
                                  size="sm"
                                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Use This Answer
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setAiCoaching({
                                  ...aiCoaching,
                                  [scenario.id]: null
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Revise My Answer
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {!hasCoaching && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 border border-green-200 rounded-lg p-3"
                        >
                          <p className="text-sm font-semibold text-green-900 mb-1">💡 Model Answer:</p>
                          <p className="text-sm text-green-800">{scenario.strong}</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Checklist */}
        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">✅ 5. How to Stand Out: Checklist</CardTitle>
                <p className="text-gray-600">
                  Interactive checklist! Click items as you learn them. Earn points for each!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-green-900 mb-3 text-lg">✅ DO THESE</h3>
                  <div className="space-y-2">
                    {checklistItems.correct.map((item, index) => {
                      const isChecked = checkedItems.includes(item);
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleChecklistToggle(item)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                            isChecked
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isChecked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className={`text-sm ${isChecked ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                            {item}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-red-900 mb-3 text-lg">❌ AVOID THESE</h3>
                  <div className="space-y-2">
                    {checklistItems.avoid.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-red-50 border-2 border-red-200 flex items-start gap-3"
                      >
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-red-900">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {checkedItems.length === checklistItems.correct.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="bg-green-50 border-green-200">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <AlertDescription>
                        <p className="font-semibold text-green-900">
                          🎉 Checklist Complete! You're ready for screening interviews!
                        </p>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 6: Reflection */}
        {currentStep === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">📝 6. Final Reflection</CardTitle>
                <p className="text-gray-600">
                  Capture your key learnings from this module!
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    What are your top 3 takeaways from this module?
                  </label>
                  <Textarea
                    placeholder="1. ...&#10;2. ...&#10;3. ..."
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                <Alert className="bg-yellow-50 border-yellow-200">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <AlertDescription>
                    <p className="text-sm text-yellow-900">
                      <strong>Pro Tip:</strong> Keep these notes handy and review them before your next screening interview!
                    </p>
                  </AlertDescription>
                </Alert>

                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                  <CardContent className="p-6 text-center">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold mb-2">Module Complete!</h3>
                    <p className="text-gray-700 mb-4">
                      You've earned <strong className="text-purple-700">{score} points</strong> in this module!
                    </p>
                    <Badge className="bg-purple-600 text-white text-lg px-6 py-2">
                      HR Screening Mastery
                    </Badge>
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
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