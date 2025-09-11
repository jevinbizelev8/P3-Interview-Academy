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
  Lightbulb,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Mic,
  MessageSquare
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

// Session thresholds for different features
const THRESHOLDS = {
  STRENGTHS_ANALYSIS: 3, // Need 3+ Practice sessions for strengths
  IMPROVEMENT_AREAS: 2,  // Need 2+ Practice sessions for improvement areas
  SKILLS_BREAKDOWN: 3,   // Need 3+ total sessions for skills breakdown
  PROGRESS_TRENDS: 5,    // Need 5+ total sessions for progress trends
  AI_INSIGHTS: 2         // Need 2+ total sessions for AI insights
} as const;

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

  // Helper functions to calculate remaining sessions needed
  const getSessionsNeeded = (currentCount: number, threshold: number) => {
    return Math.max(0, threshold - currentCount);
  };

  const getSessionsMessage = (current: number, threshold: number, sessionType: 'Practice' | 'total', feature: string) => {
    const needed = getSessionsNeeded(current, threshold);
    if (needed === 0) return null; // Feature is already unlocked
    
    const sessionText = needed === 1 ? 'session' : 'sessions';
    const actionText = sessionType === 'Practice' ? 
      `Complete ${needed} more Practice ${sessionText}` : 
      `Complete ${needed} more ${sessionText}`;
    
    return `${actionText} to unlock ${feature}`;
  };

  const practiceSessionsCount = dashboardStats.practiceSessions || 0;
  const totalSessionsCount = dashboardStats.totalSessions || 0;

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
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600 font-medium mb-1">Strengths Analysis Locked</p>
                  <p className="text-xs text-gray-500">
                    {getSessionsMessage(practiceSessionsCount, THRESHOLDS.STRENGTHS_ANALYSIS, 'Practice', 'strengths analysis') ||
                     'Complete more Practice sessions to identify your strengths'}
                  </p>
                </div>
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
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600 font-medium mb-1">Focus Areas Analysis Locked</p>
                  <p className="text-xs text-gray-500">
                    {getSessionsMessage(practiceSessionsCount, THRESHOLDS.IMPROVEMENT_AREAS, 'Practice', 'improvement areas analysis') ||
                     'Complete more Practice sessions to identify areas for improvement'}
                  </p>
                </div>
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
                <p className="text-sm mb-4">
                  Start your first Practice session to begin tracking your interview performance
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mt-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Quick Start:</p>
                  <p className="text-xs text-blue-700">
                    • 2+ Practice sessions → Unlock improvement areas analysis<br/>
                    • 3+ Practice sessions → Unlock strengths analysis<br/>
                    • 5+ total sessions → Unlock progress trends
                  </p>
                </div>
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
          {/* Enhanced Overall Performance Card */}
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
                  <p className="text-purple-100 text-lg">
                    {dashboardStats.averageScore >= 3.5 ? 'Pass' : 
                     dashboardStats.averageScore >= 3.0 ? 'Borderline' : 
                     'Needs Improvement'}
                  </p>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5" />
                      <span>Score: {dashboardStats.averageScore.toFixed(1)}/5.0</span>
                    </div>
                    {dashboardStats.averageScore >= 3.5 && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <Award className="w-4 h-4 mr-2" />
                        Pass
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold mb-2">{Math.round((dashboardStats.averageScore / 5) * 100)}%</div>
                  <Progress value={(dashboardStats.averageScore / 5) * 100} className="w-32 bg-white/20" />
                  <div className="text-sm text-purple-200 mt-1">
                    Pass Threshold: ≥ 3.5 • Borderline: 3.0 - 3.4
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consolidated Session Statistics */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-green-800">
                  <CheckCircle2 className="w-6 h-6 mr-3 text-green-600" />
                  Strengths Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.strongestSkills && dashboardStats.strongestSkills.length > 0 ? (
                    dashboardStats.strongestSkills.slice(0, 3).map((strength: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                        <Zap className="w-4 h-4 text-green-600 mt-0.5" />
                        <p className="text-gray-800 text-sm">{strength}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Brain className="w-8 h-8 text-green-300 mx-auto mb-2" />
                      <p className="text-green-600 text-sm font-medium mb-1">
                        {getSessionsNeeded(practiceSessionsCount, THRESHOLDS.STRENGTHS_ANALYSIS) === 0 ?
                          'Strengths will appear after analysis' :
                          `${getSessionsNeeded(practiceSessionsCount, THRESHOLDS.STRENGTHS_ANALYSIS)} more Practice ${getSessionsNeeded(practiceSessionsCount, THRESHOLDS.STRENGTHS_ANALYSIS) === 1 ? 'session' : 'sessions'} needed`
                        }
                      </p>
                      <p className="text-xs text-green-500">Practice sessions unlock strengths analysis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-blue-800">
                  <Target className="w-6 h-6 mr-3 text-blue-600" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.improvementAreas && dashboardStats.improvementAreas.length > 0 ? (
                    dashboardStats.improvementAreas.slice(0, 3).map((area: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-gray-800 text-sm">{area}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Target className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                      <p className="text-blue-600 text-sm font-medium mb-1">
                        {getSessionsNeeded(practiceSessionsCount, THRESHOLDS.IMPROVEMENT_AREAS) === 0 ?
                          'Areas will appear after analysis' :
                          `${getSessionsNeeded(practiceSessionsCount, THRESHOLDS.IMPROVEMENT_AREAS)} more Practice ${getSessionsNeeded(practiceSessionsCount, THRESHOLDS.IMPROVEMENT_AREAS) === 1 ? 'session' : 'sessions'} needed`
                        }
                      </p>
                      <p className="text-xs text-blue-500">Practice sessions unlock improvement areas analysis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="skills" className="space-y-6">
          {dashboardStats.skillBreakdown && dashboardStats.skillBreakdown.length > 0 ? (
            <>
              {/* Skills Performance Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Performance Analysis</CardTitle>
                  <CardDescription>Your performance across key interview criteria (1-5 scale)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardStats.skillBreakdown.map((skill: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{skill.skill}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${
                              skill.score >= 4 ? 'text-green-600' : 
                              skill.score >= 3 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {skill.score.toFixed(1)}/5
                            </span>
                            {skill.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                            {skill.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                          </div>
                        </div>
                        <Progress 
                          value={(skill.score / 5) * 100} 
                          className={`h-2 ${
                            skill.score >= 4 ? '[&>[data-state="complete"]:bg-green-500' : 
                            skill.score >= 3 ? '[&>[data-state="complete"]:bg-yellow-500' : 
                            '[&>[data-state="complete"]:bg-red-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {dashboardStats.skillBreakdown.filter((s: any) => s.score >= 4).length}
                      </div>
                      <p className="text-sm text-green-700">Strong Skills</p>
                      <p className="text-xs text-green-600">Score ≥ 4.0</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {dashboardStats.skillBreakdown.filter((s: any) => s.score >= 3 && s.score < 4).length}
                      </div>
                      <p className="text-sm text-yellow-700">Developing Skills</p>
                      <p className="text-xs text-yellow-600">Score 3.0-3.9</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {dashboardStats.skillBreakdown.filter((s: any) => s.score < 3).length}
                      </div>
                      <p className="text-sm text-red-700">Focus Areas</p>
                      <p className="text-xs text-red-600">Score &lt; 3.0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Skills Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2 font-medium">Skills Analysis Locked</p>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">
                    {totalSessionsCount < THRESHOLDS.SKILLS_BREAKDOWN ?
                      `Complete ${getSessionsNeeded(totalSessionsCount, THRESHOLDS.SKILLS_BREAKDOWN)} more ${getSessionsNeeded(totalSessionsCount, THRESHOLDS.SKILLS_BREAKDOWN) === 1 ? 'session' : 'sessions'} to unlock detailed skills analysis` :
                      'Skills analysis will appear after processing your sessions'
                    }
                  </p>
                  <p className="text-xs text-blue-600">
                    Skills breakdown includes: Situation, Task, Action, Result scoring with trends
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">{dashboardStats.totalSessions}</div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-xs text-gray-500">Practice + Interview</p>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">{dashboardStats.completedSessions}</div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xs text-gray-500">{((dashboardStats.completedSessions / dashboardStats.totalSessions) * 100).toFixed(0)}% completion rate</p>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600 mb-1">{dashboardStats.totalQuestions || 0}</div>
              <p className="text-sm text-gray-600">Questions Practiced</p>
              <p className="text-xs text-gray-500">Across all sessions</p>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-orange-600 mb-1">{formatTime(dashboardStats.totalPracticeTime || 0)}</div>
              <p className="text-sm text-gray-600">Practice Time</p>
              <p className="text-xs text-gray-500">Total invested</p>
            </Card>
          </div>

          {/* Progress Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                {dashboardStats.improvementRate > 0 ? 
                  `Improving at ${Math.abs(dashboardStats.improvementRate).toFixed(1)}% rate` :
                  dashboardStats.improvementRate < 0 ?
                  `Declining at ${Math.abs(dashboardStats.improvementRate).toFixed(1)}% rate` :
                  'Performance stable - consistent results'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardStats.performanceTrends && dashboardStats.performanceTrends.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.performanceTrends.slice(0, 5).map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{trend.date}</span>
                        <span className="text-xs text-gray-500">{trend.sessionType || 'Session'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          trend.score >= 4 ? 'text-green-600' : 
                          trend.score >= 3 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {trend.score ? trend.score.toFixed(1) : '0.0'}/5
                        </span>
                        {trend.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {trend.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-3">Progress Trends Locked</p>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 max-w-md mx-auto">
                    <p className="text-sm text-purple-700 mb-2">
                      {totalSessionsCount < THRESHOLDS.PROGRESS_TRENDS ?
                        `Complete ${getSessionsNeeded(totalSessionsCount, THRESHOLDS.PROGRESS_TRENDS)} more ${getSessionsNeeded(totalSessionsCount, THRESHOLDS.PROGRESS_TRENDS) === 1 ? 'session' : 'sessions'} to unlock progress trends` :
                        'Progress trends will appear after processing your sessions'
                      }
                    </p>
                    <p className="text-xs text-purple-600">
                      Track score improvements, identify patterns, and see your growth over time
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Practice Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{dashboardStats.voiceUsagePercent || 0}%</div>
                  <p className="text-sm text-gray-600 mb-1">Voice Practice Usage</p>
                  <Progress value={dashboardStats.voiceUsagePercent || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Sessions
                    </span>
                    <span className="font-medium">{Math.round((dashboardStats.voiceUsagePercent || 0) / 100 * dashboardStats.totalSessions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Text Sessions
                    </span>
                    <span className="font-medium">{dashboardStats.totalSessions - Math.round((dashboardStats.voiceUsagePercent || 0) / 100 * dashboardStats.totalSessions)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-6">
          {dashboardStats.strongestSkills && dashboardStats.strongestSkills.length > 0 ? (
            <>
              {/* AI-Powered Recommendations */}
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <Brain className="w-6 h-6 mr-3 text-purple-600" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Based on your consolidated performance across {dashboardStats.completedSessions} sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <p className="text-gray-700 leading-relaxed">
                      {dashboardStats.averageScore >= 3.5 ?
                        `Excellent work! You're consistently performing above the pass threshold with a ${dashboardStats.averageScore.toFixed(1)}/5 average. Focus on maintaining this high standard while fine-tuning your weaker areas for exceptional performance.` :
                        dashboardStats.averageScore >= 3.0 ?
                        `You're in the borderline range with room for improvement. Your ${dashboardStats.averageScore.toFixed(1)}/5 average shows solid foundation but needs consistency. Focus on structured responses and specific examples to push into the pass range.` :
                        `Your current ${dashboardStats.averageScore.toFixed(1)}/5 average indicates significant room for improvement. Focus on the STAR method structure, providing specific examples, and practicing regularly to build confidence and competency.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Recommended Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardStats.averageScore < 3.0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-red-800 mb-1">Priority: Master the STAR Method</h4>
                            <p className="text-sm text-red-700">Structure your responses with Situation, Task, Action, Result for clearer, more impactful answers.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {dashboardStats.averageScore >= 3.0 && dashboardStats.averageScore < 3.5 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800 mb-1">Focus: Add Specific Evidence</h4>
                            <p className="text-sm text-yellow-700">Include concrete metrics, numbers, and measurable outcomes to strengthen your responses and reach pass level.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {dashboardStats.averageScore >= 3.5 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-800 mb-1">Excellence: Refine Your Storytelling</h4>
                            <p className="text-sm text-green-700">Continue practicing diverse scenarios and refine your storytelling to maintain consistently high performance.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Practice Consistency</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Aim for regular practice sessions to maintain and improve your skills.</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mic className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Voice Practice</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {(dashboardStats.voiceUsagePercent || 0) > 50 ?
                            'Great use of voice practice! Continue to build verbal confidence.' :
                            'Try voice practice to improve your verbal communication skills.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Personalized Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4 font-medium">AI Insights Locked</p>
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200 max-w-lg mx-auto">
                  <p className="text-sm text-indigo-700 mb-3">
                    {totalSessionsCount < THRESHOLDS.AI_INSIGHTS ?
                      `Complete ${getSessionsNeeded(totalSessionsCount, THRESHOLDS.AI_INSIGHTS)} more ${getSessionsNeeded(totalSessionsCount, THRESHOLDS.AI_INSIGHTS) === 1 ? 'session' : 'sessions'} to unlock AI-powered insights` :
                      'AI insights will appear after analyzing your sessions'
                    }
                  </p>
                  <div className="text-xs text-indigo-600 space-y-1">
                    <p>• Personalized improvement recommendations</p>
                    <p>• Performance analysis with specific tips</p>
                    <p>• Tailored action items based on your strengths and weaknesses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      </div>
    </ProtectedRoute>
  );
}