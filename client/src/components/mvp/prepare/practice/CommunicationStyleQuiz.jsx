import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "An interviewer asks a technical question you don't know. What's the BEST response?",
    options: [
      { id: 'a', text: "Try to answer anyway and hope it sounds right", feedback: "❌ This damages credibility. Interviewers can tell when you're making things up.", correct: false },
      { id: 'b', text: "Say 'I don't know' and stay silent", feedback: "⚠️ Honest, but missed opportunity to show problem-solving and learning agility.", correct: false },
      { id: 'c', text: "Admit you don't know, explain how you'd learn it, and ask if they use it in their work", feedback: "✅ Shows honesty, learning approach, and genuine curiosity. Turns a weakness into engagement.", correct: true },
      { id: 'd', text: "Change the subject to something you do know", feedback: "❌ Appears evasive and suggests poor listening skills.", correct: false }
    ],
    explanation: "The best response demonstrates self-awareness, learning agility, and engagement. It's not about knowing everything—it's about how you handle gaps in knowledge."
  },
  {
    id: 2,
    question: "Your interviewer seems distracted and keeps checking the time. What should you do?",
    options: [
      { id: 'a', text: "Keep talking as planned—they need to hear everything", feedback: "❌ Ignoring social cues shows poor emotional intelligence.", correct: false },
      { id: 'b', text: "Get nervous and rush through your answers", feedback: "❌ Rushing makes answers less clear and shows you're rattled.", correct: false },
      { id: 'c', text: "Acknowledge it: 'I can see we're tight on time. I'll keep this concise.'", feedback: "✅ Shows emotional intelligence, adaptability, and consideration for their time.", correct: true },
      { id: 'd', text: "Ask if they need to end early", feedback: "⚠️ Better than ignoring it, but puts them on the spot. The concise approach is smoother.", correct: false }
    ],
    explanation: "Reading the room and adapting shows high emotional intelligence. Acknowledging constraints without making it awkward demonstrates professionalism."
  },
  {
    id: 3,
    question: "How should you describe a conflict where your teammate was clearly wrong?",
    options: [
      { id: 'a', text: "Honestly explain that they made a mistake and you had to fix it", feedback: "❌ Blaming others is a major red flag, even if accurate.", correct: false },
      { id: 'b', text: "Focus on the situation and your actions without assigning blame", feedback: "✅ Shows maturity, accountability, and focus on solutions rather than fault.", correct: true },
      { id: 'c', text: "Say there was no conflict to avoid looking negative", feedback: "❌ Dishonest and misses chance to show conflict resolution skills.", correct: false },
      { id: 'd', text: "Take all the blame yourself to seem humble", feedback: "❌ Appearing incompetent isn't humility. Be honest about circumstances.", correct: false }
    ],
    explanation: "The way you describe conflicts reveals character. Focus on the situation, your actions, and learnings—not who was right or wrong."
  },
  {
    id: 4,
    question: "The interviewer describes a challenge their team faces. What's your best move?",
    options: [
      { id: 'a', text: "Immediately offer solutions to show your expertise", feedback: "⚠️ Can come across as presumptuous. You don't have full context yet.", correct: false },
      { id: 'b', text: "Just listen and move on", feedback: "❌ Missed opportunity to engage and show interest.", correct: false },
      { id: 'c', text: "Validate their challenge and ask questions to understand it better", feedback: "✅ Shows empathy, curiosity, and genuine engagement. Creates dialogue.", correct: true },
      { id: 'd', text: "Share a similar challenge you faced", feedback: "⚠️ Better than silence, but can seem like you're redirecting to yourself. Ask questions first.", correct: false }
    ],
    explanation: "Great communicators listen actively and show genuine curiosity before offering input. Questions demonstrate engagement more than quick answers."
  },
  {
    id: 5,
    question: "You're asked 'Why do you want this role?' What makes the strongest answer?",
    options: [
      { id: 'a', text: "Focus on salary, benefits, and company reputation", feedback: "❌ Transactional and suggests you'd leave for better pay elsewhere.", correct: false },
      { id: 'b', text: "Say you need a job and this one matches your skills", feedback: "❌ Shows no genuine interest in THIS specific opportunity.", correct: false },
      { id: 'c', text: "Connect the role to your career goals and what excites you about their specific mission/product", feedback: "✅ Shows research, genuine interest, and alignment. Creates a compelling narrative.", correct: true },
      { id: 'd', text: "Describe how desperate you are to leave your current job", feedback: "❌ Major red flag. Never badmouth current employers or appear desperate.", correct: false }
    ],
    explanation: "Strong answers connect your aspirations to their specific opportunity. Show you want THIS role, not just any role."
  }
];

export default function CommunicationStyleQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
    setShowFeedback(true);
    if (option.correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const percentage = (score / QUIZ_QUESTIONS.length) * 100;
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {score} / {QUIZ_QUESTIONS.length}
          </div>
          <div>
            <div className="text-lg font-semibold mb-2">
              {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
            </div>
            <p className="text-gray-600">
              {percentage >= 80 
                ? "You have a strong grasp of effective interview communication!"
                : percentage >= 60
                ? "You're on the right track. Review the feedback to strengthen your skills."
                : "Communication skills improve with practice. Review the explanations and try again!"}
            </p>
          </div>
          <Button onClick={handleReset} className="bg-gradient-to-r from-purple-600 to-blue-600">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Quiz Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
              <span>Score: {score}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedAnswer?.id === option.id;
            const showCorrect = showFeedback && option.correct;
            const showIncorrect = showFeedback && isSelected && !option.correct;

            return (
              <button
                key={option.id}
                onClick={() => !showFeedback && handleAnswerSelect(option)}
                disabled={showFeedback}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  showCorrect
                    ? 'border-green-500 bg-green-50'
                    : showIncorrect
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    showCorrect
                      ? 'border-green-500 bg-green-500'
                      : showIncorrect
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'
                  }`}>
                    {showCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {showIncorrect && <XCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">{option.text}</p>
                    <AnimatePresence>
                      {showFeedback && isSelected && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-gray-700 mt-2"
                        >
                          {option.feedback}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            );
          })}

          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Alert className={selectedAnswer.correct ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
                <AlertDescription className="text-sm">
                  <strong>Why:</strong> {question.explanation}
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}