import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  BarChart3, 
  BookOpen, 
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  Star,
  Users,
  Building2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PrepareProgressDashboardProps {
  preparationSessionId: string;
}

interface ProgressSummary {
  overallProgress: number;
  completedActivities: number;
  totalActivities: number;
  timeSpent: number;
  progressByActivity: Record<string, number>;
}

interface ActivityProgress {
  id: string;
  activityType: string;
  activityId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  timeSpent: number;
  completedAt?: Date;
  notes?: string;
}

const activityTypeLabels = {
  'resource-read': 'Resource Reading',
  'practice-test': 'Practice Tests',
  'star-practice': 'STAR Method Practice',
  'company-research': 'Company Research',
  'study-plan': 'Study Plan Review',
  'skill-assessment': 'Skill Assessment',
  'mock-interview': 'Mock Interviews'
};

const activityTypeIcons = {
  'resource-read': BookOpen,
  'practice-test': Target,
  'star-practice': Star,
  'company-research': Building2,
  'study-plan': Calendar,
  'skill-assessment': BarChart3,
  'mock-interview': Users
};

export default function PrepareProgressDashboard({ preparationSessionId }: PrepareProgressDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  // Fetch progress summary
  const { data: progressSummary, isLoading: summaryLoading } = useQuery<ProgressSummary>({
    queryKey: [`/api/prepare/sessions/${preparationSessionId}/progress`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/prepare/sessions/${preparationSessionId}/progress`);
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch detailed activity progress (mock data for now - would be from API)
  const activityProgress: ActivityProgress[] = [
    {
      id: '1',
      activityType: 'resource-read',
      status: 'completed',
      progress: 100,
      timeSpent: 45,
      completedAt: new Date('2024-01-15'),
      notes: 'Read all STAR method materials'
    },
    {
      id: '2',
      activityType: 'practice-test',
      status: 'in_progress',
      progress: 60,
      timeSpent: 30,
      notes: 'Completed behavioral questions test'
    },
    {
      id: '3',
      activityType: 'star-practice',
      status: 'completed',
      progress: 100,
      timeSpent: 90,
      completedAt: new Date('2024-01-14'),
      notes: 'Practiced 5 STAR scenarios'
    },
    {
      id: '4',
      activityType: 'company-research',
      status: 'in_progress',
      progress: 75,
      timeSpent: 60,
      notes: 'Researched company culture and recent news'
    },
    {
      id: '5',
      activityType: 'study-plan',
      status: 'not_started',
      progress: 0,
      timeSpent: 0
    }
  ];

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'not_started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'not_started': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <Card>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-blue-900">
            <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
            Preparation Progress
          </CardTitle>
          <CardDescription className="text-blue-700">
            Track your interview preparation journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Progress */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="transparent"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray={`${(progressSummary?.overallProgress || 0) * 0.628} 62.8`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-900">
                    {Math.round(progressSummary?.overallProgress || 0)}%
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-blue-900">Overall Progress</h3>
              <p className="text-sm text-blue-600">
                {progressSummary?.completedActivities || 0} of {progressSummary?.totalActivities || 0} activities
              </p>
            </div>

            {/* Time Spent */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Time Invested</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">
                {formatTime(progressSummary?.timeSpent || 0)}
              </p>
              <p className="text-sm text-blue-600">Total study time</p>
            </div>

            {/* Completed Activities */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Completed</h3>
              <p className="text-2xl font-bold text-purple-600 mb-1">
                {progressSummary?.completedActivities || 0}
              </p>
              <p className="text-sm text-blue-600">Activities finished</p>
            </div>

            {/* Streak */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Study Streak</h3>
              <p className="text-2xl font-bold text-orange-600 mb-1">5</p>
              <p className="text-sm text-blue-600">Days active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Progress Tabs */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Activity Progress
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your preparation activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityProgress.map((activity) => {
                  const Icon = activityTypeIcons[activity.activityType as keyof typeof activityTypeIcons] || BookOpen;
                  const label = activityTypeLabels[activity.activityType as keyof typeof activityTypeLabels] || activity.activityType;
                  
                  return (
                    <div key={activity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{label}</h4>
                            <p className="text-sm text-gray-600">
                              {formatTime(activity.timeSpent)} spent
                              {activity.completedAt && (
                                <span className="ml-2 text-green-600">
                                  • Completed {new Date(activity.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(activity.status)} variant="secondary">
                            {getStatusIcon(activity.status)}
                            <span className="ml-1 capitalize">
                              {activity.status.replace('_', ' ')}
                            </span>
                          </Badge>
                          <span className="text-lg font-semibold text-blue-600">
                            {activity.progress}%
                          </span>
                        </div>
                      </div>
                      
                      <Progress value={activity.progress} className="mb-3" />
                      
                      {activity.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          💡 {activity.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress by Activity Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Progress by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(progressSummary?.progressByActivity || {}).map(([type, progress]) => {
                    const Icon = activityTypeIcons[type as keyof typeof activityTypeIcons] || BookOpen;
                    const label = activityTypeLabels[type as keyof typeof activityTypeLabels] || type;
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Study Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-center text-xs font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs ${
                        Math.random() > 0.7
                          ? 'bg-green-200 text-green-800'
                          : Math.random() > 0.5
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                    <span>No activity</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                    <span>Some activity</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                    <span>High activity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Achievement Cards */}
            {[
              {
                title: "First Steps",
                description: "Started your first preparation session",
                icon: "🚀",
                earned: true,
                date: "2024-01-10"
              },
              {
                title: "STAR Student",
                description: "Completed 5 STAR method practices",
                icon: "⭐",
                earned: true,
                date: "2024-01-14"
              },
              {
                title: "Research Pro",
                description: "Complete comprehensive company research",
                icon: "🔍",
                earned: false,
                progress: 75
              },
              {
                title: "Test Master",
                description: "Score 90% or higher on 3 practice tests",
                icon: "🏆",
                earned: false,
                progress: 33
              },
              {
                title: "Consistency King",
                description: "Study for 7 consecutive days",
                icon: "💪",
                earned: false,
                progress: 71
              },
              {
                title: "Time Warrior",
                description: "Spend 10 hours in preparation",
                icon: "⏰",
                earned: false,
                progress: 45
              }
            ].map((achievement, index) => (
              <Card key={index} className={achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200"}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                  
                  {achievement.earned ? (
                    <div>
                      <Badge className="bg-green-100 text-green-800 mb-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Earned
                      </Badge>
                      <p className="text-xs text-green-600">
                        Achieved on {achievement.date}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Progress value={achievement.progress} className="mb-2" />
                      <p className="text-xs text-gray-500">
                        {achievement.progress}% complete
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Continue Your Preparation</CardTitle>
          <CardDescription>
            Quick actions to keep your momentum going
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Read Next Resource</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Take Practice Test</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Practice STAR Method</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Research Company</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}