import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Target,
  Users,
  TrendingUp,
  Lightbulb,
  Clock,
  Award,
  RefreshCw,
  BookOpen,
  Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface StarTrainerProps {
  preparationSessionId?: string;
}

interface StarPracticeSession {
  id: string;
  scenario: string;
  userResponse: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  aiAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    overall: string;
  };
  scores?: {
    situation: number;
    task: number;
    action: number;
    result: number;
    overall: number;
  };
  feedback?: string;
  suggestions?: string[];
  status: 'draft' | 'completed';
  language: string;
  completedAt?: Date;
}

const starSteps = [
  {
    key: 'situation',
    title: 'Situation',
    icon: Target,
    color: 'bg-blue-500',
    description: 'Set the scene and provide context',
    tips: [
      'Be specific about when and where this happened',
      'Include relevant background information',
      'Keep it concise but clear',
      'Choose a situation relevant to the job'
    ],
    placeholder: 'Describe the situation or challenge you faced. When and where did this happen?'
  },
  {
    key: 'task',
    title: 'Task',
    icon: Users,
    color: 'bg-green-500',
    description: 'Explain what needed to be accomplished',
    tips: [
      'Clarify your role and responsibilities',
      'Explain what was at stake',
      'Make your objective clear',
      'Show why this was important'
    ],
    placeholder: 'What was your responsibility? What needed to be accomplished or what was the goal?'
  },
  {
    key: 'action',
    title: 'Action',
    icon: TrendingUp,
    color: 'bg-purple-500',
    description: 'Detail the steps you took',
    tips: [
      'Focus on what YOU did specifically',
      'Explain your thought process',
      'Show problem-solving skills',
      'Demonstrate relevant competencies'
    ],
    placeholder: 'What specific actions did you take? Focus on your individual contribution and decision-making.'
  },
  {
    key: 'result',
    title: 'Result',
    icon: Award,
    color: 'bg-orange-500',
    description: 'Share the outcomes and lessons learned',
    tips: [
      'Quantify results when possible',
      'Explain the positive impact',
      'Include lessons learned',
      'Connect to relevant skills'
    ],
    placeholder: 'What was the outcome? What did you achieve or learn? Use numbers/metrics if possible.'
  }
];

const practiceScenarios = [
  {
    id: 'leadership-challenge',
    title: 'Leadership Challenge',
    scenario: 'Tell me about a time when you had to lead a team through a difficult or challenging situation.',
    difficulty: 'intermediate',
    category: 'Leadership'
  },
  {
    id: 'conflict-resolution',
    title: 'Conflict Resolution',
    scenario: 'Describe a situation where you had to resolve a conflict between team members or stakeholders.',
    difficulty: 'advanced',
    category: 'Communication'
  },
  {
    id: 'problem-solving',
    title: 'Creative Problem Solving',
    scenario: 'Give me an example of a time when you had to think creatively to solve a complex problem.',
    difficulty: 'intermediate',
    category: 'Problem Solving'
  },
  {
    id: 'adaptability',
    title: 'Adaptability',
    scenario: 'Tell me about a time when you had to adapt quickly to significant changes in your work environment.',
    difficulty: 'beginner',
    category: 'Adaptability'
  },
  {
    id: 'initiative',
    title: 'Taking Initiative',
    scenario: 'Describe a situation where you identified an opportunity for improvement and took action.',
    difficulty: 'intermediate',
    category: 'Initiative'
  },
  {
    id: 'failure-learning',
    title: 'Learning from Failure',
    scenario: 'Tell me about a time when something didn\'t go as planned and what you learned from it.',
    difficulty: 'advanced',
    category: 'Growth Mindset'
  }
];

