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
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Globe,
  Brain,
  BarChart3,
  FileText,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InterviewScoreCharts from "@/components/InterviewScoreCharts";
import DetailedFeedbackCards from "@/components/DetailedFeedbackCards";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssessmentTranslation } from "@/hooks/useAssessmentTranslation";
import type { AiEvaluationResult } from "@shared/schema";

export default function PerformEvaluation() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const {
    currentLanguage,
    t,
    changeLanguage,
    getTranslatedField,
    getCurrentLanguageInfo,
    isTranslating,
    supportedLanguages
  } = useAssessmentTranslation();

  // Fetch evaluation results - try Practice API first, then Perform API as fallback
  const { data: evaluation, isLoading } = useQuery({
    queryKey: [`/api/evaluation/${sessionId}`],
    queryFn: async () => {
      try {
        // Try Practice API first
        const response = await fetch(`/api/practice/sessions/${sessionId}/evaluation`, {
          credentials: 'include'
        });
        if (response.ok) {
          return await response.json();
        }
        
        // Fallback to Perform API
        const fallbackResponse = await fetch(`/api/perform/sessions/${sessionId}/evaluation`, {
          credentials: 'include'
        });
        if (fallbackResponse.ok) {
          return await fallbackResponse.json();
        }
        
        throw new Error('Evaluation not found');
      } catch (error) {
        throw new Error('Failed to fetch evaluation');
      }
    },
    enabled: !!sessionId,
  });

  // Fetch session data for context - try Practice API first, then Perform API
  const { data: session } = useQuery({
    queryKey: [`/api/session/${sessionId}`],
    queryFn: async () => {
      try {
        // Try Practice API first
        const response = await fetch(`/api/practice/sessions/${sessionId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          return await response.json();
        }
        
        // Fallback to Perform API
        const fallbackResponse = await fetch(`/api/perform/sessions/${sessionId}`, {
          credentials: 'include'
        });
        if (fallbackResponse.ok) {
          return await fallbackResponse.json();
        }
        
        throw new Error('Session not found');
      } catch (error) {
        throw new Error('Failed to fetch session');
      }
    },
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

  // Use weighted overall score from new rubric system
  const weightedScore = Number(evaluation.weightedOverallScore) || Number(evaluation.overallScore) / 2 || 3.5;
  const overallScorePercentage = (weightedScore / 5) * 100;

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {session?.userJobPosition} at {session?.userCompanyName}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="flex items-center space-x-2 mr-4">
              <Globe className="w-4 h-4 text-gray-500" />
              <Select value={currentLanguage} onValueChange={(value) => changeLanguage(value as any, evaluation)}>
                <SelectTrigger className="w-[180px]" data-testid="language-selector">
                  <SelectValue>
                    <span className="flex items-center space-x-2">
                      <span>{getCurrentLanguageInfo().displayName}</span>
                      {isTranslating && (
                        <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                      )}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{language.displayName}</span>
                        {language.code === 'en' && (
                          <span className="text-xs text-green-600 ml-2">✓</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Link href="/perform">
              <Button variant="outline" data-testid="back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToDashboard')}
              </Button>
            </Link>
            <Link href="/practice">
              <Button data-testid="start-practice">
                {t('startNewPractice')}
              </Button>
            </Link>
            <Button variant="outline" data-testid="export-report">
              <Download className="w-4 h-4 mr-2" />
              {t('exportReport')}
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('overallPerformance')}</h2>
                <p className="text-purple-100 text-lg">{evaluation.overallRating}</p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>{t('score')}: {weightedScore.toFixed(1)}/5.0</span>
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
                <div className="text-4xl font-bold mb-2">{overallScorePercentage.toFixed(0)}%</div>
                <Progress value={overallScorePercentage} className="w-32 bg-white/20" />
                <div className="text-sm text-purple-200 mt-1">
                  {t('pass')}: ≥70% • {t('borderline')}: 60-69%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Evaluation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="kpis" data-testid="tab-analytics">{t('analytics')}</TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-feedback">{t('detailedFeedback')}</TabsTrigger>
          <TabsTrigger value="drills" data-testid="tab-practice">{t('practice')}</TabsTrigger>
          <TabsTrigger value="reflection" data-testid="tab-reflect">{t('reflect')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Session Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('questions')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {session?.completedQuestions || 0}/{session?.totalQuestions || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('duration')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {session?.duration ? `${Math.round(session.duration / 60)}m` : '0m'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('language')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {session?.interviewLanguage?.toUpperCase() || 'EN'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('status')}</p>
                    <p className="text-lg font-bold text-gray-900 capitalize">
                      {session?.status || 'completed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Strengths and Improvements */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className="text-green-800">{t('keyStrengths')}</span>
                    <p className="text-sm font-normal text-green-600 mt-1">
                      {t('strengthsSubtitle')}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {(() => {
                    const strengths = getTranslatedField('strengths', evaluation.strengths);
                    return strengths && Array.isArray(strengths) && strengths.length > 0 ? (
                      strengths.map((strength: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100 shadow-sm">
                          <div className="p-1 bg-green-100 rounded-full mt-0.5">
                            <Zap className="w-3 h-3 text-green-600" />
                          </div>
                          <p className="text-gray-800 leading-relaxed flex-1">{strength}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Brain className="w-12 h-12 text-green-300 mx-auto mb-3" />
                        <p className="text-green-600 font-medium">{t('buildingStrengths')}</p>
                        <p className="text-sm text-green-500 mt-1">{t('buildingStrengthsDesc')}</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Improvement Areas Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-blue-800">{t('growthOpportunities')}</span>
                    <p className="text-sm font-normal text-blue-600 mt-1">
                      {t('growthSubtitle')}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {(() => {
                    const improvementAreas = getTranslatedField('improvementAreas', evaluation.improvementAreas);
                    return improvementAreas && Array.isArray(improvementAreas) && improvementAreas.length > 0 ? (
                      improvementAreas.map((area: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                          <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-blue-600" />
                          </div>
                          <p className="text-gray-800 leading-relaxed flex-1">{area}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Target className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                        <p className="text-blue-600 font-medium">{t('identifyingGrowth')}</p>
                        <p className="text-sm text-blue-500 mt-1">{t('identifyingGrowthDesc')}</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Qualitative Observations */}
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <span className="text-gray-800">{t('aiAssessmentNotes')}</span>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    {t('aiNotesSubtitle')}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                {(() => {
                  const observations = getTranslatedField('qualitativeObservations', evaluation.qualitativeObservations);
                  return observations && observations.trim() ? (
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed text-base mb-0">
                        {observations}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium mb-2">{t('generatingAnalysis')}</p>
                      <p className="text-sm text-gray-400">
                        {t('generatingAnalysisDesc')}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <InterviewScoreCharts evaluation={evaluation} t={t as any} />
        </TabsContent>

        {/* Detailed Feedback Tab */}
        <TabsContent value="insights" className="space-y-6">
          <DetailedFeedbackCards evaluation={evaluation} />
          
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
        <Link href="/practice">
          <Button>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </Link>
      </div>
      </div>
    </ProtectedRoute>
  );
}