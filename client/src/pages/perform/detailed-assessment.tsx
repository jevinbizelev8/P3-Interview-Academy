import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Target,
  BookOpen,
  Lightbulb,
  Star
} from "lucide-react";

interface AssessmentDetail {
  id: string;
  overallScore: string;
  overallGrade: string;
  assessmentDate: string;
  strengths: string;
  improvements: string;
  specificFeedback: string;
  nextSteps: string;
  relevanceScore: number;
  structuredScore: number;
  specificScore: number;
  honestScore: number;
  confidentScore: number;
  alignedScore: number;
  outcomeOrientedScore: number;
  session: {
    scenario: {
      title: string;
      interviewStage: string;
      jobRole: string;
      companyBackground: string;
    };
    duration?: number;
  };
}

const CRITERIA_DETAILS = [
  {
    key: 'relevanceScore',
    name: 'Relevance',
    description: 'How well responses addressed the specific questions asked',
    icon: Target
  },
  {
    key: 'structuredScore', 
    name: 'STAR Method',
    description: 'Use of Situation, Task, Action, Result structure in responses',
    icon: BookOpen
  },
  {
    key: 'specificScore',
    name: 'Specificity',
    description: 'Providing concrete details and examples rather than vague statements',
    icon: Star
  },
  {
    key: 'honestScore',
    name: 'Authenticity',
    description: 'Genuine and truthful responses that reflect real experiences',
    icon: CheckCircle
  },
  {
    key: 'confidentScore',
    name: 'Confidence',
    description: 'Demonstrating self-assurance without appearing arrogant',
    icon: Award
  },
  {
    key: 'alignedScore',
    name: 'Role Alignment',
    description: 'Responses align with the target role and company culture',
    icon: Target
  },
  {
    key: 'outcomeOrientedScore',
    name: 'Results-Focused',
    description: 'Emphasis on achievements, outcomes, and measurable results',
    icon: TrendingUp
  }
];

export default function DetailedAssessment() {
  const { assessmentId } = useParams();
  
  const { data: assessment, isLoading } = useQuery<AssessmentDetail>({
    queryKey: [`/api/assessments/${assessmentId}`],
    retry: false,
    enabled: !!assessmentId
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-100 border-blue-200';  
      case 'C': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'F': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment Not Found</h3>
            <p className="text-gray-600 mb-6">
              The assessment you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/perform/history">
              <Button>Back to History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/perform/history">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{assessment.session.scenario.title}</h1>
          <p className="text-gray-600">
            {assessment.session.scenario.interviewStage} • {assessment.session.scenario.jobRole}
          </p>
        </div>
        <Badge className={`${getGradeColor(assessment.overallGrade)} px-4 py-2 text-lg`}>
          Grade {assessment.overallGrade}
        </Badge>
      </div>

      {/* Overall Score Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-6 h-6 mr-2 text-purple-600" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {parseFloat(assessment.overallScore).toFixed(1)}
              </div>
              <div className="text-gray-600">Overall Score</div>
              <div className="text-sm text-gray-500">out of 5.0</div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getGradeColor(assessment.overallGrade).split(' ')[0]}`}>
                {assessment.overallGrade}
              </div>
              <div className="text-gray-600">Letter Grade</div>
              <div className="text-sm text-gray-500">Performance Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {Math.round((parseFloat(assessment.overallScore) / 5) * 100)}%
              </div>
              <div className="text-gray-600">Percentile</div>
              <div className="text-sm text-gray-500">of maximum score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Criteria Breakdown</CardTitle>
              <CardDescription>
                Performance analysis across 7 key interview criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {CRITERIA_DETAILS.map((criteria, index) => {
                  const score = assessment[criteria.key as keyof AssessmentDetail] as number;
                  const Icon = criteria.icon;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className="w-5 h-5 mr-2 text-purple-600" />
                          <div>
                            <div className="font-medium">{criteria.name}</div>
                            <div className="text-sm text-gray-600">{criteria.description}</div>
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${getScoreColor(score)}`}>
                          {score}/5
                        </div>
                      </div>
                      <Progress 
                        value={(score / 5) * 100} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-6 h-6 mr-2 text-yellow-600" />
                Comprehensive Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Detailed Analysis</h4>
                  <p className="text-blue-800 leading-relaxed whitespace-pre-line">
                    {assessment.specificFeedback}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strengths" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                Key Strengths
              </CardTitle>
              <CardDescription>
                Areas where you performed exceptionally well
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-green-800 leading-relaxed whitespace-pre-line">
                  {assessment.strengths}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-orange-600" />
                Areas for Improvement
              </CardTitle>
              <CardDescription>
                Specific recommendations to enhance your performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-50 p-6 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-3">Focus Areas</h4>
                <p className="text-orange-800 leading-relaxed whitespace-pre-line">
                  {assessment.improvements}
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-3">Next Steps</h4>
                <p className="text-purple-800 leading-relaxed whitespace-pre-line">
                  {assessment.nextSteps}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Link href="/practice">
          <Button>
            Start New Practice Session
          </Button>
        </Link>
        <Button variant="outline">
          Download Assessment Report
        </Button>
      </div>
    </div>
  );
}