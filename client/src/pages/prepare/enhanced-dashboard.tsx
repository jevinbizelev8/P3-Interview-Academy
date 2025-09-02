import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen,
  Target,
  Star,
  Building2,
  BarChart3,
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  Users,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Plus,
  Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PrepareProgressDashboard from "@/components/PrepareProgressDashboard";
import ResourceLibrary from "@/components/ResourceLibrary";
import StarMethodTrainer from "@/components/StarMethodTrainer";

// Import existing components that we'll enhance
import { SessionProvider } from "@/contexts/SessionContext";

interface EnhancedDashboardProps {
  preparationSessionId?: string;
}

interface PreparationSession {
  id: string;
  userId: string;
  jobPosition?: string;
  companyName?: string;
  targetInterviewDate?: Date;
  interviewStage?: string;
  preferredLanguage: string;
  status: 'active' | 'completed' | 'paused';
  overallProgress: number;
  studyPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  totalWeeks: number;
  targetSkills: string[];
  dailyTimeCommitment: number;
  milestones: any[];
  generatedContent: any;
  customizations: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyResearch {
  id: string;
  companyName: string;
  industry?: string;
  description?: string;
  keyProducts: string[];
  culture: any;
  values: string[];
  interviewInsights: {
    commonQuestions: string[];
    interviewProcess: string;
    whatTheyLookFor: string[];
  };
  lastUpdated: Date;
}

export default function EnhancedDashboard() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  
  // Extract sessionId from URL
  const sessionId = new URLSearchParams(search).get('sessionId');
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingStudyPlan, setIsCreatingStudyPlan] = useState(false);

  useEffect(() => {
    document.title = "Preparation Dashboard - P³ Interview Academy";
  }, []);

  // Fetch preparation session
  const { data: session, isLoading: sessionLoading } = useQuery<PreparationSession>({
    queryKey: [`/api/prepare/sessions/${sessionId}`],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      const response = await apiRequest('GET', `/api/prepare/sessions/${sessionId}`);
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Fetch study plan if session has one
  const { data: studyPlan, isLoading: studyPlanLoading } = useQuery<StudyPlan>({
    queryKey: [`/api/prepare/study-plans/${session?.studyPlanId}`],
    queryFn: async () => {
      if (!session?.studyPlanId) return null;
      const response = await apiRequest('GET', `/api/prepare/study-plans/${session.studyPlanId}`);
      return response.json();
    },
    enabled: !!session?.studyPlanId,
  });

  // Fetch company research if available
  const { data: companyResearch } = useQuery<CompanyResearch>({
    queryKey: [`/api/prepare/company-research`, session?.companyName],
    queryFn: async () => {
      if (!session?.companyName) return null;
      const response = await apiRequest('GET', `/api/prepare/company-research?companyName=${encodeURIComponent(session.companyName)}`);
      return response.json();
    },
    enabled: !!session?.companyName,
  });

  // Generate study plan mutation
  const generateStudyPlanMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !session) throw new Error("Session required");
      
      const response = await apiRequest('POST', `/api/prepare/sessions/${sessionId}/study-plan`, {
        jobPosition: session.jobPosition,
        companyName: session.companyName,
        targetInterviewDate: session.targetInterviewDate,
        timeAvailable: 60, // Default 1 hour per day
        focusAreas: ['STAR method', 'Company research', 'Behavioral questions'],
        language: session.preferredLanguage
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/prepare/sessions/${sessionId}`] });
      toast({
        title: "Study Plan Generated",
        description: "Your personalized study plan has been created!"
      });
      setIsCreatingStudyPlan(false);
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate study plan. Please try again.",
        variant: "destructive"
      });
      setIsCreatingStudyPlan(false);
    }
  });

  // Generate company research mutation
  const generateCompanyResearchMutation = useMutation({
    mutationFn: async () => {
      if (!session?.companyName) throw new Error("Company name required");
      
      const response = await apiRequest('POST', '/api/prepare/company-research', {
        companyName: session.companyName,
        jobPosition: session.jobPosition
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/prepare/company-research`] });
      toast({
        title: "Research Complete",
        description: `Company research for ${session?.companyName} has been generated!`
      });
    }
  });

  const handleCreateStudyPlan = () => {
    setIsCreatingStudyPlan(true);
    generateStudyPlanMutation.mutate();
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Required</h3>
            <p className="text-gray-600 mb-6">Please start a new preparation session.</p>
            <Button onClick={() => setLocation('/prepare')}>
              Back to Prepare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Not Found</h3>
            <p className="text-gray-600 mb-6">The preparation session could not be found.</p>
            <Button onClick={() => setLocation('/prepare')}>
              Back to Prepare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Preparation Dashboard</h1>
                <p className="text-lg text-gray-600 mt-1">
                  {session.jobPosition && session.companyName 
                    ? `${session.jobPosition} at ${session.companyName}`
                    : 'Interview Preparation'
                  }
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {session.interviewStage || 'General'}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {Math.round(session.overallProgress)}% Complete
                  </Badge>
                  {session.targetInterviewDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Target: {new Date(session.targetInterviewDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={() => setLocation('/prepare')}>
                  <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                  Back
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="study-plan">Study Plan</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="star-trainer">STAR Trainer</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                        <div className="text-2xl font-bold text-blue-600 mt-1">
                          {Math.round(session.overallProgress)}%
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <Progress value={session.overallProgress} className="mt-3" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Study Plan</p>
                        <div className="text-2xl font-bold text-green-600 mt-1">
                          {studyPlan ? 'Active' : 'None'}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Company Research</p>
                        <div className="text-2xl font-bold text-purple-600 mt-1">
                          {companyResearch ? 'Ready' : 'Pending'}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Days Until Interview</p>
                        <div className="text-2xl font-bold text-orange-600 mt-1">
                          {session.targetInterviewDate 
                            ? Math.ceil((new Date(session.targetInterviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            : '--'
                          }
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Recommended Next Steps
                  </CardTitle>
                  <CardDescription>
                    Continue your preparation journey with these suggested activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Study Plan Action */}
                    {!studyPlan && (
                      <Card className="border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" 
                            onClick={handleCreateStudyPlan}>
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-blue-900 mb-2">Generate Study Plan</h3>
                          <p className="text-sm text-blue-700 mb-4">
                            Create a personalized preparation timeline
                          </p>
                          <Button 
                            size="sm" 
                            disabled={isCreatingStudyPlan || generateStudyPlanMutation.isPending}
                          >
                            {isCreatingStudyPlan ? "Generating..." : "Create Plan"}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Company Research Action */}
                    {session.companyName && !companyResearch && (
                      <Card className="border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                            onClick={() => generateCompanyResearchMutation.mutate()}>
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Building2 className="w-6 h-6 text-purple-600" />
                          </div>
                          <h3 className="font-semibold text-purple-900 mb-2">Research {session.companyName}</h3>
                          <p className="text-sm text-purple-700 mb-4">
                            Get insights about the company and role
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={generateCompanyResearchMutation.isPending}
                          >
                            {generateCompanyResearchMutation.isPending ? "Researching..." : "Start Research"}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* STAR Practice Action */}
                    <Card className="border-2 border-dashed border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                          onClick={() => setActiveTab('star-trainer')}>
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-green-900 mb-2">Practice STAR Method</h3>
                        <p className="text-sm text-green-700 mb-4">
                          Master behavioral interview responses
                        </p>
                        <Button size="sm" variant="outline">
                          Start Practice
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Resources Action */}
                    <Card className="border-2 border-dashed border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer"
                          onClick={() => setActiveTab('resources')}>
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold text-yellow-900 mb-2">Browse Resources</h3>
                        <p className="text-sm text-yellow-700 mb-4">
                          Access preparation materials and guides
                        </p>
                        <Button size="sm" variant="outline">
                          Explore Library
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress">
              <PrepareProgressDashboard preparationSessionId={sessionId} />
            </TabsContent>

            {/* Study Plan Tab */}
            <TabsContent value="study-plan" className="space-y-6">
              {studyPlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      {studyPlan.title}
                    </CardTitle>
                    <CardDescription>{studyPlan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {studyPlan.totalWeeks}
                        </div>
                        <div className="text-sm text-gray-600">Weeks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {studyPlan.dailyTimeCommitment}
                        </div>
                        <div className="text-sm text-gray-600">Minutes/Day</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {studyPlan.targetSkills?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Skills</div>
                      </div>
                    </div>

                    {studyPlan.targetSkills && studyPlan.targetSkills.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Target Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {studyPlan.targetSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {studyPlan.milestones && studyPlan.milestones.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
                        <div className="space-y-4">
                          {studyPlan.milestones.map((milestone, index) => (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">Week {milestone.week}: {milestone.title}</h4>
                                  <Badge variant="outline">{milestone.estimatedHours}h</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                                {milestone.tasks && (
                                  <ul className="space-y-1">
                                    {milestone.tasks.map((task: string, taskIndex: number) => (
                                      <li key={taskIndex} className="flex items-center text-sm">
                                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                        {task}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Study Plan Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Generate a personalized study plan to organize your preparation
                    </p>
                    <Button 
                      onClick={handleCreateStudyPlan} 
                      disabled={isCreatingStudyPlan || generateStudyPlanMutation.isPending}
                      size="lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isCreatingStudyPlan ? "Generating..." : "Generate Study Plan"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <ResourceLibrary preparationSessionId={sessionId} />
            </TabsContent>

            {/* STAR Trainer Tab */}
            <TabsContent value="star-trainer">
              <StarMethodTrainer preparationSessionId={sessionId} />
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company" className="space-y-6">
              {companyResearch ? (
                <div className="space-y-6">
                  {/* Company Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building2 className="w-5 h-5 mr-2" />
                        {companyResearch.companyName}
                      </CardTitle>
                      <CardDescription>{companyResearch.industry}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{companyResearch.description}</p>
                      
                      {companyResearch.keyProducts && companyResearch.keyProducts.length > 0 && (
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Key Products & Services</h3>
                          <div className="flex flex-wrap gap-2">
                            {companyResearch.keyProducts.map((product, index) => (
                              <Badge key={index} variant="outline">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {companyResearch.values && companyResearch.values.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Company Values</h3>
                          <div className="flex flex-wrap gap-2">
                            {companyResearch.values.map((value, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Interview Insights */}
                  {companyResearch.interviewInsights && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="w-5 h-5 mr-2" />
                          Interview Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {companyResearch.interviewInsights.commonQuestions && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Common Interview Questions</h3>
                            <ul className="space-y-2">
                              {companyResearch.interviewInsights.commonQuestions.map((question, index) => (
                                <li key={index} className="flex items-start">
                                  <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{question}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {companyResearch.interviewInsights.whatTheyLookFor && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">What They Look For</h3>
                            <div className="flex flex-wrap gap-2">
                              {companyResearch.interviewInsights.whatTheyLookFor.map((trait, index) => (
                                <Badge key={index} className="bg-green-100 text-green-800">
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : session.companyName ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Research {session.companyName}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Get comprehensive insights about the company, culture, and interview process
                    </p>
                    <Button 
                      onClick={() => generateCompanyResearchMutation.mutate()}
                      disabled={generateCompanyResearchMutation.isPending}
                      size="lg"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      {generateCompanyResearchMutation.isPending ? "Researching..." : "Generate Research"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Company Specified</h3>
                    <p className="text-gray-600">
                      Add a company name to your preparation session to generate research
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SessionProvider>
  );
}