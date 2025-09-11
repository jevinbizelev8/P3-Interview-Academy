import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InterviewScoreCharts from "@/components/InterviewScoreCharts";
import { StructuredFeedbackCard } from "@/components/StructuredFeedbackCard";
import type { PracticeReport } from "@shared/schema";

interface AssessmentData extends PracticeReport {
  // Extended data from comprehensive evaluation
  overallRating?: string;
  relevanceScore?: string;
  starStructureScore?: string;
  specificEvidenceScore?: string;
  roleAlignmentScore?: string;
  outcomeOrientedScore?: string;
  problemSolvingScore?: string;
  culturalFitScore?: string;
  learningAgilityScore?: string;
  criteriaVersion?: string;
  sessionLanguage?: string;
  totalResponses?: number;
  sessionDuration?: number;
}

export default function PracticeAssessment() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
  const totalResponses = report.totalResponses || session?.messages?.filter(m => m.messageType === 'user_response').length || 0;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Assessment Report</h1>
            <p className="text-gray-600">Comprehensive evaluation based on 9-criteria scoring rubric</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleDownloadReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShareResults} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Overall Score Banner */}
      <Card className={`mb-8 border-2 ${isPassed ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isPassed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {isPassed ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Overall Score: {overallScore}/5.0</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${getScoreBadgeColor(overallRating)} font-medium`}>
                    {overallRating}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {isPassed ? '✅ Meets interview standards' : '⚠️ Additional practice recommended'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{totalResponses}</div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatDuration(sessionDuration)}</div>
                  <div className="text-xs text-gray-500">Duration</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{getLanguageDisplayName(sessionLanguage)}</div>
                  <div className="text-xs text-gray-500">Language</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Performance Level</span>
              <span>{Math.round((overallScore / 5) * 100)}%</span>
            </div>
            <Progress 
              value={(overallScore / 5) * 100} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Needs Improvement</span>
              <span>Borderline</span>
              <span>Pass</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Detailed Assessment Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="criteria" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            9 Criteria
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Performance Charts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InterviewScoreCharts evaluation={chartData as any} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Key Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Strengths */}
                <div>
                  <h4 className="font-medium text-green-600 mb-2 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Top Strengths
                  </h4>
                  <ul className="space-y-1">
                    {strengths.slice(0, 3).map((strength, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator />
                
                {/* Priority Improvements */}
                <div>
                  <h4 className="font-medium text-amber-600 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Priority Improvements
                  </h4>
                  <ul className="space-y-1">
                    {improvements.slice(0, 3).map((improvement, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-amber-500 mr-2">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 9-Criteria Detailed Tab */}
        <TabsContent value="criteria" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(criteriaScores).map(([criterion, score]) => (
              <Card key={criterion} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {getCriterionDisplayName(criterion)}
                    </h3>
                    <Badge variant="outline" className={getScoreColor(score)}>
                      {score}/5
                    </Badge>
                  </div>
                  <Progress value={(score / 5) * 100} className="h-2 mb-3" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{getCriterionWeight(criterion)}% weight</span>
                    <span>{getScoreLabel(score)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detailed Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <StructuredFeedbackCard 
            feedback={structuredFeedback}
            questionText="Overall Interview Performance"
            responseText={`Completed ${totalResponses} questions in ${formatDuration(sessionDuration)}`}
            language={sessionLanguage}
          />
        </TabsContent>

        {/* Insights & Next Steps Tab */}
        <TabsContent value="insights" className="space-y-6">
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
                    {keyInsights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
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
                    {recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Lightbulb className="w-3 h-3 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-700">{action}</p>
                      </div>
                    ))}
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