export default function StarMethodTrainer({ preparationSessionId }: StarTrainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(practiceScenarios[0]);
  const [starResponse, setStarResponse] = useState({
    situation: '',
    task: '',
    action: '',
    result: ''
  });
  const [isTraining, setIsTraining] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's STAR practice sessions
  const { data: sessions = [], isLoading } = useQuery<StarPracticeSession[]>({
    queryKey: ['/api/prepare/star-practice', preparationSessionId],
    queryFn: async () => {
      const params = preparationSessionId ? `?preparationSessionId=${preparationSessionId}` : '';
      const response = await apiRequest('GET', `/api/prepare/star-practice${params}`);
      return response.json();
    }
  });

  // Create new STAR practice session
  const createSessionMutation = useMutation({
    mutationFn: async (data: { scenario: string; preparationSessionId?: string }) => {
      const response = await apiRequest('POST', '/api/prepare/star-practice', data);
      return response.json();
    },
    onSuccess: (session: StarPracticeSession) => {
      setCurrentSessionId(session.id);
      setIsTraining(true);
    }
  });

  // Submit STAR response for analysis
  const submitResponseMutation = useMutation({
    mutationFn: async (data: { sessionId: string; starResponse: typeof starResponse }) => {
      const response = await apiRequest('POST', `/api/prepare/star-practice/${data.sessionId}/submit`, data.starResponse);
      return response.json();
    },
    onSuccess: (session: StarPracticeSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prepare/star-practice'] });
      toast({
        title: "Analysis Complete",
        description: "Your STAR response has been analyzed. Check the feedback below!"
      });
      setIsTraining(false);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive"
      });
    }
  });

  const startNewSession = async (scenario: typeof practiceScenarios[0]) => {
    setSelectedScenario(scenario);
    setStarResponse({ situation: '', task: '', action: '', result: '' });
    setCurrentStep(0);
    
    try {
      await createSessionMutation.mutateAsync({
        scenario: scenario.scenario,
        preparationSessionId
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleInputChange = (step: string, value: string) => {
    setStarResponse(prev => ({
      ...prev,
      [step]: value
    }));
  };

  const handleSubmit = async () => {
    if (!currentSessionId) return;
    
    const isComplete = Object.values(starResponse).every(value => value.trim().length > 0);
    if (!isComplete) {
      toast({
        title: "Incomplete Response",
        description: "Please fill in all STAR components before submitting.",
        variant: "destructive"
      });
      return;
    }

    await submitResponseMutation.mutateAsync({
      sessionId: currentSessionId,
      starResponse
    });
  };

  const currentStepData = starSteps[currentStep];
  const isCurrentStepComplete = starResponse[currentStepData.key as keyof typeof starResponse].trim().length > 0;
  const completedSteps = starSteps.filter(step => 
    starResponse[step.key as keyof typeof starResponse].trim().length > 0
  ).length;
  const progress = (completedSteps / starSteps.length) * 100;

  // Find the latest completed session for this scenario
  const latestSession = sessions
    .filter(s => s.scenario === selectedScenario.scenario && s.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];

  const ScoreCard = ({ label, score, maxScore = 5 }: { label: string; score: number; maxScore?: number }) => (
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600 mb-1">{score.toFixed(1)}</div>
      <div className="text-xs text-gray-600">{label}</div>
      <Progress value={(score / maxScore) * 100} className="h-1 mt-2" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-blue-900">
            <Star className="w-6 h-6 mr-2 text-yellow-600" />
            STAR Method Trainer
          </CardTitle>
          <CardDescription className="text-blue-700">
            Master the STAR method with guided practice and AI-powered feedback
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="practice" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Practice Tab */}
        <TabsContent value="practice" className="space-y-6">
          {!isTraining ? (
            // Scenario Selection
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Choose Your Practice Scenario
                </CardTitle>
                <CardDescription>
                  Select a behavioral question to practice your STAR response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {practiceScenarios.map((scenario) => (
                    <Card 
                      key={scenario.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedScenario.id === scenario.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
                          <Badge 
                            variant="outline"
                            className={
                              scenario.difficulty === 'beginner' ? 'border-green-200 text-green-700' :
                              scenario.difficulty === 'intermediate' ? 'border-yellow-200 text-yellow-700' :
                              'border-red-200 text-red-700'
                            }
                          >
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">"{scenario.scenario}"</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{scenario.category}</Badge>
                          {latestSession?.scores && (
                            <div className="flex items-center text-sm text-blue-600">
                              <Star className="w-3 h-3 mr-1" />
                              Last score: {latestSession.scores.overall.toFixed(1)}/5
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button 
                    onClick={() => startNewSession(selectedScenario)}
                    disabled={createSessionMutation.isPending}
                    size="lg"
                    className="min-w-48"
                  >
                    {createSessionMutation.isPending ? "Starting..." : "Start Practice Session"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // STAR Training Interface
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Training Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedScenario.title}</h3>
                        <p className="text-sm text-gray-600">Step {currentStep + 1} of 4</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
                        <div className="text-xs text-gray-600">Complete</div>
                      </div>
                    </div>
                    <Progress value={progress} className="mb-4" />
                    <p className="text-sm text-gray-700 italic">"{selectedScenario.scenario}"</p>
                  </CardContent>
                </Card>

                {/* Current Step */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 ${currentStepData.color}`}>
                        <currentStepData.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold">{currentStepData.title}</span>
                        <p className="text-sm text-gray-600 font-normal mt-1">
                          {currentStepData.description}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={currentStepData.placeholder}
                      value={starResponse[currentStepData.key as keyof typeof starResponse]}
                      onChange={(e) => handleInputChange(currentStepData.key, e.target.value)}
                      rows={6}
                      className="mb-4"
                    />
                    
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      
                      <div className="flex space-x-2">
                        {starSteps.map((step, index) => (
                          <button
                            key={step.key}
                            onClick={() => handleStepChange(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentStep ? step.color :
                              starResponse[step.key as keyof typeof starResponse].trim().length > 0 
                                ? 'bg-green-400' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {currentStep < starSteps.length - 1 ? (
                        <Button
                          onClick={() => handleStepChange(currentStep + 1)}
                          disabled={!isCurrentStepComplete}
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={progress < 100 || submitResponseMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {submitResponseMutation.isPending ? "Analyzing..." : "Get AI Feedback"}
                          <Zap className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Step Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Tips for {currentStepData.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentStepData.tips.map((tip, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {starSteps.map((step, index) => (
                        <div key={step.key} className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                            starResponse[step.key as keyof typeof starResponse].trim().length > 0 
                              ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {starResponse[step.key as keyof typeof starResponse].trim().length > 0 
                              ? <CheckCircle className="w-3 h-3" />
                              : index + 1
                            }
                          </div>
                          <span className={`text-sm ${
                            starResponse[step.key as keyof typeof starResponse].trim().length > 0 
                              ? 'text-green-700 font-medium' : 'text-gray-600'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Latest Session Feedback */}
          {latestSession?.status === 'completed' && !isTraining && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Award className="w-5 h-5 mr-2" />
                  Your Latest Performance
                </CardTitle>
                <CardDescription className="text-green-700">
                  Feedback from your last practice of "{selectedScenario.title}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestSession.scores && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <ScoreCard label="Situation" score={latestSession.scores.situation} />
                    <ScoreCard label="Task" score={latestSession.scores.task} />
                    <ScoreCard label="Action" score={latestSession.scores.action} />
                    <ScoreCard label="Result" score={latestSession.scores.result} />
                    <ScoreCard label="Overall" score={latestSession.scores.overall} />
                  </div>
                )}

                {latestSession.feedback && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">AI Feedback:</h4>
                    <p className="text-green-700 text-sm">{latestSession.feedback}</p>
                  </div>
                )}

                {latestSession.suggestions && latestSession.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Suggestions for Improvement:</h4>
                    <ul className="space-y-1">
                      {latestSession.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start text-sm text-green-700">
                          <Lightbulb className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                STAR Method Guide
              </CardTitle>
              <CardDescription>
                Master the fundamentals of structured behavioral interviewing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {starSteps.map((step, index) => (
                  <Card key={step.key} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 ${step.color}`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        {step.title}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Practice Sessions Yet</h3>
                <p className="text-gray-600">Complete your first STAR method practice to see your history here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {session.scenario}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.completedAt ? 
                              new Date(session.completedAt).toLocaleDateString() : 
                              'In Progress'
                            }
                          </span>
                          <Badge 
                            className={
                              session.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                      {session.scores && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {session.scores.overall.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">Overall Score</div>
                        </div>
                      )}
                    </div>

                    {session.scores && (
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <ScoreCard label="S" score={session.scores.situation} />
                        <ScoreCard label="T" score={session.scores.task} />
                        <ScoreCard label="A" score={session.scores.action} />
                        <ScoreCard label="R" score={session.scores.result} />
                      </div>
                    )}

                    {session.feedback && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Feedback:</strong> {session.feedback}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Practice Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}