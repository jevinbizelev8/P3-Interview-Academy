import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Award, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  Target,
  Lightbulb,
  BookOpen,
  Home,
  RefreshCw,
  Download,
  Share2,
  Star,
  BarChart3,
  PieChart,
  Brain,
  Users,
  Zap,
  Globe,
  Trophy,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAssessmentTranslation } from "@/hooks/useAssessmentTranslation";
import InterviewScoreCharts from "@/components/InterviewScoreCharts";
import { StructuredFeedbackCard } from "@/components/StructuredFeedbackCard";
import type { PracticeReport } from "@shared/schema";

interface AssessmentData extends PracticeReport {
  // Extended data from comprehensive evaluation
  overallRating?: string;
  criteriaVersion?: string;
  sessionLanguage?: string;
  totalResponses?: number;
  sessionDuration?: number;
}

export default function PracticeAssessment() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
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

  // Fetch assessment data
  const { data: assessment, isLoading, error } = useQuery<{ success: boolean; data: AssessmentData }>({
    queryKey: [`/api/practice/sessions/${sessionId}/report`],
    enabled: !!sessionId,
  });

  // Fetch session data for additional context
  const { data: sessionData } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/practice/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your comprehensive assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Not Available</h2>
          <p className="text-gray-600 mb-4">
            {error ? "Failed to load assessment data" : "Assessment report not found"}
          </p>
          <Button onClick={() => setLocation("/practice")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Return to Practice
          </Button>
        </div>
      </div>
    );
  }

  const report = assessment.data;
  const session = sessionData?.data;
  
  // Parse scores and data
  const overallScore = Number(report.overallScore) || 3.5;
  const overallRating = report.overallRating || getScoreRating(overallScore);
  const isPassed = overallScore >= 3.5;
  
  // Parse 9-criteria scores (now returned as numbers from database)
  const criteriaScores = {
    relevance: Number(report.relevanceScore) || 3.5,
    starStructure: Number(report.starStructureScore) || 3.5,
    specificEvidence: Number(report.specificEvidenceScore) || 3.5,
    roleAlignment: Number(report.roleAlignmentScore) || 3.5,
    outcomeOriented: Number(report.outcomeOrientedScore) || 3.5,
    communication: Number(report.communicationScore) || 3.5,
    problemSolving: Number(report.problemSolvingScore) || 3.5,
    culturalFit: Number(report.culturalFitScore) || 3.5,
    learningAgility: Number(report.learningAgilityScore) || 3.5
  };
  
  // Parse feedback data (already arrays from JSONB columns)
  const strengths = Array.isArray(report.strengths) ? report.strengths : [];
  const weaknesses = Array.isArray(report.weaknesses) ? report.weaknesses : [];
  const improvements = Array.isArray(report.improvements) ? report.improvements : [];
  const keyInsights = Array.isArray(report.keyInsights) ? report.keyInsights : [];
  const recommendedActions = Array.isArray(report.recommendedActions) ? report.recommendedActions : [];
  
  // Session statistics
  const totalResponses = report.totalResponses || session?.messages?.filter((m: any) => m.messageType === 'user_response').length || 0;
  const sessionDuration = report.sessionDuration || 0;
  const sessionLanguage = report.sessionLanguage || session?.preferredLanguage || 'en';
  
  // Prepare data for charts
  const chartData = {
    relevanceScore: criteriaScores.relevance,
    starStructureScore: criteriaScores.starStructure,
    specificEvidenceScore: criteriaScores.specificEvidence,
    roleAlignmentScore: criteriaScores.roleAlignment,
    outcomeOrientedScore: criteriaScores.outcomeOriented,
    communicationScore: criteriaScores.communication,
    problemSolvingScore: criteriaScores.problemSolving,
    culturalFitScore: criteriaScores.culturalFit,
    learningAgilityScore: criteriaScores.learningAgility,
    weightedOverallScore: overallScore,
    overallRating
  };
  
  // Prepare structured feedback data
  const structuredFeedback = {
    starAnalysis: {
      situation: Math.round(criteriaScores.starStructure),
      task: Math.round(criteriaScores.starStructure),
      action: Math.round(criteriaScores.starStructure),
      result: Math.round(criteriaScores.outcomeOriented),
      overall: Math.round(overallScore)
    },
    tips: improvements.slice(0, 5),
    modelAnswer: report.detailedFeedback || "Continue practicing structured responses using the STAR method.",
    learningPoints: keyInsights.slice(0, 4),
    nextSteps: recommendedActions.slice(0, 5),
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5),
    responseQuality: {
      clarity: criteriaScores.communication,
      relevance: criteriaScores.relevance,
      depth: criteriaScores.specificEvidence,
      structure: criteriaScores.starStructure
    },
    culturalContext: sessionLanguage !== 'en' ? {
      appropriateness: criteriaScores.culturalFit,
      professionalTone: criteriaScores.communication,
      localContext: `Evaluated for ${getLanguageDisplayName(sessionLanguage)} cultural context`
    } : undefined
  };

  const handleStartNewPractice = () => {
    setLocation("/practice");
  };

  const handleViewDashboard = () => {
    setLocation("/dashboard");
  };

  const handleShareResults = () => {
    toast({
      title: "Share Feature Coming Soon",
      description: "Results sharing will be available in a future update.",
    });
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Feature Coming Soon", 
      description: "PDF report download will be available in a future update.",
    });
  };

  function getScoreRating(score: number): string {
    if (score >= 3.5) return 'Pass';
    if (score >= 3.0) return 'Borderline';
    return 'Needs Improvement';
  }

  function getScoreColor(score: number): string {
    if (score >= 3.5) return 'text-green-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreBadgeColor(rating: string): string {
    switch (rating) {
      case 'Pass': return 'bg-green-100 text-green-800 border-green-200';
      case 'Borderline': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  }

  function getLanguageDisplayName(lang: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'id': 'Indonesian',
      'ms': 'Malay',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'zh': 'Chinese',
      'ta': 'Tamil'
    };
    return languages[lang] || lang.toUpperCase();
  }

  function tryParseJSON(str: string | null | undefined, fallback: any[] = []): any[] {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            {session?.userJobPosition && session?.userCompanyName && (
              <p className="text-gray-600">
                {session.userJobPosition} at {session.userCompanyName}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="flex items-center space-x-2 mr-4">
              <Globe className="w-4 h-4 text-gray-500" />
              <Select value={currentLanguage} onValueChange={(value) => changeLanguage(value as any, assessment?.data)}>
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
            
            <Button onClick={handleViewDashboard} variant="outline" data-testid="back-dashboard">
              <Home className="w-4 h-4 mr-2" />
              {t('backToDashboard')}
            </Button>
            <Button onClick={handleStartNewPractice} data-testid="start-practice">
              {t('startNewPractice')}
            </Button>
            <Button onClick={handleDownloadReport} variant="outline" data-testid="export-report">
              <Download className="w-4 h-4 mr-2" />
              {t('exportReport')}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Overall Score Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('overallPerformance')}</h2>
              <p className="text-purple-100 text-lg">{overallRating}</p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>{t('score')}: {overallScore.toFixed(1)}/5.0</span>
                </div>
                {isPassed && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Award className="w-4 h-4 mr-2" />
                    {t('pass')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">{Math.round((overallScore / 5) * 100)}%</div>
              <Progress value={(overallScore / 5) * 100} className="w-32 bg-white/20" />
              <div className="text-sm text-purple-200 mt-1">
                {t('passThreshold')} • {t('borderlineRange')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('questions')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatDuration(sessionDuration)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{getLanguageDisplayName(sessionLanguage)}</p>
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
                <p className="text-lg font-bold text-gray-900 capitalize">{t('completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Assessment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">{t('analytics')}</TabsTrigger>
          <TabsTrigger value="feedback" data-testid="tab-feedback">{t('detailedFeedback')}</TabsTrigger>
          <TabsTrigger value="practice" data-testid="tab-practice">{t('practice')}</TabsTrigger>
          <TabsTrigger value="reflect" data-testid="tab-reflect">{t('reflect')}</TabsTrigger>
        </TabsList>

        {/* Enhanced Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                    const displayStrengths = getTranslatedField ? getTranslatedField('strengths', strengths) : strengths;
                    return displayStrengths && Array.isArray(displayStrengths) && displayStrengths.length > 0 ? (
                      displayStrengths.map((strength: string, index: number) => (
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
                    const displayImprovements = getTranslatedField ? getTranslatedField('improvementAreas', improvements) : improvements;
                    return displayImprovements && Array.isArray(displayImprovements) && displayImprovements.length > 0 ? (
                      displayImprovements.map((area: string, index: number) => (
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
                  const observations = getTranslatedField ? getTranslatedField('qualitativeObservations', report.detailedFeedback) : report.detailedFeedback;
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
        <TabsContent value="analytics" className="space-y-6">
          <InterviewScoreCharts evaluation={chartData as any} t={t as any} />
        </TabsContent>

        {/* Detailed Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <StructuredFeedbackCard 
            feedback={structuredFeedback}
            questionText={t('interviewPerformanceScore')}
            responseText={`${t('completed')} ${totalResponses} ${t('questions').toLowerCase()} in ${formatDuration(sessionDuration)}`}
            language={sessionLanguage}
          />
        </TabsContent>

        {/* Practice Drills Tab */}
        <TabsContent value="practice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Personalized Practice Recommendations
              </CardTitle>
              <CardDescription>
                Targeted exercises to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendedActions && Array.isArray(recommendedActions) && recommendedActions.length > 0 ? (
                  recommendedActions.map((action: string, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800">{action}</p>
                        <Button variant="outline" size="sm">
                          {t('practice')}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">Personalized Practice Coming Soon</p>
                    <p className="text-sm text-gray-400">
                      Complete more practice sessions to get tailored recommendations.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reflection Tab */}
        <TabsContent value="reflect" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {keyInsights && keyInsights.length > 0 ? (
                      keyInsights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Brain className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                        <p className="text-blue-600 font-medium">Building Your Insights</p>
                        <p className="text-sm text-blue-500 mt-1">Complete more sessions to generate deeper insights.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {recommendedActions && recommendedActions.length > 0 ? (
                      recommendedActions.map((action, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lightbulb className="w-3 h-3 text-purple-600" />
                          </div>
                          <p className="text-sm text-gray-700">{action}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Zap className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                        <p className="text-purple-600 font-medium">Generating Recommendations</p>
                        <p className="text-sm text-purple-500 mt-1">Your personalized action items will appear after evaluation.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card className="mt-8">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ready for Your Next Challenge?</h3>
              <p className="text-gray-600 text-sm">Continue improving your interview skills with more practice sessions.</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleViewDashboard} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button onClick={handleStartNewPractice} className="bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Practice Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function getCriterionDisplayName(criterion: string): string {
    const displayNames: Record<string, string> = {
      relevance: 'Response Relevance',
      starStructure: 'STAR Structure', 
      specificEvidence: 'Specific Evidence',
      roleAlignment: 'Role Alignment',
      outcomeOriented: 'Outcome Focus',
      communication: 'Communication',
      problemSolving: 'Problem-Solving',
      culturalFit: 'Cultural Fit',
      learningAgility: 'Learning Agility'
    };
    return displayNames[criterion] || criterion;
  }

  function getCriterionWeight(criterion: string): number {
    const weights: Record<string, number> = {
      relevance: 15,
      starStructure: 15,
      specificEvidence: 15,
      roleAlignment: 15,
      outcomeOriented: 15,
      communication: 10,
      problemSolving: 10,
      culturalFit: 5,
      learningAgility: 5
    };
    return weights[criterion] || 0;
  }

  function getScoreLabel(score: number): string {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 3.0) return 'Fair';
    if (score >= 2.5) return 'Needs Work';
    return 'Poor';
  }
}