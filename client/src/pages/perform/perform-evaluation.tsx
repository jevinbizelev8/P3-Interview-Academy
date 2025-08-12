import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, 
  TrendingUp, 
  MessageCircle, 
  Target, 
  Share,
  Download,
  RefreshCcw,
  Star,
  Trophy,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AiEvaluationResult } from "@shared/schema";

export default function PerformEvaluation() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch evaluation results
  const { data: evaluation, isLoading } = useQuery({
    queryKey: [`/api/perform/sessions/${sessionId}/evaluation`],
    enabled: !!sessionId,
  });

  // Fetch session data for context
  const { data: session } = useQuery({
    queryKey: [`/api/perform/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Share progress mutation
  const shareProgressMutation = useMutation({
    mutationFn: async () => {
      return await fetch(`/api/perform/sessions/${sessionId}/share`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Progress Shared!",
        description: "Your anonymized performance has been shared with the community.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Generating your comprehensive AI evaluation...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Evaluation not found or still being generated.</p>
      </div>
    );
  }

  const overallScorePercentage = evaluation.overallScore ? Number(evaluation.overallScore) * 10 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your AI Interview Performance Report
            </h1>
            <p className="text-gray-600">
              {session?.userJobPosition} at {session?.userCompanyName}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/perform">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Interview
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
                <p className="text-purple-100 text-lg">{evaluation.overallRating}</p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Score: {evaluation.overallScore}/10</span>
                  </div>
                  {evaluation.badgeEarned && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Award className="w-4 h-4 mr-2" />
                      {evaluation.badgeEarned}
                    </Badge>
                  )}
                  {evaluation.pointsEarned && evaluation.pointsEarned > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-100 border-yellow-400/30">
                      <Star className="w-4 h-4 mr-2" />
                      +{evaluation.pointsEarned} XP
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-2">{overallScorePercentage}%</div>
                <Progress value={overallScorePercentage} className="w-32 bg-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Evaluation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="drills">Practice</TabsTrigger>
          <TabsTrigger value="reflection">Reflect</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.strengths && Array.isArray(evaluation.strengths) ? (
                    evaluation.strengths.map((strength: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{strength}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No specific strengths identified.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.improvementAreas && Array.isArray(evaluation.improvementAreas) ? (
                    evaluation.improvementAreas.map((area: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{area}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No specific improvement areas identified.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Qualitative Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {evaluation.qualitativeObservations || "No detailed observations available."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Communication Clarity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="font-semibold">{evaluation.communicationScore || 0}/10</span>
                </div>
                <Progress value={(Number(evaluation.communicationScore) || 0) * 10} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empathy & Emotional Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="font-semibold">{evaluation.empathyScore || 0}/10</span>
                </div>
                <Progress value={(Number(evaluation.empathyScore) || 0) * 10} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Problem-Solving Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="font-semibold">{evaluation.problemSolvingScore || 0}/10</span>
                </div>
                <Progress value={(Number(evaluation.problemSolvingScore) || 0) * 10} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="font-semibold">{evaluation.culturalAlignmentScore || 0}/10</span>
                </div>
                <Progress value={(Number(evaluation.culturalAlignmentScore) || 0) * 10} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actionable Insights</CardTitle>
              <CardDescription>
                Specific, personalized recommendations for your next interview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluation.actionableInsights && Array.isArray(evaluation.actionableInsights) ? (
                  evaluation.actionableInsights.map((insight: string, index: number) => (
                    <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800">{insight}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No specific insights available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practice Drills Tab */}
        <TabsContent value="drills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Practice Drills</CardTitle>
              <CardDescription>
                Targeted exercises to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluation.personalizedDrills && Array.isArray(evaluation.personalizedDrills) ? (
                  evaluation.personalizedDrills.map((drill: string, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800">{drill}</p>
                        <Button variant="outline" size="sm">
                          Start Drill
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No specific drills recommended.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reflection Tab */}
        <TabsContent value="reflection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Self-Reflection Prompts
              </CardTitle>
              <CardDescription>
                Deepen your learning with these guided reflection questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluation.reflectionPrompts && Array.isArray(evaluation.reflectionPrompts) ? (
                  evaluation.reflectionPrompts.map((prompt: string, index: number) => (
                    <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-purple-800 mb-3">{prompt}</p>
                      <Button variant="outline" size="sm" className="text-purple-600 border-purple-300">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Reflect with AI Coach
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No reflection prompts available.</p>
                )}
              </div>

              {evaluation.coachReflectionSummary && (
                <Card className="mt-6 bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800">AI Coach Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700">{evaluation.coachReflectionSummary}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-8">
        <Button
          variant="outline"
          onClick={() => shareProgressMutation.mutate()}
          disabled={shareProgressMutation.isPending}
        >
          <Share className="w-4 h-4 mr-2" />
          Share Progress
        </Button>
        <Link href="/perform">
          <Button>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </Link>
      </div>
    </div>
  );
}