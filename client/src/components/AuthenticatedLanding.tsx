import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SeaLionLogo } from "@/components/ui/sealion-logo";
import { 
  BookOpen, 
  Target, 
  Award, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  LogOut,
  User,
  BarChart3,
  Play,
  Settings
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

interface AuthenticatedLandingProps {
  user: UserType;
}

export default function AuthenticatedLanding({ user }: AuthenticatedLandingProps) {
  // Fetch user's recent activity and progress (with error handling)
  const { data: dashboard, isError } = useQuery({
    queryKey: ["/api/perform/dashboard"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/perform/dashboard");
        if (!response.ok) {
          // If API fails, return null instead of throwing
          console.warn('Dashboard API failed, showing default data');
          return null;
        }
        return await response.json();
      } catch (error) {
        console.warn('Dashboard API error:', error);
        return null;
      }
    },
    retry: false, // Don't retry failed requests
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Interview Academy</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/prepare">
                <Button variant="ghost" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Prepare
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="ghost" size="sm">
                  <Target className="w-4 h-4 mr-2" />
                  Practice
                </Button>
              </Link>
              <Link href="/perform">
                <Button variant="ghost" size="sm">
                  <Award className="w-4 h-4 mr-2" />
                  Perform
                </Button>
              </Link>
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.firstName || undefined, user.lastName || undefined, user.email || undefined)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName || user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/auth/logout");
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                      // Fallback: go to home page
                      window.location.href = '/';
                    }
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Welcome Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {user.firstName || 'User'}! 👋
            </h1>
            <p className="text-xl text-gray-600">
              Ready to continue your interview preparation journey?
            </p>
          </div>

          {/* Quick Stats */}
          {dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {dashboard.totalSessions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {dashboard.completedSessions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {dashboard.averageScore?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {Math.round(((dashboard.completedSessions || 0) / (dashboard.totalSessions || 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">0.0</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">0%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Module Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Foundation
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Prepare</CardTitle>
                <CardDescription className="text-gray-600">
                  Build your foundation with comprehensive interview preparation resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/prepare">
                  <Button className="w-full group-hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700">
                    Continue Learning
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-500" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Active Practice
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Practice</CardTitle>
                <CardDescription className="text-gray-600">
                  Simulate real interviews with AI-powered coaching and instant feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/practice">
                  <Button className="w-full group-hover:scale-105 transition-transform bg-green-600 hover:bg-green-700">
                    <Play className="mr-2 w-4 h-4" />
                    Start Practice
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-500" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Analytics
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Perform</CardTitle>
                <CardDescription className="text-gray-600">
                  Track your progress with detailed analytics and performance insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/perform">
                  <Button variant="outline" className="w-full group-hover:scale-105 transition-transform border-purple-300 text-purple-700 hover:bg-purple-50">
                    <BarChart3 className="mr-2 w-4 h-4" />
                    View Analytics
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {dashboard?.recentSessions && dashboard.recentSessions.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest interview practice sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.recentSessions.slice(0, 3).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{session.scenario}</p>
                          <p className="text-sm text-gray-500">{session.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={session.score >= 7 ? "default" : "secondary"}>
                          {session.score}/10
                        </Badge>
                        <Link href={`/perform/evaluation/${session.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">P³</span>
                </div>
                <span className="font-bold">Interview Academy</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Powered by</span>
                <a 
                  href="https://sea-lion.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <SeaLionLogo size={14} />
                  <span>SeaLion AI</span>
                </a>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              &copy; 2025 P³ Interview Academy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}