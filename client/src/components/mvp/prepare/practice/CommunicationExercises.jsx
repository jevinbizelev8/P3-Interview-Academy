import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, Users, MessageSquare, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EXERCISES = [
  {
    id: 1,
    title: "The Clarity Challenge",
    icon: Lightbulb,
    description: "Explain complex concepts simply in 30 seconds",
    prompts: [
      "A technical tool you use regularly",
      "A methodology (Agile, Design Thinking, etc.)",
      "Why your field matters"
    ],
    selfAssessment: [
      "Did you use jargon?",
      "Did you use an analogy or example?",
      "Would a 10-year-old understand it?"
    ]
  },
  {
    id: 2,
    title: "Tone Matching",
    icon: Users,
    description: "Practice responding to different interviewer styles",
    scenarios: [
      {
        title: "Scenario 1: Enthusiastic & Energetic Interviewer",
        question: "How do you match that energy authentically?"
      },
      {
        title: "Scenario 2: Thoughtful & Soft-Spoken Interviewer",
        question: "How do you adjust without mimicking?"
      },
      {
        title: "Scenario 3: Stressed Interviewer",
        question: "How do you acknowledge this with empathy?"
      }
    ]
  },
  {
    id: 3,
    title: "Empathy Statement Practice",
    icon: MessageSquare,
    description: "Turn statements into empathetic responses",
    statements: [
      {
        original: "This project was a disaster. Nothing went according to plan.",
        guidance: "Validate their feeling/concern + bridge to something constructive"
      },
      {
        original: "I'm worried you don't have experience with our tech stack.",
        guidance: "Acknowledge concern + show willingness to learn"
      },
      {
        original: "Our team has been struggling with remote collaboration.",
        guidance: "Show understanding + offer perspective or question"
      }
    ],
    checkpoints: [
      "Did you validate their feeling/concern?",
      "Did you bridge to something constructive?",
      "Did you sound genuine, not formulaic?"
    ]
  },
  {
    id: 4,
    title: "Question Refinement",
    icon: HelpCircle,
    description: "Transform weak questions into compelling ones",
    questions: [
      {
        weak: "What's the culture like?",
        hint: "Be more specific about what aspect of culture interests you"
      },
      {
        weak: "Will I have opportunities to grow?",
        hint: "Ask about specific growth paths or learning opportunities"
      },
      {
        weak: "What does the team do?",
        hint: "Show you've done research and ask about specifics"
      }
    ],
    criteria: [
      "More specific",
      "Shows you've thought about it",
      "Invites a substantive answer",
      "Demonstrates genuine interest"
    ]
  }
];

export default function CommunicationExercises() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [responses, setResponses] = useState({});
  const [showGuidance, setShowGuidance] = useState({});

  const handleResponseChange = (exerciseId, key, value) => {
    setResponses({
      ...responses,
      [`${exerciseId}-${key}`]: value
    });
  };

  const toggleGuidance = (key) => {
    setShowGuidance({
      ...showGuidance,
      [key]: !showGuidance[key]
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle>Communication Skills Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Strengthen your communication skills with these interactive exercises. Practice clarity, tone, empathy, and asking great questions.
          </p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {EXERCISES.map((exercise) => {
              const Icon = exercise.icon;
              return (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedExercise === exercise.id
                      ? 'border-blue-500 bg-white shadow-md'
                      : 'border-blue-200 hover:border-blue-300 bg-white/50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <Icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{exercise.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{exercise.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {selectedExercise === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  The Clarity Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Explain these concepts in 30 seconds to someone with no background. Focus on simplicity and analogies.
                </p>

                {EXERCISES[0].prompts.map((prompt, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="block text-sm font-medium">{idx + 1}. {prompt}</label>
                    <Textarea
                      placeholder="Your 30-second explanation..."
                      value={responses[`1-${idx}`] || ''}
                      onChange={(e) => handleResponseChange(1, idx, e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                ))}

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Self-Assessment Checklist:</p>
                  <div className="space-y-1">
                    {EXERCISES[0].selfAssessment.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedExercise === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Tone Matching
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Practice adapting your communication style to different interviewer personalities. Think about energy level, pacing, and emotional tone.
                </p>

                {EXERCISES[1].scenarios.map((scenario, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="font-medium text-sm text-purple-900">{scenario.title}</p>
                      <p className="text-xs text-purple-700 mt-1">{scenario.question}</p>
                    </div>
                    <Textarea
                      placeholder="How would you respond and adapt your style?"
                      value={responses[`2-${idx}`] || ''}
                      onChange={(e) => handleResponseChange(2, idx, e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                ))}

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-900">
                    <strong>Tip:</strong> The goal isn't to mimic, but to create harmony. Match their energy level whilst staying authentic to yourself.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedExercise === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  Empathy Statement Practice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Transform these statements into empathetic responses. Use the formula: Recognition + Validation + Bridge.
                </p>

                {EXERCISES[2].statements.map((statement, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-sm text-orange-900 font-medium mb-1">Statement:</p>
                      <p className="text-sm text-orange-800 italic">"{statement.original}"</p>
                      <p className="text-xs text-orange-600 mt-2">💡 {statement.guidance}</p>
                    </div>
                    <Textarea
                      placeholder="Your empathetic response..."
                      value={responses[`3-${idx}`] || ''}
                      onChange={(e) => handleResponseChange(3, idx, e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                ))}

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2">Check Yourself:</p>
                  <div className="space-y-1">
                    {EXERCISES[2].checkpoints.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedExercise === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  Question Refinement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Transform weak questions into compelling ones that show research, thoughtfulness, and genuine curiosity.
                </p>

                {EXERCISES[3].questions.map((question, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <p className="text-xs font-semibold text-red-900 mb-1">❌ Weak Question:</p>
                      <p className="text-sm text-red-800">"{question.weak}"</p>
                      <p className="text-xs text-red-600 mt-2">💡 Hint: {question.hint}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs font-semibold text-green-900 mb-1">✅ Your Improved Version:</p>
                      <Textarea
                        placeholder="Write your improved question..."
                        value={responses[`4-${idx}`] || ''}
                        onChange={(e) => handleResponseChange(4, idx, e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                ))}

                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">What Makes Better Questions?</p>
                  <div className="space-y-1">
                    {EXERCISES[3].criteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                        <span>{criterion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}