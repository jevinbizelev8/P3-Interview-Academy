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

interface SessionConfig {
  jobTitle: string;
  companyName: string;
  interviewStage: string;
  language: string;
  voiceEnabled: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  industry?: string;
}

export default function Prepare() {
  const [currentView, setCurrentView] = useState<'landing' | 'setup' | 'session'>('landing');
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [sessionConfig, setSessionConfig] = useState<any>(null);

  const handleStartNewSession = () => {
    setCurrentView('setup');
  };

  const handleCreateSession = (config: SessionConfig) => {
    // Store the session configuration to pass to PrepareAIInterface
    setSessionConfig(config);
    setCurrentView('session');
  };

  const handleViewDashboard = () => {
    // Redirect to Perform module for dashboard functionality
    window.location.href = '/perform';
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
            sessionConfig={sessionConfig}
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

        {/* STAR Framework Guide */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Understanding STAR Method Evaluation
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Learn how our AI coaches assess your interview responses using the proven STAR framework
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* STAR Framework Explanation */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">The STAR Method</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">S</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Situation</div>
                      <div className="text-xs text-gray-600">Set the context and background</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-green-700">T</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Task</div>
                      <div className="text-xs text-gray-600">Explain your responsibility or challenge</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-amber-700">A</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Action</div>
                      <div className="text-xs text-gray-600">Describe the specific steps you took</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-purple-700">R</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Result</div>
                      <div className="text-xs text-gray-600">Share the positive outcomes achieved</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Criteria */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Scoring Criteria (1-5 Scale)</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Excellent (4.5-5.0)</span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Outstanding</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-2">
                    Complete STAR structure with compelling details, quantified results, and clear impact
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Good (3.5-4.4)</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Strong</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-2">
                    Well-structured response covering most STAR elements with good examples
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Average (2.5-3.4)</span>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Developing</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-2">
                    Basic structure present but missing key details or clear outcomes
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Needs Work (1.0-2.4)</span>
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Improving</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-2">
                    Incomplete structure, vague details, or unclear connection to question
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start space-x-3">
                <Bot className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-indigo-900 mb-1">Pro Tip</div>
                  <div className="text-xs text-indigo-700">
                    Our AI coaches provide real-time feedback on each STAR component, helping you improve your storytelling and achieve higher scores. 
                    Practice with specific examples from your experience to build confidence and clarity.
                  </div>
                </div>
              </div>
            </div>

            {/* Start New Session Button */}
            <div className="mt-6 text-center">
              <Button 
                size="lg" 
                onClick={handleStartNewSession}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Start New Practice Session
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Begin your AI-powered interview preparation with personalized questions
              </p>
            </div>
          </CardContent>
        </Card>



      </div>
    </div>
    </>
  );
}