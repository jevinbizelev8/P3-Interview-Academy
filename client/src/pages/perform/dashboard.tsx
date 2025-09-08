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
  CheckCircle,
  Database,
  Trash2,
  AlertCircle,
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
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  totalPracticeTime: number;
  improvementRate: number;
  strongestSkills: string[];
  improvementAreas: string[];
  recentSessions: Array<{
    id: string;
    date: string;
    scenario: string;
    score: number;
    duration: number;
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
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");
  const [demoError, setDemoError] = useState("");

  // Fetch dashboard analytics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/perform/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/perform/dashboard");
      return await response.json();
    },
  });

  // Generate demo data
  const handleGenerateDemoData = async () => {
    setIsDemoLoading(true);
    setDemoMessage("");
    setDemoError("");

    try {
      const response = await apiRequest("POST", "/api/perform/generate-demo-data");
      const result = await response.json();
      
      setDemoMessage(`✅ ${result.message}`);
      
      // Refetch dashboard data to show new demo data
      queryClient.invalidateQueries({ queryKey: ["/api/perform/dashboard"] });
      
      // Clear message after 5 seconds
      setTimeout(() => setDemoMessage(""), 5000);
    } catch (error: any) {
      setDemoError(`❌ Failed to generate demo data: ${error.message}`);
      setTimeout(() => setDemoError(""), 5000);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Clear demo data
  const handleClearDemoData = async () => {
    setIsDemoLoading(true);
    setDemoMessage("");
    setDemoError("");

    try {
      const response = await apiRequest("POST", "/api/perform/clear-demo-data");
      const result = await response.json();
      
      setDemoMessage(`✅ ${result.message}`);
      
      // Refetch dashboard data to reflect cleared data
      queryClient.invalidateQueries({ queryKey: ["/api/perform/dashboard"] });
      
      // Clear message after 5 seconds
      setTimeout(() => setDemoMessage(""), 5000);
    } catch (error: any) {
      setDemoError(`❌ Failed to clear demo data: ${error.message}`);
      setTimeout(() => setDemoError(""), 5000);
    } finally {
      setIsDemoLoading(false);
    }
  };

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
    averageScore: 0,
    totalPracticeTime: 0,
    improvementRate: 0,
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

      {/* Demo Data Controls */}
      <Card className="mb-8 border-dashed border-2 border-gray-300 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Demo Data Controls
          </CardTitle>
          <CardDescription>
            Generate realistic demo data to see how analytics and scoring metrics are displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button 
              onClick={handleGenerateDemoData}
              disabled={isDemoLoading}
              className="flex items-center"
              variant="outline"
            >
              {isDemoLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Generate Demo Data
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleClearDemoData}
              disabled={isDemoLoading}
              variant="outline"
              className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
            >
              {isDemoLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Demo Data
                </>
              )}
            </Button>
          </div>

          {demoMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {demoMessage}
              </AlertDescription>
            </Alert>
          )}

          {demoError && (
            <Alert className="border-red-200 bg-red-50" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {demoError}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500 mt-4">
            <p><strong>Generate Demo Data:</strong> Creates 8-12 realistic interview sessions with scores, evaluations, and analytics over the last 3 months</p>
            <p><strong>Clear Demo Data:</strong> Removes all demo sessions (identifies them by scenario ID prefix "demo-")</p>
          </div>
        </CardContent>
      </Card>

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
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <div className="p-2 bg-green-50 rounded-full">
              <Star className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{dashboardStats.averageScore.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.improvementRate > 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +{dashboardStats.improvementRate.toFixed(1)}% vs baseline
                </span>
              ) : dashboardStats.improvementRate < 0 ? (
                <span className="text-red-600 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {dashboardStats.improvementRate.toFixed(1)}% vs baseline
                </span>
              ) : (
                <span className="text-gray-500">Stable performance</span>
              )}
            </p>
            <Progress 
              value={(dashboardStats.averageScore / 5) * 100} 
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
              {dashboardStats.completedSessions > 0 
                ? `Avg: ${formatTime(Math.round(dashboardStats.totalPracticeTime / dashboardStats.completedSessions))} per session`
                : 'Total practice time'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <div className="p-2 bg-orange-50 rounded-full">
              <CheckCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {dashboardStats.totalSessions > 0 
                ? Math.round((dashboardStats.completedSessions / dashboardStats.totalSessions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.completedSessions} of {dashboardStats.totalSessions} sessions
            </p>
            <Progress 
              value={dashboardStats.totalSessions > 0 ? (dashboardStats.completedSessions / dashboardStats.totalSessions) * 100 : 0} 
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Score Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-blue-600" />
                  Current Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {dashboardStats.averageScore.toFixed(1)}/5
                  </div>
                  <div className="text-sm text-blue-600 mb-3">
                    {dashboardStats.averageScore >= 3.5 ? 'Exceeding Expectations' : 
                     dashboardStats.averageScore >= 3.0 ? 'Meeting Expectations' : 
                     'Developing Skills'}
                  </div>
                  <Progress 
                    value={(dashboardStats.averageScore / 5) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Progress Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {dashboardStats.improvementRate > 0 ? '+' : ''}{dashboardStats.improvementRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-600 mb-3">
                    {dashboardStats.improvementRate > 0 ? 'Improving' : 
                     dashboardStats.improvementRate < 0 ? 'Declining' : 'Stable'}
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    {dashboardStats.improvementRate > 0 ? 
                      <ArrowUp className="w-4 h-4 text-green-500" /> :
                      dashboardStats.improvementRate < 0 ?
                      <ArrowDown className="w-4 h-4 text-red-500" /> :
                      <Activity className="w-4 h-4 text-gray-500" />
                    }
                    <span className="text-xs text-gray-600">vs baseline</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Star className="w-5 h-5 mr-2 text-purple-600" />
                  Session Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-700 mb-2">
                    {dashboardStats.totalSessions > 0 
                      ? Math.round((dashboardStats.completedSessions / dashboardStats.totalSessions) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-purple-600 mb-3">
                    {dashboardStats.completedSessions} of {dashboardStats.totalSessions} completed
                  </div>
                  <Progress 
                    value={dashboardStats.totalSessions > 0 
                      ? (dashboardStats.completedSessions / dashboardStats.totalSessions) * 100 
                      : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Radar Chart */}
          {dashboardStats.skillBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills Performance Radar</CardTitle>
                <CardDescription>
                  Visual breakdown of your performance across key interview skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dashboardStats.skillBreakdown}>
                      <PolarGrid />
                      <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                      />
                      <PolarRadiusAxis 
                        angle={0} 
                        domain={[0, 5]} 
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      />
                      <Radar
                        name="Your Score"
                        dataKey="score"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      {/* Reference line showing 3.5 target threshold */}
                      <Radar
                        name="Target (3.5)"
                        dataKey={() => 3.5}
                        stroke="#10B981"
                        fill="none"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        dot={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${Number(value).toFixed(1)}/5`, 'Score']}
                        labelFormatter={(label) => `${label}`}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Top Strengths
                </CardTitle>
                <CardDescription>Areas where you consistently excel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.strongestSkills.length > 0 ? (
                    dashboardStats.strongestSkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-900">{skill}</span>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Complete more sessions to see your strengths</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Focus Areas
                </CardTitle>
                <CardDescription>Skills to prioritize for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.improvementAreas.length > 0 ? (
                    dashboardStats.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-900">{area}</span>
                        </div>
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Complete more sessions to identify focus areas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Practice Sessions</CardTitle>
              <CardDescription>
                Your latest interview practice sessions and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardStats.recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.recentSessions.map((session) => (
                    <div key={session.id} className="group flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                          session.score >= 4 ? 'bg-green-100 group-hover:bg-green-200' : 
                          session.score >= 3 ? 'bg-yellow-100 group-hover:bg-yellow-200' : 
                          'bg-red-100 group-hover:bg-red-200'
                        }`}>
                          <MessageCircle className={`w-5 h-5 ${
                            session.score >= 4 ? 'text-green-600' : 
                            session.score >= 3 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">{session.scenario}</p>
                          <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{session.date} • {formatTime(session.duration)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={session.score >= 4 ? "default" : session.score >= 3 ? "secondary" : "outline"} 
                               className="transition-colors duration-200">
                          {session.score.toFixed(1)}/5
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          onClick={() => window.location.href = `/perform/evaluation/${session.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-purple-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">+</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Interview Journey</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    No practice sessions yet. Begin your first AI-powered interview to see detailed analytics and progress tracking.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2"
                      onClick={() => window.location.href = '/practice'}
                    >
                      Start Your First Practice Session
                    </Button>
                    <p className="text-xs text-gray-400">
                      Get personalized feedback and track your improvement
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Analysis Tab */}
        <TabsContent value="skills" className="space-y-6">
          {/* Score Legend */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                Understanding Your Scores
              </CardTitle>
              <CardDescription>
                Each skill is scored on a 5-point scale based on professional interview standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-700 font-bold text-sm">1-2</span>
                  </div>
                  <div>
                    <div className="font-medium text-red-800">Needs Improvement</div>
                    <div className="text-xs text-red-600">Below expectations, focus area</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-700 font-bold text-sm">3-3.4</span>
                  </div>
                  <div>
                    <div className="font-medium text-yellow-800">Average/Borderline</div>
                    <div className="text-xs text-yellow-600">Meets basic expectations</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-bold text-sm">3.5+</span>
                  </div>
                  <div>
                    <div className="font-medium text-green-800">Great/Pass</div>
                    <div className="text-xs text-green-600">Exceeds expectations</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Pass Threshold:</strong> You need an average of 3.5+ across all skills to pass most interviews.
                  Scores below 3.0 in any area require focused improvement.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Skill Analysis */}
          {dashboardStats.skillBreakdown.length > 0 ? (
            <div className="grid gap-6">
              {dashboardStats.skillBreakdown.map((skill) => {
                const getSkillInfo = (score: number, skillName: string) => {
                  if (score >= 3.5) {
                    return {
                      level: 'Great',
                      color: 'green',
                      bgColor: 'bg-green-50',
                      borderColor: 'border-green-200',
                      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                      meaning: `Excellent ${skillName.toLowerCase()}! You're exceeding expectations in this area.`,
                      suggestions: [
                        `Continue demonstrating strong ${skillName.toLowerCase()} in future interviews`,
                        'Share specific examples that showcase this strength',
                        'Consider mentoring others in this skill area'
                      ]
                    };
                  } else if (score >= 3.0) {
                    return {
                      level: 'Average',
                      color: 'yellow',
                      bgColor: 'bg-yellow-50',
                      borderColor: 'border-yellow-200', 
                      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
                      meaning: `Your ${skillName.toLowerCase()} meets basic expectations but has room for improvement.`,
                      suggestions: [
                        `Practice more scenarios that emphasize ${skillName.toLowerCase()}`,
                        'Focus on providing more detailed, specific examples',
                        'Review interview best practices for this skill area'
                      ]
                    };
                  } else {
                    return {
                      level: 'Needs Improvement',
                      color: 'red',
                      bgColor: 'bg-red-50',
                      borderColor: 'border-red-200',
                      icon: <Target className="w-5 h-5 text-red-600" />,
                      meaning: `${skillName} is currently below expectations and needs focused attention.`,
                      suggestions: [
                        `Dedicate extra practice time to ${skillName.toLowerCase()}`,
                        'Study examples of excellent responses in this area',
                        'Consider working with a coach on this specific skill',
                        'Review the interview rubric for this competency'
                      ]
                    };
                  }
                };

                const skillInfo = getSkillInfo(skill.score, skill.skill);

                return (
                  <Card key={skill.skill} className={`${skillInfo.bgColor} ${skillInfo.borderColor} border-l-4`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          {skillInfo.icon}
                          <span className="ml-2">{skill.skill}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          {skill.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-500" />}
                          {skill.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                          {skill.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                          <Badge variant="outline" className={`font-bold ${
                            skill.score >= 3.5 ? 'text-green-700 bg-green-100 border-green-300' :
                            skill.score >= 3.0 ? 'text-yellow-700 bg-yellow-100 border-yellow-300' :
                            'text-red-700 bg-red-100 border-red-300'
                          }`}>
                            {skill.score.toFixed(1)}/5 ({skillInfo.level})
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Score Visualization */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Performance Level</span>
                          <span className="text-sm text-gray-600">
                            {skill.trend === 'up' && 'Improving ↗'}
                            {skill.trend === 'down' && 'Declining ↘'}
                            {skill.trend === 'stable' && 'Stable →'}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={(skill.score / 5) * 100} className="h-3" />
                          {/* Threshold markers */}
                          <div className="absolute top-0 left-0 w-full h-3 flex">
                            <div className="w-[60%] border-r-2 border-yellow-400"></div>
                            <div className="w-[10%] border-r-2 border-green-400"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1.0</span>
                          <span className="text-yellow-600">3.0 (Borderline)</span>
                          <span className="text-green-600">3.5 (Pass)</span>
                          <span>5.0</span>
                        </div>
                      </div>

                      {/* What This Score Means */}
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">What This Score Means</h4>
                        <p className="text-sm text-gray-700">{skillInfo.meaning}</p>
                      </div>

                      {/* Improvement Suggestions */}
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-1 text-blue-500" />
                          How to Improve
                        </h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {skillInfo.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skill Data Yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Complete more practice sessions to see your detailed skill breakdown and personalized improvement suggestions.
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => window.location.href = '/practice'}
                >
                  Start Practice Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tracking Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Progression Over Time</CardTitle>
                <CardDescription>
                  Your interview performance trend across recent sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardStats.recentSessions.length > 0 ? (
                  <div className="h-64">
                    <div className="text-sm mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Overall Score</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Pass Threshold (3.5)</span>
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardStats.recentSessions.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          domain={[0, 5]} 
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [`${Number(value).toFixed(1)}/5`, 'Score']}
                          labelFormatter={(label) => `Session: ${label}`}
                        />
                        <ReferenceLine y={3.5} stroke="#10B981" strokeDasharray="5 5" />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 mb-4">No sessions yet to show trends</p>
                      <Button onClick={() => window.location.href = '/practice'}>
                        Start Your First Practice Session
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Development Trends</CardTitle>
                <CardDescription>
                  Track improvement across different skill areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardStats.skillBreakdown.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardStats.skillBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          domain={[0, 5]} 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          dataKey="skill" 
                          type="category" 
                          tick={{ fontSize: 11 }}
                          width={120}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${Number(value).toFixed(1)}/5`, 'Score']}
                        />
                        <Bar dataKey="score" fill="#8B5CF6">
                          {dashboardStats.skillBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score >= 3.5 ? '#10B981' : entry.score >= 3.0 ? '#F59E0B' : '#EF4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Complete more sessions to see skill trends</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>
                Breakdown of your scores across all sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardStats.recentSessions.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <h4 className="text-sm font-medium mb-4">Score Distribution</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'Excellent (4.0-5.0)', 
                              value: dashboardStats.recentSessions.filter(s => s.score >= 4).length,
                              fill: '#10B981'
                            },
                            { 
                              name: 'Good (3.0-3.9)', 
                              value: dashboardStats.recentSessions.filter(s => s.score >= 3 && s.score < 4).length,
                              fill: '#F59E0B'
                            },
                            { 
                              name: 'Needs Improvement (<3.0)', 
                              value: dashboardStats.recentSessions.filter(s => s.score < 3).length,
                              fill: '#EF4444'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Performance Summary</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Excellent Sessions</span>
                        </div>
                        <span className="text-green-800 font-bold">
                          {dashboardStats.recentSessions.filter(s => s.score >= 4).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Good Sessions</span>
                        </div>
                        <span className="text-amber-800 font-bold">
                          {dashboardStats.recentSessions.filter(s => s.score >= 3 && s.score < 4).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Focus Needed</span>
                        </div>
                        <span className="text-red-800 font-bold">
                          {dashboardStats.recentSessions.filter(s => s.score < 3).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-4">No performance data yet</p>
                    <Button onClick={() => window.location.href = '/practice'}>
                      Start Practicing to See Analytics
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Insights</CardTitle>
              <CardDescription>
                AI-powered recommendations to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">🎯 Focus Recommendation</h4>
                  <p className="text-blue-800">
                    Practice more behavioral questions using the STAR method to improve your storytelling structure.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">💡 Quick Tip</h4>
                  <p className="text-green-800">
                    Your communication clarity is excellent! Try to maintain this level of articulation in technical discussions.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">📈 Growth Opportunity</h4>
                  <p className="text-purple-800">
                    Consider practicing executive-level interviews to prepare for senior roles.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ProtectedRoute>
  );
}