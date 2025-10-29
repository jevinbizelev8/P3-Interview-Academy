
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, CheckCircle2, XCircle, User, PhoneCall, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "@/utils";
import { calculateSimulationXP, awardXP, calculateReadinessScore, updateStreak, incrementSimulationCount } from "../utils/scoring";

const STAGE_QUESTION_POOLS = {
  hr_screening: [
    "Could you tell me a bit about your current role and why you're looking for a change?",
    "What initially attracted you to this company and this specific role?",
    "What would you consider your biggest career achievement to date?",
    "What is a weakness or area for development that you've been actively working on?",
    "Where do you see yourself in the next three to five years?",
    "Why are you leaving your current position?",
    "What do you know about our company and why do you want to work here?",
    "What are your salary expectations for this role?",
    "Tell me about a time you faced a significant challenge at work.",
    "How would your current manager describe you?",
    "What motivates you in your career?",
    "Describe your ideal work environment.",
    "What are your career goals for the next 3-5 years?",
    "How do you handle work-life balance?",
    "What makes you a good fit for this role?"
  ],
  functional_team: [
    "Describe a time you had a disagreement with a teammate. How did you resolve it?",
    "What role do you typically take on when you're working in a new team?",
    "Give an example of communicating complex technical information to a non-technical audience.",
    "Describe a situation where a project was failing. How did you collaborate to turn it around?",
    "How do you handle a situation where a team member is not pulling their weight?",
    "Tell me about a time you had to work with a difficult colleague.",
    "How do you approach giving feedback to peers?",
    "Describe a successful team project you were part of.",
    "How do you handle conflicting priorities within a team?",
    "Tell me about a time you had to adapt your communication style.",
    "Give an example of when you helped a struggling team member.",
    "How do you build relationships with new team members?",
    "Describe a time when team dynamics affected project outcomes.",
    "How do you contribute to a positive team culture?",
    "Tell me about navigating a cross-functional project."
  ],
  hiring_manager: [
    "Walk me through a project that demonstrates your ability to deliver results.",
    "What are your top three priorities in the first 90 days of this role?",
    "Tell me about a time you missed a key performance objective. What did you learn?",
    "Give an example of a time you proactively identified a problem and developed a solution without being asked.",
    "How do you measure success and performance in a position like this?",
    "Describe a time you had to make a difficult decision with limited information.",
    "How do you prioritize competing demands?",
    "Tell me about a time you exceeded expectations.",
    "Describe your approach to goal-setting and planning.",
    "How do you handle pressure and tight deadlines?",
    "Give an example of when you took ownership of a problem.",
    "How would you approach the challenges in this role?",
    "Tell me about a time you had to influence without authority.",
    "What's your approach to continuous improvement?",
    "Describe a time you had to pivot strategy mid-project."
  ],
  sme_technical: [
    "Explain a technical concept you've recently applied and how it delivered business value.",
    "Walk us through your process for troubleshooting a critical system failure.",
    "Describe a difficult technical problem you solved that required unconventional thinking.",
    "Tell us about a significant technical recommendation you made that impacted the product.",
    "How do you balance the need for speed and technical excellence in your work?",
    "Describe your approach to code review and quality assurance.",
    "How do you stay current with emerging technologies?",
    "Tell me about a time you had to explain a technical decision to stakeholders.",
    "Describe a technical debt situation and how you addressed it.",
    "How do you approach system architecture decisions?",
    "Tell me about optimizing performance in a critical system.",
    "Describe your approach to testing and validation.",
    "How do you handle legacy code or systems?",
    "Tell me about a time you had to learn a new technology quickly.",
    "Describe your approach to technical documentation."
  ],
  executive_final: [
    "Where do you see our company's biggest opportunity for growth in the next three years?",
    "Describe a strategic pivot or major change initiative you successfully led.",
    "How do you ensure your team's tactical goals support the company's broader strategy?",
    "Tell us about a time you had to make a financially sound but unpopular decision.",
    "What legacy would you hope to leave in this role after five years?",
    "How do you approach building and scaling teams?",
    "Describe your leadership philosophy.",
    "Tell me about navigating organizational change.",
    "How do you balance short-term results with long-term vision?",
    "Describe a time you had to manage stakeholder expectations.",
    "How do you make strategic decisions with incomplete data?",
    "Tell me about building alignment across different functions.",
    "What's your approach to innovation and risk-taking?",
    "How do you develop and mentor future leaders?",
    "Describe your approach to company culture and values."
  ]
};

