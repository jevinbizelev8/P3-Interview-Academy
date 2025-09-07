import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Target } from 'lucide-react';
import type { AiEvaluationResult } from '@shared/schema';

interface InterviewScoreChartsProps {
  evaluation: AiEvaluationResult;
}

const SCORE_COLORS = {
  excellent: '#10B981', // green-500
  good: '#F59E0B', // amber-500  
  needs_improvement: '#EF4444', // red-500
  background: '#F3F4F6' // gray-100
};

const CRITERIA_WEIGHTS = {
  'Relevance': 15,
  'STAR Structure': 15,
  'Specific Evidence': 15,
  'Role Alignment': 15,
  'Outcome-Oriented': 15,
  'Communication': 10,
  'Problem-Solving': 10,
  'Cultural Fit': 5,
  'Learning Agility': 5
};

export default function InterviewScoreCharts({ evaluation }: InterviewScoreChartsProps) {
  // Prepare data for radar chart
  const radarData = [
    {
      criteria: 'Relevance',
      score: Number(evaluation.relevanceScore) || 3,
      maxScore: 5,
      weight: 15
    },
    {
      criteria: 'STAR Structure',
      score: Number(evaluation.starStructureScore) || 3,
      maxScore: 5,
      weight: 15
    },
    {
      criteria: 'Evidence',
      score: Number(evaluation.specificEvidenceScore) || 3,
      maxScore: 5,
      weight: 15
    },
    {
      criteria: 'Role Alignment',
      score: Number(evaluation.roleAlignmentScore) || 3,
      maxScore: 5,
      weight: 15
    },
    {
      criteria: 'Outcomes',
      score: Number(evaluation.outcomeOrientedScore) || 3,
      maxScore: 5,
      weight: 15
    },
    {
      criteria: 'Communication',
      score: Number(evaluation.communicationScore) || 3,
      maxScore: 5,
      weight: 10
    },
    {
      criteria: 'Problem-Solving',
      score: Number(evaluation.problemSolvingScore) || 3,
      maxScore: 5,
      weight: 10
    },
    {
      criteria: 'Cultural Fit',
      score: Number(evaluation.culturalFitScore) || 3,
      maxScore: 5,
      weight: 5
    },
    {
      criteria: 'Learning Agility',
      score: Number(evaluation.learningAgilityScore) || 3,
      maxScore: 5,
      weight: 5
    }
  ];

  // Prepare data for weighted bar chart
  const barData = radarData.map(item => ({
    ...item,
    weightedScore: (item.score * item.weight / 100).toFixed(1),
    maxWeightedScore: (5 * item.weight / 100).toFixed(1)
  }));

  // Calculate overall metrics
  const weightedOverallScore = Number(evaluation.weightedOverallScore) || 3.0;
  const overallRating = evaluation.overallRating || 'Borderline';
  
  // Pass/Fail threshold data
  const thresholdData = [
    { name: 'Your Score', value: weightedOverallScore, fill: getScoreColor(weightedOverallScore) },
    { name: 'Remaining', value: 5 - weightedOverallScore, fill: SCORE_COLORS.background }
  ];

  function getScoreColor(score: number): string {
    if (score >= 3.5) return SCORE_COLORS.excellent;
    if (score >= 3.0) return SCORE_COLORS.good;
    return SCORE_COLORS.needs_improvement;
  }

  function getScoreIcon(score: number) {
    if (score >= 3.5) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 3.0) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  }

  function getScoreDescription(score: number): { label: string; description: string; color: string } {
    if (score >= 3.5) return { 
      label: 'Pass', 
      description: 'Exceeds expectations', 
      color: 'bg-green-100 text-green-800 border-green-200' 
    };
    if (score >= 3.0) return { 
      label: 'Borderline', 
      description: 'Meets basic expectations', 
      color: 'bg-amber-100 text-amber-800 border-amber-200' 
    };
    return { 
      label: 'Needs Improvement', 
      description: 'Below expectations', 
      color: 'bg-red-100 text-red-800 border-red-200' 
    };
  }

  const scoreInfo = getScoreDescription(weightedOverallScore);

  return (
    <div className="space-y-6">
      {/* Overall Score Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            {getScoreIcon(weightedOverallScore)}
            <span>Interview Performance Score</span>
            <Badge className={scoreInfo.color}>
              {scoreInfo.label}
            </Badge>
          </CardTitle>
          <CardDescription>{scoreInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-gray-900">
              {weightedOverallScore.toFixed(1)}/5.0
            </span>
            <div className="text-right text-sm text-gray-600">
              <div>Pass Threshold: ≥ 3.5</div>
              <div>Borderline: 3.0 - 3.4</div>
            </div>
          </div>
          <Progress 
            value={(weightedOverallScore / 5) * 100} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1.0</span>
            <span className="text-red-600">3.0</span>
            <span className="text-amber-600">3.5</span>
            <span>5.0</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart - 9 Criteria Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Performance Radar</span>
            </CardTitle>
            <CardDescription>
              Your score across all 9 evaluation criteria (1-5 scale)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="criteria" 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <PolarRadiusAxis 
                  angle={0} 
                  domain={[0, 5]} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}/5`, 'Score']}
                  labelFormatter={(label) => `${label}`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weighted Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Weighted Contribution</span>
            </CardTitle>
            <CardDescription>
              How each criteria contributes to your overall score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  domain={[0, 1]} 
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <YAxis 
                  dataKey="criteria" 
                  type="category" 
                  tick={{ fontSize: 11 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${(Number(value) * 100).toFixed(1)}%`, 
                    'Weighted Score'
                  ]}
                  labelFormatter={(label) => `${label} (${CRITERIA_WEIGHTS[label as keyof typeof CRITERIA_WEIGHTS]}% weight)`}
                />
                <Bar 
                  dataKey="weightedScore" 
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Criteria Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Score Breakdown</CardTitle>
          <CardDescription>
            Individual scores and feedback for each evaluation criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radarData.map((item) => (
              <div 
                key={item.criteria}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{item.criteria}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.weight}%
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl font-bold">
                    {item.score.toFixed(1)}
                  </span>
                  <span className="text-gray-500">/5</span>
                  {getScoreIcon(item.score)}
                </div>
                <Progress 
                  value={(item.score / 5) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Thresholds */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="font-semibold text-green-700">Pass</div>
            <div className="text-sm text-green-600">≥ 3.5/5</div>
            <div className="text-xs text-gray-500 mt-1">Exceeds expectations</div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="font-semibold text-amber-700">Borderline</div>
            <div className="text-sm text-amber-600">3.0 - 3.4/5</div>
            <div className="text-xs text-gray-500 mt-1">Meets basic expectations</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="font-semibold text-red-700">Needs Improvement</div>
            <div className="text-sm text-red-600">&lt; 3.0/5</div>
            <div className="text-xs text-gray-500 mt-1">Below expectations</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}