// New AI-Powered Prepare Module Entry Point
// This replaces the old prepare page with the AI-enhanced version

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Brain, Mic, Globe, Zap, CheckCircle, Play, BarChart3 } from 'lucide-react';

// Import generated images
import studentAICoaching from '@assets/generated_images/Student_AI_interview_coaching_bbfdc2fa.png';
import preparationSteps from '@assets/generated_images/Interview_preparation_steps_guide_19dc5895.png';

// Navigation
import MainNav from '@/components/navigation/main-nav';

// AI Prepare Components
import PrepareAIInterface from '@/components/prepare-ai/PrepareAIInterface';
import SessionSetup from '@/components/prepare-ai/SessionSetup';
import SessionDashboard from '@/components/prepare-ai/SessionDashboard';

// Backend API expects this format
interface BackendSessionConfig {
  jobPosition: string;
  companyName?: string;
  interviewStage: string;
  experienceLevel: 'entry' | 'intermediate' | 'senior' | 'expert';
  preferredLanguage: string;
  voiceEnabled: boolean;
  speechRate: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
  focusAreas: string[];
  questionCategories: string[];
}

export default function Prepare() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'setup' | 'session'>('landing');
  const [currentSession, setCurrentSession] = useState<any>(null);

  const handleStartNewSession = () => {
    setCurrentView('setup');
  };

  const handleCreateSession = (config: BackendSessionConfig) => {
    // Store the session config and move to session view
    setCurrentSession(config);
    setCurrentView('session');
  };

  const handleViewDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setCurrentSession(null);
  };

  // Render different views based on current state
  if (currentView === 'session') {
    return (
      <>
        <MainNav currentModule="prepare" />
        <div className="container mx-auto py-8">
          <PrepareAIInterface 
            onSessionChange={setCurrentSession}
            initialSession={currentSession}
          />
        </div>
      </>
    );
  }

  if (currentView === 'setup') {
    return (
      <>
        <MainNav currentModule="prepare" />
        <div className="container mx-auto py-8">
          <SessionSetup 
            onStartSession={handleCreateSession}
            initialConfig={currentSession}
          />
        </div>
      </>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <>
        <MainNav currentModule="prepare" />
        <div className="container mx-auto py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Your AI Prepare Dashboard</h1>
            <Button variant="outline" onClick={handleBackToLanding}>
              ← Back to Home
            </Button>
          </div>
          <SessionDashboard 
            onStartNewSession={handleStartNewSession}
            onResumeSession={(sessionId) => {
              // Load session and switch to session view
              setCurrentView('session');
            }}
            onViewSession={(sessionId) => {
              // Load session details
              console.log('View session:', sessionId);
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav currentModule="prepare" />
      <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Interview Preparation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the next generation of interview preparation with voice-enabled AI coaching, 
            real-time STAR method evaluation, and cultural awareness for ASEAN markets.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">AI Question Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dynamic questions generated by SeaLion AI, tailored to your job position, 
                experience level, and interview stage.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Mic className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Voice-First Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Practice with natural voice input and text-to-speech question delivery. 
                Experience interviews as they really happen.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">STAR Method Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time evaluation of your responses using the STAR method with 
                detailed feedback and improvement suggestions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">ASEAN Language Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Full support for 10 Southeast Asian languages with cultural context 
                and region-specific interview guidance.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Adaptive Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Questions automatically adjust in difficulty based on your performance, 
                ensuring optimal challenge and learning.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-100">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">Real-time WebSocket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Seamless real-time communication for voice processing, instant feedback, 
                and live session progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" onClick={handleStartNewSession}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Start New Session</h3>
              <p className="text-blue-700">Begin AI-powered interview practice with personalized questions</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer" onClick={handleViewDashboard}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">View Dashboard</h3>
              <p className="text-green-700">Track progress, review sessions, and analyze performance</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900 mb-2">Phase 3 Complete!</h3>
              <p className="text-purple-700">Full AI interview system with voice support ready</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Guide for Students */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-800">
              🎯 Master Your Interview Skills with AI Coaching
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-6">
              <p className="text-blue-700 text-lg">
                Transform your interview confidence with personalized AI coaching designed for students and job seekers.
                Practice anytime, get instant feedback, and land your dream job!
              </p>
              
              <div className="my-8">
                <img 
                  src={studentAICoaching} 
                  alt="Student practicing with AI coach"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 my-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <h4 className="font-bold text-green-800 mb-3 text-lg">✨ What You'll Get</h4>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Real-time feedback on your answers</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>STAR method coaching & scoring</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Voice practice with speech recognition</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Personalized improvement suggestions</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Progress tracking & analytics</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Multi-language support (10+ languages)</li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <h4 className="font-bold text-purple-800 mb-3 text-lg">🚀 Perfect For</h4>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>University students seeking internships</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Fresh graduates entering job market</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Career changers and professionals</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Anyone wanting to improve interview skills</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Non-native speakers practicing in English</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Students preparing for competitive roles</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg">
                <p className="font-bold text-lg mb-2">
                  🎉 Ready to Start Your Journey to Interview Success?
                </p>
                <p className="text-green-50">
                  Join thousands of students and job seekers who've improved their interview confidence with our AI coach.
                  Start practicing today and see immediate improvements in your communication skills!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Use Guide */}
        <Card className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-center text-indigo-800">📝 How to Get Started: Your Path to Interview Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-8 items-center mb-8">
              <div>
                <img 
                  src={preparationSteps} 
                  alt="Step-by-step interview preparation guide"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Set Your Interview Goals</h4>
                    <p className="text-gray-600 text-sm">Choose your target job role, company, and interview type. Our AI will customize questions specifically for your career path.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Practice with AI Coach</h4>
                    <p className="text-gray-600 text-sm">Answer practice questions using voice or text. Get real-time feedback on your communication style and content quality.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Review & Improve</h4>
                    <p className="text-gray-600 text-sm">Study detailed feedback, track your progress, and focus on areas needing improvement. Practice until you feel confident!</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Ace Your Real Interview</h4>
                    <p className="text-gray-600 text-sm">Apply your improved skills in actual interviews with confidence. Use STAR method techniques you've mastered here!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8 p-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white rounded-lg">
              <p className="font-bold text-lg mb-2">
                🏆 Ready to Transform Your Interview Skills?
              </p>
              <p className="text-yellow-50 mb-4">
                Join thousands of students who've landed their dream jobs after practicing with our AI coach. Start your journey to interview confidence today!
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={handleStartNewSession} className="bg-white text-orange-600 hover:bg-orange-50 font-semibold">
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning Now
                </Button>
                <Button variant="outline" onClick={handleViewDashboard} className="border-white text-white hover:bg-white hover:text-orange-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View My Progress
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}