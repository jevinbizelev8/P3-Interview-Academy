import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Zap,
  Users,
  Trophy,
  Brain,
  Mic,
  MessageSquare,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  totalQuestions: number;
  averageStarScore: number;
  strongestSkills: string[];
  improvementAreas: string[];
  voiceUsagePercent: number;
  totalPracticeTime: number; // minutes
}

interface RecentSession {
  id: string;
  date: Date;
  jobTitle: string;
  companyName: string;
  interviewStage: string;
  status: 'completed' | 'in_progress' | 'paused';
  questionsAnswered: number;
  averageScore: number;
  duration: number; // minutes
  voiceEnabled: boolean;
}

interface SessionProgress {
  currentSessionId?: string;
  questionsCompleted: number;
  totalQuestions: number;
  currentScore: number;
  timeElapsed: number; // minutes
  status: 'active' | 'paused' | 'completed';
}

interface SessionDashboardProps {
  userId?: string;
  currentSession?: SessionProgress;
  onResumeSession?: (sessionId: string) => void;
  onStartNewSession?: () => void;
  onViewSession?: (sessionId: string) => void;
  className?: string;
}

export default function SessionDashboard({
  userId,
  currentSession,
  onResumeSession,
  onStartNewSession,
  onViewSession,
  className = ''
}: SessionDashboardProps) {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: SessionStats = {
        totalSessions: 12,
        completedSessions: 8,
        totalQuestions: 156,
        averageStarScore: 3.7,
        strongestSkills: ['Problem Solving', 'Communication', 'Technical Knowledge'],
        improvementAreas: ['Leadership Examples', 'Quantifying Results', 'STAR Structure'],
        voiceUsagePercent: 75,
        totalPracticeTime: 340
      };

      const mockSessions: RecentSession[] = [
        {
          id: '1',
          date: new Date('2024-01-15'),
          jobTitle: 'Software Engineer',
          companyName: 'Google',
          interviewStage: 'behavioral',
          status: 'completed',
          questionsAnswered: 12,
          averageScore: 4.2,
          duration: 45,
          voiceEnabled: true
        },
        {
          id: '2',
          date: new Date('2024-01-14'),
          jobTitle: 'Product Manager',
          companyName: 'Meta',
          interviewStage: 'technical',
          status: 'completed',
          questionsAnswered: 8,
          averageScore: 3.1,
          duration: 30,
          voiceEnabled: false
        },
        {
          id: '3',
          date: new Date('2024-01-13'),
          jobTitle: 'Data Scientist',
          companyName: 'Grab',
          interviewStage: 'phone_screening',
          status: 'in_progress',
          questionsAnswered: 5,
          averageScore: 3.8,
          duration: 20,
          voiceEnabled: true
        }
      ];

      setStats(mockStats);
      setRecentSessions(mockSessions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Session Progress */}
      {currentSession && currentSession.status !== 'completed' && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Current Session in Progress
              </div>
              <Badge variant="outline" className={getStatusColor(currentSession.status)}>
                {currentSession.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{currentSession.questionsCompleted}/{currentSession.totalQuestions} questions</span>
              </div>
              <Progress 
                value={(currentSession.questionsCompleted / currentSession.totalQuestions) * 100} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(currentSession.timeElapsed)}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {currentSession.currentScore.toFixed(1)}/5
                  </div>
                </div>
                
                <div className="space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => currentSession.currentSessionId && onResumeSession?.(currentSession.currentSessionId)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold">{stats?.totalSessions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-green-600">
                {stats?.completedSessions || 0} completed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Questions Practiced</p>
                <p className="text-2xl font-bold">{stats?.totalQuestions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-500">Across all sessions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average STAR Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(stats?.averageStarScore || 0)}`}>
                  {stats?.averageStarScore?.toFixed(1) || '0.0'}/5
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Improving</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Practice Time</p>
                <p className="text-2xl font-bold">{formatDuration(stats?.totalPracticeTime || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <Mic className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-600">{stats?.voiceUsagePercent || 0}% voice enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {stats?.strongestSkills.map((skill, index) => (
                <div key={skill} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                    <span className="text-sm">{skill}</span>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
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
              {stats?.improvementAreas.map((area, index) => (
                <div key={area} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-3" />
                    <span className="text-sm">{area}</span>
                  </div>
                  <Badge variant="outline" className="text-amber-600">
                    Focus
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Recent Sessions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{session.jobTitle}</span>
                        <span className="text-sm text-gray-500">at {session.companyName}</span>
                        {session.voiceEnabled && (
                          <Mic className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {session.date.toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs">
                            {session.interviewStage}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(session.duration)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(session.averageScore)}`}>
                        {session.averageScore.toFixed(1)}/5
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.questionsAnswered} questions
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {session.status === 'in_progress' && (
                        <Button size="sm" onClick={() => onResumeSession?.(session.id)}>
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewSession?.(session.id)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {recentSessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No sessions yet</p>
              <p className="text-sm mb-4">Start your first AI-powered interview practice session</p>
              <Button onClick={onStartNewSession}>
                <Play className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16" onClick={onStartNewSession}>
              <div className="text-center">
                <Play className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">New Session</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16" onClick={loadDashboardData}>
              <div className="text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">View Analytics</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Users className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Practice with Others</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}