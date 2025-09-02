import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { useState } from 'react';

interface FeedbackCardProps {
  feedback: {
    improvementPoints?: string[];
    modelAnswer?: string;
    starScores?: {
      situation: number;
      task: number;
      action: number;
      result: number;
      overall: number;
    };
  };
  questionNumber?: number;
}

export function FeedbackCard({ feedback, questionNumber }: FeedbackCardProps) {
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  
  if (!feedback) return null;

  // Parse improvement points into categories
  const improvementPoints = feedback.improvementPoints || [];
  const goodPoints = improvementPoints.filter(point => point.startsWith('✓'));
  const improvementNeeded = improvementPoints.filter(point => point.startsWith('⚠'));
  const tips = improvementPoints.filter(point => point.startsWith('💡'));

  const getOverallLevel = (score: number) => {
    if (score >= 4) return { level: 'Strong', color: 'bg-green-100 text-green-800 border-green-200' };
    if (score >= 3) return { level: 'Good', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { level: 'Needs Work', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const overallScore = feedback.starScores?.overall || 0;
  const overallLevel = getOverallLevel(overallScore);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {questionNumber ? `Question ${questionNumber} Feedback` : 'Feedback'}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`px-3 py-1 ${overallLevel.color}`}
          >
            {overallLevel.level} ({overallScore}/5)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Wins - What you did well */}
        {goodPoints.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900 text-sm">What you did well</span>
            </div>
            <ul className="space-y-1">
              {goodPoints.map((point, index) => (
                <li key={index} className="text-sm text-green-800">
                  {point.substring(2)} {/* Remove ✓ prefix */}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas to improve */}
        {improvementNeeded.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-900 text-sm">Areas to strengthen</span>
            </div>
            <ul className="space-y-1">
              {improvementNeeded.map((point, index) => (
                <li key={index} className="text-sm text-yellow-800">
                  {point.substring(2)} {/* Remove ⚠ prefix */}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pro tips */}
        {tips.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 text-sm">Pro tips</span>
            </div>
            <ul className="space-y-1">
              {tips.map((point, index) => (
                <li key={index} className="text-sm text-blue-800">
                  {point.substring(2)} {/* Remove 💡 prefix */}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Model Answer - Collapsible */}
        {feedback.modelAnswer && (
          <div className="border border-gray-200 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => setShowModelAnswer(!showModelAnswer)}
              className="w-full justify-between p-3 h-auto"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900 text-sm">Model Answer</span>
              </div>
              {showModelAnswer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showModelAnswer && (
              <div className="px-3 pb-3">
                <div className="bg-gray-50 p-3 rounded border-t">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {feedback.modelAnswer}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}