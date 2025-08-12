import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Eye, Download, Star } from "lucide-react";
import { format } from "date-fns";

interface Assessment {
  id: string;
  overallScore: string;
  overallGrade: string;
  assessmentDate: string;
  session: {
    scenario: {
      title: string;
      interviewStage: string;
      jobRole: string;
    };
  };
  relevanceScore: number;
  structuredScore: number;
  specificScore: number;
  honestScore: number;
  confidentScore: number;
  alignedScore: number;
  outcomeOrientedScore: number;
}

export default function AssessmentHistory() {
  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ['/api/assessments/user/dev-user-123'],
    retry: false,
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment History</h1>
          <p className="text-gray-600">Review your interview performance assessments</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Yet</h3>
            <p className="text-gray-600 mb-6">
              Complete practice sessions to start building your assessment history.
            </p>
            <Link href="/practice">
              <Button>Start Practice Session</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {assessments.length}
                </div>
                <p className="text-gray-600">Total Assessments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {(assessments.reduce((sum, a) => sum + parseFloat(a.overallScore), 0) / assessments.length).toFixed(1)}
                </div>
                <p className="text-gray-600">Average Score</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {assessments.filter(a => a.overallGrade === 'A' || a.overallGrade === 'B').length}
                </div>
                <p className="text-gray-600">High Grades (A-B)</p>
              </CardContent>
            </Card>
          </div>

          {/* Assessment List */}
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {assessment.session.scenario.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span>{assessment.session.scenario.interviewStage}</span>
                        <span>•</span>
                        <span>{assessment.session.scenario.jobRole}</span>
                        <span>•</span>
                        <span>{format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getGradeColor(assessment.overallGrade)}>
                        Grade {assessment.overallGrade}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {parseFloat(assessment.overallScore).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">out of 5.0</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                    {[
                      { label: 'Relevance', score: assessment.relevanceScore },
                      { label: 'STAR Method', score: assessment.structuredScore },
                      { label: 'Specific', score: assessment.specificScore },
                      { label: 'Honest', score: assessment.honestScore },
                      { label: 'Confident', score: assessment.confidentScore },
                      { label: 'Aligned', score: assessment.alignedScore },
                      { label: 'Results-Focused', score: assessment.outcomeOrientedScore },
                    ].map((criteria, index) => (
                      <div key={index} className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(criteria.score)}`}>
                          {criteria.score}
                        </div>
                        <div className="text-xs text-gray-600 leading-tight">
                          {criteria.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link href={`/perform/assessment/${assessment.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}