export default function SimulationInterface({ config, onComplete }) {
  const [conversation, setConversation] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0); // Tracks how many questions have been asked
  const [targetQuestions, setTargetQuestions] = useState(0); // Total questions for this specific interview (5-8)
  const [askedQuestions, setAskedQuestions] = useState([]); // List of questions already asked

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setCurrentTranscript(transcript);
        
        // If we got a final result, send it
        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal && transcript.trim()) {
          // It's important to stop recognition here if we're processing a final result
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          setIsListening(false);
          sendVoiceMessage(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        // Only process if we were actively listening AND a final transcript wasn't already handled by onresult
        if (isListening && currentTranscript.trim()) {
          sendVoiceMessage(currentTranscript);
        }
        setIsListening(false); // Ensure listening state is off when recognition ends
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          setRecognitionError('No speech detected. Please speak clearly into your microphone.');
          // Auto-restart after a moment if still in listening mode
          setTimeout(() => {
            if (isListening) { // Check if user hasn't explicitly stopped listening
              setRecognitionError(null); // Clear previous error before restarting
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.start();
                }
              } catch (e) {
                console.error('Failed to restart recognition after no-speech:', e);
                setRecognitionError(`Failed to restart microphone: ${e.message}. Please try again.`);
                setIsListening(false); // Definitely stop if restart fails
              }
            }
          }, 500); // Give a small pause before trying again
        } else if (event.error === 'audio-capture') {
          setRecognitionError('Microphone not found. Please check your microphone connection and permissions.');
          setIsListening(false);
        } else if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission denied. Please allow microphone access in your browser settings.');
          setIsListening(false);
        } else if (event.error === 'aborted') {
          // Silently handle aborted errors (e.g., user stopped recognition manually)
          setIsListening(false);
        } else {
          setRecognitionError(`Error: ${event.error}. Please try again.`);
          setIsListening(false);
        }
      };

      recognitionRef.current.onstart = () => {
        setRecognitionError(null); // Clear any previous error when recognition starts successfully
        setIsListening(true); // Explicitly set listening to true on start
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.speechSynthesis.cancel(); // Stop any ongoing speech when component unmounts
    };
  }, [isListening]); // Dependency on isListening to ensure `onend` and `onerror` are correctly re-bound if `isListening` changes outside this effect

  useEffect(() => {
    if (interviewStarted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endSimulationEarly();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewStarted, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRandomQuestion = () => {
    const availableQuestions = STAGE_QUESTION_POOLS[config.stage].filter(
      q => !askedQuestions.includes(q)
    );
    
    if (availableQuestions.length === 0) {
      // If all questions from the pool have been asked, we can either repeat or signal completion
      // For now, let's signal no more unique questions.
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    setAskedQuestions(prev => [...prev, selectedQuestion]); // Add to asked questions
    return selectedQuestion;
  };

  const startInterview = async () => {
    // Randomly determine 5-8 questions for this interview
    const numQuestions = Math.floor(Math.random() * 4) + 5; // 5 to 8 questions
    setTargetQuestions(numQuestions);
    
    setInterviewStarted(true);
    setIsAIThinking(true);
    try {
      const firstQuestion = getRandomQuestion();
      
      if (!firstQuestion) {
        throw new Error("No questions available for this stage.");
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are conducting a ${config.stage.replace(/_/g, ' ')} interview for ${config.jobTitle}${config.companyName ? ` at ${config.companyName}` : ''}. 
Start with a warm, natural greeting, then ask this question: "${firstQuestion}"
Be conversational and professional, like a real interviewer. Keep your response natural and under 3 sentences.`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" }
          },
          required: ["message"]
        }
      });

      if (!result || !result.message) {
        throw new Error("Invalid response from AI");
      }

      setConversation([{
        role: "interviewer",
        message: result.message,
        timestamp: new Date().toISOString(),
        question: firstQuestion // Store the specific question asked from the pool
      }]);
      setQuestionCount(1); // Increment count for the first question
      
      // Speak the question
      speakText(result.message);
    } catch (error) {
      console.error("Error starting simulation:", error);
      alert(`Failed to start simulation: ${error.message || 'Network error'}. Please check your connection and try again.`);
      onComplete();
    } finally {
      setIsAIThinking(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error', event);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use a modern browser like Chrome.');
      return;
    }

    if (isListening) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        // setIsListening(false) will be set by onend or onerror
      } catch (e) {
        console.error('Error stopping recognition:', e);
        setRecognitionError(`Failed to stop microphone: ${e.message}. Please try again.`);
        setIsListening(false);
      }
    } else {
      setCurrentTranscript("");
      setRecognitionError(null);
      
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
        // onstart will set setIsListening(true) and clear recognitionError
      } catch (e) {
        console.error('Error starting recognition:', e);
        setRecognitionError(`Failed to start microphone: ${e.message}. Please try again.`);
        setIsListening(false); // Ensure listening state is off if start fails
      }
    }
  };

  const sendVoiceMessage = async (transcript) => {
    if (!transcript.trim()) return;

    const userMessage = {
      role: "candidate",
      message: transcript,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentTranscript("");
    setIsAIThinking(true);

    try {
      const conversationHistory = [...conversation, userMessage]
        .map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.message}`)
        .join('\n');

      // Check if we should ask another question or wrap up
      if (questionCount < targetQuestions) {
        const nextQuestion = getRandomQuestion();
        
        // If we ran out of unique questions before hitting targetQuestions
        if (!nextQuestion) {
          await completeSimulation([...conversation, userMessage]);
          return;
        }

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You're conducting a natural, conversational ${config.stage.replace(/_/g, ' ')} interview. The candidate just answered. 

Previous conversation:
${conversationHistory}

Based on their response, either:
1. Ask a brief follow-up question to dig deeper into what they just said (if their answer needs clarification or more detail), OR
2. Acknowledge their answer briefly and transition naturally to this question: "${nextQuestion}"

Be conversational, professional, and human-like. Keep your response natural and under 3 sentences. Don't be robotic or formulaic.`,
          response_json_schema: {
            type: "object",
            properties: {
              message: { type: "string" }
            },
            required: ["message"]
          }
        });

        if (!result || !result.message) {
          throw new Error("Invalid response from AI");
        }

        setConversation(prev => [...prev, {
          role: "interviewer",
          message: result.message,
          timestamp: new Date().toISOString(),
          question: nextQuestion // Store the specific question asked from the pool
        }]);
        setQuestionCount(prev => prev + 1);
        
        speakText(result.message);
      } else {
        // Interview complete after reaching targetQuestions
        await completeSimulation([...conversation, userMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`Failed to process your response: ${error.message || 'Network error'}. Please try again.`);
      setConversation(prev => prev.slice(0, -1)); // Revert the last user message if AI fails
    } finally {
      setIsAIThinking(false);
    }
  };

  const endSimulationEarly = async () => {
    if (conversation.length < 2) { // At least one interviewer message and one candidate message
      alert('Please answer at least one question before ending the simulation.');
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    await completeSimulation(conversation);
  };

  const completeSimulation = async (finalConversation) => {
    setIsAIThinking(true);
    try {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      const subscription = subs[0];

      if (!subscription || subscription.current_credits < 15) { // Updated credit check
        alert('Insufficient credits! You need 15 credits to complete a simulation. Please purchase more credits or upgrade your plan.'); // Updated alert message
        setIsAIThinking(false);
        return;
      }

      const conversationText = finalConversation
        .map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.message}`)
        .join('\n\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Evaluate this ${config.stage.replace(/_/g, ' ')} interview for ${config.jobTitle}${config.companyName ? ` at ${config.companyName}` : ''}.

Full conversation transcript:
${conversationText}

Provide detailed scores (0-100) for each criterion based on the assessment rubric:

1. **Relevance of Response (15%)**: Direct, focused answers without digressions
2. **Structured using STAR Method (15%)**: Logical flow with Situation, Task, Action, Result
3. **Specific Evidence Usage (15%)**: Concrete examples with measurable data
4. **Aligned with Role (15%)**: Skills match job requirements, shows enthusiasm
5. **Outcome-Oriented (15%)**: Emphasizes measurable results and business impact
6. **Communication Skills (10%)**: Clear, confident, professional delivery
7. **Problem-Solving / Critical Thinking (10%)**: Analytical thinking and creative solutions
8. **Cultural Fit / Values Alignment (5%)**: Compatibility with company culture
9. **Learning Agility / Adaptability (5%)**: Ability to learn and adapt quickly

For each score, use this scale:
- Poor (1-40): Major deficiencies
- Average (41-70): Some strengths, room for improvement
- Great (71-100): Excellent performance

Provide:
- Individual scores for all 9 criteria
- Weighted overall score
- 3-5 key strengths
- 3-5 specific improvement areas
- Comprehensive feedback
- 2-3 model answer examples with explanations`,
        response_json_schema: {
          type: "object",
          properties: {
            relevance_score: { type: "number" },
            star_structure_score: { type: "number" },
            specific_evidence_score: { type: "number" },
            role_alignment_score: { type: "number" },
            outcome_oriented_score: { type: "number" },
            communication_score: { type: "number" },
            problem_solving_score: { type: "number" },
            cultural_fit_score: { type: "number" },
            learning_agility_score: { type: "number" },
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvement_areas: { type: "array", items: { type: "string" } },
            ai_feedback: { type: "string" },
            model_answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  your_response: { type: "string" },
                  model_answer: { type: "string" },
                  why_better: { type: "string" }
                },
                required: ["question", "your_response", "model_answer", "why_better"]
              }
            }
          },
          required: ["relevance_score", "star_structure_score", "specific_evidence_score", "role_alignment_score", "outcome_oriented_score", "communication_score", "problem_solving_score", "cultural_fit_score", "learning_agility_score", "overall_score", "strengths", "improvement_areas", "ai_feedback", "model_answers"]
        }
      });

      if (!result || typeof result.overall_score !== 'number') {
        throw new Error("Invalid analysis response");
      }

      const simulation = await base44.entities.InterviewSimulation.create({
        stage: config.stage,
        job_title: config.jobTitle,
        company_name: config.companyName || null,
        resume_id: config.resumeId || null,
        conversation: finalConversation,
        duration_minutes: Math.round((600 - timeRemaining) / 60),
        relevance_score: result.relevance_score,
        star_structure_score: result.star_structure_score,
        specific_evidence_score: result.specific_evidence_score,
        role_alignment_score: result.role_alignment_score,
        outcome_oriented_score: result.outcome_oriented_score,
        communication_score: result.communication_score,
        problem_solving_score: result.problem_solving_score,
        cultural_fit_score: result.cultural_fit_score,
        learning_agility_score: result.learning_agility_score,
        overall_score: result.overall_score,
        strengths: result.strengths,
        improvement_areas: result.improvement_areas,
        ai_feedback: result.ai_feedback,
        model_answers: result.model_answers || [],
        completed: true
      });

      // Deduct 15 credits
      const newBalance = subscription.current_credits - 15; // Updated credit deduction
      await base44.entities.Subscription.update(subscription.id, {
        current_credits: newBalance
      });

      await base44.entities.CreditLedger.create({
        user_id: user.id,
        transaction_type: "consumption",
        credits_amount: -15, // Updated credit ledger entry
        balance_after: newBalance,
        feature_used: "AI Interview Simulation",
        description: `${config.stage.replace(/_/g, ' ')} simulation for ${config.jobTitle}`
      });

      // Award XP based on simulation performance
      const simulationXP = calculateSimulationXP(config.stage, result.overall_score);
      await awardXP(user.id, simulationXP, `Completed ${config.stage} simulation`, simulation.id);

      // Update streak
      await updateStreak(user.id);

      // Increment simulation count
      await incrementSimulationCount(user.id);

      // Recalculate readiness score
      await calculateReadinessScore(user.id);

      setAnalysis(result);
      setIsComplete(true);
      
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['creditHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    } catch (error) {
      console.error("Error completing simulation:", error);
      alert(`Failed to complete simulation: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsAIThinking(false);
    }
  };

  if (isComplete && analysis) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-none shadow-2xl mb-6 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl mb-2">Interview Complete!</CardTitle>
                <p className="text-gray-600">Here's your comprehensive performance assessment</p>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
                      <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {Math.round(analysis.overall_score)}
                      </p>
                      <p className="text-gray-600 font-semibold mt-2">Overall Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                    {[
                      { label: "Relevance", score: analysis.relevance_score, weight: "15%" },
                      { label: "STAR Structure", score: analysis.star_structure_score, weight: "15%" },
                      { label: "Evidence", score: analysis.specific_evidence_score, weight: "15%" },
                      { label: "Role Fit", score: analysis.role_alignment_score, weight: "15%" },
                      { label: "Outcomes", score: analysis.outcome_oriented_score, weight: "15%" },
                      { label: "Communication", score: analysis.communication_score, weight: "10%" },
                      { label: "Problem-Solving", score: analysis.problem_solving_score, weight: "10%" },
                      { label: "Cultural Fit", score: analysis.cultural_fit_score, weight: "5%" },
                      { label: "Adaptability", score: analysis.learning_agility_score, weight: "5%" }
                    ].map((metric) => (
                      <div key={metric.label} className="text-center p-3 bg-white rounded-xl shadow-sm">
                        <p className="text-2xl font-bold text-purple-700">{Math.round(metric.score)}</p>
                        <p className="text-xs text-gray-600 mt-1 font-medium">{metric.label}</p>
                        <p className="text-xs text-gray-400">{metric.weight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {analysis.strengths?.length > 0 && (
                    <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                      <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2 text-lg">
                        <CheckCircle2 className="w-5 h-5" />
                        Your Strengths
                      </h3>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-green-800 flex items-start gap-2 leading-relaxed">
                            <span className="text-green-600 mt-1 font-bold">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.improvement_areas?.length > 0 && (
                    <div className="p-5 bg-orange-50 rounded-xl border-2 border-orange-200">
                      <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-lg">
                        <XCircle className="w-5 h-5" />
                        Areas to Improve
                      </h3>
                      <ul className="space-y-2">
                        {analysis.improvement_areas.map((area, index) => (
                          <li key={index} className="text-sm text-orange-800 flex items-start gap-2 leading-relaxed">
                            <span className="text-orange-600 mt-1 font-bold">→</span>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-5 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-3 text-lg">Detailed AI Feedback</h3>
                    <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-line">{analysis.ai_feedback}</p>
                  </div>

                  {analysis.model_answers?.length > 0 && (
                    <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <h3 className="font-bold text-blue-900 mb-4 text-lg">Model Answers - How to Improve</h3>
                      <div className="space-y-4">
                        {analysis.model_answers.map((answer, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="font-semibold text-gray-900 mb-3">Q: {answer.question}</p>
                            
                            <div className="mb-3">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Response:</span>
                              <p className="text-sm text-gray-700 italic mt-1 bg-gray-50 p-3 rounded">{answer.your_response}</p>
                            </div>
                            
                            <div className="mb-3">
                              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Model Answer (STAR):</span>
                              <p className="text-sm text-green-700 mt-1 bg-green-50 p-3 rounded font-medium">{answer.model_answer}</p>
                            </div>
                            
                            <div className="bg-blue-50 p-3 rounded">
                              <span className="text-xs font-bold text-blue-700">Why This is Better:</span>
                              <p className="text-xs text-blue-600 mt-1">{answer.why_better}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={onComplete}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    size="lg"
                  >
                    Back to Practice
                  </Button>
                  <Button
                    onClick={() => window.location.href = createPageUrl("Practice") + "?openReflection=true"}
                    variant="outline"
                    className="flex-1 border-2 border-purple-600 text-purple-700 hover:bg-purple-50"
                    size="lg"
                  >
                    Open Reflection Journal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentInterviewerMessage = conversation.findLast(msg => msg.role === 'interviewer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {config.jobTitle} - {config.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          <div className="text-2xl font-bold text-purple-700">
            Time remaining: {formatTime(timeRemaining)}
          </div>
          {interviewStarted && (
            <Button
              onClick={endSimulationEarly}
              variant="destructive"
              size="sm"
              className="mt-2"
            >
              End Interview
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-gray-300 shadow-xl overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                <User className="w-16 h-16 text-white" />
              </div>
              {isSpeaking && (
                <div className="absolute bottom-4 left-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-8 bg-green-500 rounded animate-pulse"></div>
                    <div className="w-2 h-12 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-6 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-4 text-center">
              <p className="font-bold text-lg">AI Interviewer</p>
              <Badge className="bg-blue-600 text-white mt-1">
                {config.companyName || 'Company'}
              </Badge>
            </div>
          </Card>

          <Card className="border-2 border-purple-300 shadow-xl overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-5xl shadow-2xl">
                You
              </div>
              {isListening && (
                <div className="absolute bottom-4 left-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-8 bg-red-500 rounded animate-pulse"></div>
                    <div className="w-2 h-12 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-4 text-center">
              <p className="font-bold text-lg">You</p>
              <Badge variant="outline" className="mt-1">Candidate</Badge>
            </div>
          </Card>
        </div>

        {!interviewStarted ? (
          <div className="flex justify-center">
            <Button
              onClick={startInterview}
              disabled={isAIThinking}
              className="w-32 h-32 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-2xl"
            >
              {isAIThinking ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : (
                <div className="flex flex-col items-center">
                  <PhoneCall className="w-12 h-12 text-white mb-2" />
                  <span className="text-white font-bold">Start</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {recognitionError && (
              <Alert className="max-w-2xl bg-red-50 border-red-200">
                <AlertDescription className="text-red-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {recognitionError}
                </AlertDescription>
              </Alert>
            )}

            {currentTranscript && !recognitionError && (
              <Alert className="max-w-2xl bg-purple-50 border-purple-200">
                <AlertDescription className="text-purple-900">
                  <strong>You're saying:</strong> {currentTranscript}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={toggleVoiceInput}
              disabled={isAIThinking || isSpeaking}
              className={`w-24 h-24 rounded-full ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              } shadow-2xl transition-all`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </Button>

            <div className="text-center max-w-md">
              {isAIThinking ? (
                <p className="text-gray-600 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI interviewer is thinking...
                </p>
              ) : isSpeaking ? (
                <p className="text-gray-600">AI interviewer is speaking...</p>
              ) : isListening ? (
                <div>
                  <p className="text-red-600 font-bold text-lg mb-2">🎤 Listening...</p>
                  <p className="text-sm text-gray-600">Speak clearly, then click the microphone to submit your response.</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-lg mb-2">Click the microphone to respond</p>
                  <p className="text-sm text-gray-500">Have a natural conversation with the AI interviewer</p>
                </div>
              )}
            </div>

            {currentInterviewerMessage && (
              <Card className="max-w-3xl w-full bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-900 mb-2
                  text-center">Current Question</h3>
                  <p className="text-blue-800 text-center leading-relaxed">
                    {currentInterviewerMessage.message}
                  </p>
                  {targetQuestions > 0 && (
                    <>
                      <Progress 
                        value={(questionCount / targetQuestions) * 100} 
                        className="mt-4 h-2"
                      />
                      <p className="text-xs text-center text-gray-600 mt-2">
                        Question {questionCount} of {targetQuestions}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
