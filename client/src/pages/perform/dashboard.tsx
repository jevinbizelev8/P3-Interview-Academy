import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Target, 
  Award,
  BarChart3,
  Calendar,
  Clock,
  Star,
  Trophy,
  Users,
  Brain,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Activity,
  Lightbulb
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { apiRequest } from "@/lib/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";

interface DashboardStats {
  // Combined metrics (Interview + Practice)
  totalSessions: number;
  completedSessions: number;
  totalQuestions: number;
  averageScore: number;
  averageStarScore?: number;
  totalPracticeTime: number;
  improvementRate: number;
  voiceUsagePercent?: number;
  strongestSkills: string[];
  improvementAreas: string[];
  recentSessions: Array<{
    id: string;
    date: string;
    scenario?: string;
    sessionType?: 'Interview' | 'Practice';
    jobTitle?: string;
    companyName?: string;
    interviewStage?: string;
    score: number;
    duration: number;
    questionsAnswered?: number;
    status?: 'completed' | 'in_progress' | 'paused';
    voiceEnabled?: boolean;
  }>;
  performanceTrends: Array<{
    date: string;
    score: number;
    category: string;
  }>;
  skillBreakdown: Array<{
    skill: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Module-specific metrics
  interviewSessions?: number;
  practiceSessions?: number;
  practiceQuestions?: number;
  
  // Session type breakdown for charts
  sessionTypeBreakdown?: Array<{
    type: 'Interview' | 'Practice';
    count: number;
    percentage: number;
  }>;
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Fetch dashboard analytics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/perform/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/perform/dashboard");
      return await response.json();
    },
  });


  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Loading skeleton for key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Loading skeleton for charts */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
                  <Activity className="w-8 h-8 text-gray-400 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const dashboardStats: DashboardStats = stats || {
    totalSessions: 0,
    completedSessions: 0,
    totalQuestions: 0,
    averageScore: 0,
    averageStarScore: 0,
    totalPracticeTime: 0,
    improvementRate: 0,
    voiceUsagePercent: 0,
    strongestSkills: [],
    improvementAreas: [],
    recentSessions: [],
    performanceTrends: [],
    skillBreakdown: []
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Performance Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Track your interview progress, identify strengths, and discover areas for improvement
        </p>
      </div>


      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{dashboardStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.completedSessions} completed
            </p>
            <Progress 
              value={dashboardStats.totalSessions > 0 ? (dashboardStats.completedSessions / dashboardStats.totalSessions) * 100 : 0} 
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Practiced</CardTitle>
            <div className="p-2 bg-green-50 rounded-full">
              <Target className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{dashboardStats.totalQuestions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all sessions
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average STAR Score</CardTitle>
            <div className="p-2 bg-yellow-50 rounded-full">
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {(dashboardStats.averageStarScore || dashboardStats.averageScore || 0).toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.improvementRate > 0 ? (
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Improving
                </span>
              ) : dashboardStats.improvementRate < 0 ? (
                <span className="text-red-600 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Declining
                </span>
              ) : (
                <span className="text-gray-500">Stable</span>
              )}
            </p>
            <Progress 
              value={((dashboardStats.averageStarScore || dashboardStats.averageScore || 0) / 5) * 100} 
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
            <div className="p-2 bg-purple-50 rounded-full">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{formatTime(dashboardStats.totalPracticeTime)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.voiceUsagePercent ? (
                <span className="text-blue-600 flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {dashboardStats.voiceUsagePercent}% voice enabled
                </span>
              ) : (
                <span className="text-gray-500">Total practice time</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats.strongestSkills && dashboardStats.strongestSkills.length > 0 ? (
                dashboardStats.strongestSkills.map((skill, index) => (
                  <div key={skill} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      <span className="text-sm">{skill}</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      #{index + 1}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Complete sessions to identify your strengths</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Improvement Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats.improvementAreas && dashboardStats.improvementAreas.length > 0 ? (
                dashboardStats.improvementAreas.map((area, index) => (
                  <div key={area} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3" />
                      <span className="text-sm">{area}</span>
                    </div>
                    <Badge variant="outline" className="text-amber-600">
                      Focus
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">We'll identify areas for improvement after your first sessions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Type Breakdown */}
      {dashboardStats.sessionTypeBreakdown && dashboardStats.sessionTypeBreakdown.some(s => s.count > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                Session Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.sessionTypeBreakdown.map((sessionType, index) => (
                  <div key={sessionType.type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        sessionType.type === 'Interview' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium">{sessionType.type} Sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={sessionType.type === 'Interview' ? 'text-blue-600' : 'text-green-600'}>
                        {sessionType.count}
                      </Badge>
                      <span className="text-xs text-gray-500">{sessionType.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-emerald-600" />
                Module Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 bg-blue-500" />
                    <span className="text-sm font-medium">Interview Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-blue-600">
                      {dashboardStats.interviewSessions || 0}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 bg-green-500" />
                    <span className="text-sm font-medium">Practice Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">
                      {dashboardStats.practiceSessions || 0}
                    </Badge>
                  </div>
                </div>
                {dashboardStats.voiceUsagePercent && dashboardStats.voiceUsagePercent > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3 bg-purple-500" />
                      <span className="text-sm font-medium">Voice-enabled Sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-purple-600">
                        {dashboardStats.voiceUsagePercent}%
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Sessions */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Recent Sessions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardStats.recentSessions && dashboardStats.recentSessions.length > 0 ? (
              dashboardStats.recentSessions.slice(0, 8).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      session.status === 'completed' ? 'bg-green-500' : 
                      session.status === 'in_progress' ? 'bg-blue-500' : 
                      'bg-yellow-500'
                    }`} />
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">
                          {session.jobTitle || session.scenario || 'Session'}
                        </span>
                        {session.sessionType && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              session.sessionType === 'Interview' 
                                ? 'text-blue-600 border-blue-200 bg-blue-50' 
                                : 'text-green-600 border-green-200 bg-green-50'
                            }`}
                          >
                            {session.sessionType}
                          </Badge>
                        )}
                        {session.companyName && (
                          <span className="text-sm text-gray-500">at {session.companyName}</span>
                        )}
                        {session.voiceEnabled && (
                          <MessageCircle className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {session.date}
                        </div>
                        {session.interviewStage && (
                          <Badge variant="outline" className="text-xs">
                            {session.interviewStage}
                          </Badge>
                        )}
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(session.duration)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        session.score >= 4 ? 'text-green-600' : 
                        session.score >= 3 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {session.score.toFixed(1)}/5
                      </div>
                      {session.questionsAnswered && (
                        <div className="text-sm text-gray-500">
                          {session.questionsAnswered} questions
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(`/perform/evaluation/${session.id}`, '_blank')}
                      >
                        <Target className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No sessions yet</p>
                <p className="text-sm mb-4">Complete interview practice sessions to see your performance analytics here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Comprehensive view of your interview preparation progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {dashboardStats.totalSessions > 0 ? 
                  `You've completed ${dashboardStats.completedSessions} out of ${dashboardStats.totalSessions} sessions with an average score of ${dashboardStats.averageScore.toFixed(1)}/5.` :
                  'Start practicing to see your comprehensive performance analytics here.'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Skills breakdown and improvement recommendations will appear after completing practice sessions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track your improvement over time with detailed progress charts and trends.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get AI-powered recommendations for improving your interview performance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      </div>
    </ProtectedRoute>
  );
}