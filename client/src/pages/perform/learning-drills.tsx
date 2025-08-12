import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Clock, Target, Play, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LearningDrill {
  id: string;
  drillType: string;
  title: string;
  description: string;
  scenario: string;
  targetSkill: string;
  estimatedDuration?: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export default function LearningDrills() {
  const queryClient = useQueryClient();

  const { data: drills = [], isLoading } = useQuery<LearningDrill[]>({
    queryKey: ['/api/perform/drills/user/dev-user-123'],
    retry: false,
  });

  const completeDrillMutation = useMutation({
    mutationFn: async (drillId: string) => {
      return await apiRequest(`/api/perform/drills/${drillId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ userId: 'dev-user-123' })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/perform/drills/user/dev-user-123'] });
      queryClient.invalidateQueries({ queryKey: ['/api/perform/overview/user/dev-user-123'] });
    }
  });

  const getDrillTypeIcon = (type: string) => {
    switch (type) {
      case 'star_method': return <Target className="w-5 h-5" />;
      case 'communication': return <Award className="w-5 h-5" />;
      case 'cultural_fit': return <CheckCircle className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  const getDrillTypeColor = (type: string) => {
    switch (type) {
      case 'star_method': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'communication': return 'text-green-600 bg-green-100 border-green-200';
      case 'cultural_fit': return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const completedDrills = drills.filter(d => d.completed);
  const incompleteDrills = drills.filter(d => !d.completed);
  const completionRate = drills.length > 0 ? (completedDrills.length / drills.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/perform">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Learning Drills</h1>
          <p className="text-gray-600">Master advanced techniques through targeted exercises - Build executive presence and negotiation skills</p>
        </div>
      </div>

      {drills.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Learning Drills Available</h3>
            <p className="text-gray-600 mb-6">
              Complete assessment sessions to unlock personalized learning drills.
            </p>
            <Link href="/perform">
              <Button>View Performance Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-6 h-6 mr-2 text-purple-600" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {completedDrills.length}
                  </div>
                  <p className="text-gray-600">Drills Completed</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {incompleteDrills.length}
                  </div>
                  <p className="text-gray-600">Drills Remaining</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round(completionRate)}%
                  </div>
                  <p className="text-gray-600">Completion Rate</p>
                  <Progress value={completionRate} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incomplete Drills */}
          {incompleteDrills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Drills</h2>
              <div className="space-y-4">
                {incompleteDrills.map((drill) => (
                  <Card key={drill.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`p-2 rounded-lg mr-3 ${getDrillTypeColor(drill.drillType)}`}>
                              {getDrillTypeIcon(drill.drillType)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{drill.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {drill.drillType.replace('_', ' ')}
                                </Badge>
                                {drill.estimatedDuration && (
                                  <Badge variant="outline" className="text-gray-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {drill.estimatedDuration} min
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="ml-14">
                            Target Skill: {drill.targetSkill}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => completeDrillMutation.mutate(drill.id)}
                          disabled={completeDrillMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {completeDrillMutation.isPending ? 'Completing...' : 'Start Drill'}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="ml-14 space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700">{drill.description}</p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Practice Scenario</h4>
                          <p className="text-blue-800">{drill.scenario}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Drills */}
          {completedDrills.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Drills</h2>
              <div className="space-y-4">
                {completedDrills.map((drill) => (
                  <Card key={drill.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${getDrillTypeColor(drill.drillType)}`}>
                            {getDrillTypeIcon(drill.drillType)}
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {drill.title}
                              <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                            </CardTitle>
                            <CardDescription>
                              Completed on {drill.completedAt ? new Date(drill.completedAt).toLocaleDateString() : 'Recently'}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="text-green-600 bg-green-100 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}