import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Clock, 
  Star,
  ArrowRight,
  BookOpen,
  Plus,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PerformanceOverview {
  totalAssessments: number;
  averageScore: number;
  currentGrade: string;
  strongestCriteria: string;
  weakestCriteria: string;
  recentTrend: string;
  assessments: any[];
}

interface InterviewSession {
  id: string;
  status: string;
  scenario: {
    title: string;
    interviewStage: string;
    jobRole: string;
  };
  completedAt?: string;
  overallScore?: string;
}

export default function PerformanceDashboard() {
  const queryClient = useQueryClient();

  // Get user performance overview
  const { data: performance, isLoading: performanceLoading } = useQuery<PerformanceOverview>({
    queryKey: ['/api/performance/user/dev-user-123'],
    retry: false,
  });

  // Get recent completed sessions that can be assessed
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<InterviewSession[]>({
    queryKey: ['/api/practice/sessions'],
    retry: false,
  });

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          userId: 'dev-user-123'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance/user/dev-user-123'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments/user/dev-user-123'] });
    }
  });

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const hasPerformanceData = performance && performance.totalAssessments > 0;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <Target className="w-4 h-4 text-blue-600" />;
    }
  };

  if (performanceLoading || sessionsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
        <p className="text-gray-600">Track your interview performance and identify areas for improvement</p>
      </div>

      {!hasPerformanceData ? (
        // Welcome state for new users
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Performance Assessment</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete interview practice sessions to unlock detailed performance analytics and personalized feedback.
          </p>

          {completedSessions.length > 0 ? (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">Ready for Assessment</h3>
              <div className="space-y-3">
                {completedSessions.slice(0, 3).map(session => (
                  <Card key={session.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h4 className="font-medium">{session.scenario.title}</h4>
                        <p className="text-sm text-gray-600">
                          {session.scenario.interviewStage} • {session.scenario.jobRole}
                        </p>
                      </div>
                      <Button
                        onClick={() => createAssessmentMutation.mutate(session.id)}
                        disabled={createAssessmentMutation.isPending}
                        size="sm"
                      >
                        {createAssessmentMutation.isPending ? 'Assessing...' : 'Create Assessment'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="max-w-md mx-auto p-6">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Start Your Journey</h3>
                  <p className="text-gray-600 mb-4">
                    Complete your first practice session to begin receiving detailed performance feedback.
                  </p>
                  <Link href="/practice">
                    <Button className="w-full">
                      Start Practice Session
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        // Performance dashboard for users with data
        <>
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Grade</p>
                    <p className={`text-3xl font-bold ${getGradeColor(performance.currentGrade).split(' ')[0]}`}>
                      {performance.currentGrade}
                    </p>
                  </div>
                  <Badge className={getGradeColor(performance.currentGrade)}>
                    {performance.averageScore.toFixed(1)}/5.0
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assessments</p>
                    <p className="text-3xl font-bold text-gray-900">{performance.totalAssessments}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Strongest Area</p>
                    <p className="text-lg font-semibold text-gray-900 truncate">
                      {performance.strongestCriteria}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Trend</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {performance.recentTrend}
                    </p>
                  </div>
                  {getTrendIcon(performance.recentTrend)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/perform/history">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Assessment History
                  </CardTitle>
                  <CardDescription>
                    Review your past assessments and track progress over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {performance.totalAssessments} assessments completed
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/perform/trends">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>
                    Analyze your improvement patterns and skill development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Trend: {performance.recentTrend}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/practice">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="w-5 h-5 mr-2 text-purple-600" />
                    New Practice Session
                  </CardTitle>
                  <CardDescription>
                    Start a new interview practice to generate more assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Continue improving your skills
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Areas</CardTitle>
              <CardDescription>
                Based on your recent assessments, here are areas to prioritize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-red-900">Needs Attention</h4>
                    <p className="text-red-700">{performance.weakestCriteria}</p>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    Priority
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-green-900">Strength to Maintain</h4>
                    <p className="text-green-700">{performance.strongestCriteria}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Excellent
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}