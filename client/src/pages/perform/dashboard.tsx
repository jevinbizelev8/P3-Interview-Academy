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
  AlertCircle
} from "lucide-react";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analytics dashboard...</p>
        </div>
      </div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.averageScore.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.improvementRate > 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +{dashboardStats.improvementRate.toFixed(1)}% this month
                </span>
              ) : (
                <span className="text-gray-500">No change this month</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(dashboardStats.totalPracticeTime)}</div>
            <p className="text-xs text-muted-foreground">
              Total practice time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalSessions > 0 
                ? Math.round((dashboardStats.completedSessions / dashboardStats.totalSessions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
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
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Top Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.strongestSkills.length > 0 ? (
                    dashboardStats.strongestSkills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{skill}</span>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.improvementAreas.length > 0 ? (
                    dashboardStats.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{area}</span>
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
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{session.scenario}</p>
                          <p className="text-sm text-gray-500">{session.date} • {formatTime(session.duration)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={session.score >= 8 ? "default" : session.score >= 6 ? "secondary" : "outline"}>
                          {session.score}/10
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/perform/evaluation/${session.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No practice sessions yet</p>
                  <Button onClick={() => window.location.href = '/practice'}>
                    Start Your First Practice Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Analysis Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of your performance across different interview skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardStats.skillBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.skillBreakdown.map((skill) => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <div className="flex items-center space-x-2">
                          {skill.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-500" />}
                          {skill.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                          <span className="text-sm font-semibold">{skill.score}/10</span>
                        </div>
                      </div>
                      <Progress value={skill.score * 10} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Complete more sessions to see detailed skill analysis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tracking Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track your improvement over time across different areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Performance trend chart will appear here after completing more sessions</p>
              </div>
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