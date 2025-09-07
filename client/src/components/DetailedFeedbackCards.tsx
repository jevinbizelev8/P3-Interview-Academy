import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  TrendingUp,
  Users,
  Brain,
  Zap
} from 'lucide-react';
import type { AiEvaluationResult } from '@shared/schema';

interface DetailedFeedbackCardsProps {
  evaluation: AiEvaluationResult;
}

interface CriteriaData {
  key: string;
  title: string;
  description: string;
  weight: number;
  icon: React.ReactNode;
  score: number;
  feedback: string;
  color: string;
}

export default function DetailedFeedbackCards({ evaluation }: DetailedFeedbackCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (key: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCards(newExpanded);
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (score >= 3) return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4) return 'border-l-green-500 bg-green-50';
    if (score >= 3) return 'border-l-amber-500 bg-amber-50';
    return 'border-l-red-500 bg-red-50';
  };

  const criteriaData: CriteriaData[] = [
    {
      key: 'relevance',
      title: 'Relevance of Response',
      description: 'Provide direct, focused answers that address the question without unnecessary details',
      weight: 15,
      icon: <Target className="w-5 h-5 text-blue-600" />,
      score: Number(evaluation.relevanceScore) || 3,
      feedback: evaluation.relevanceFeedback || 'Response addresses the question appropriately.',
      color: 'blue'
    },
    {
      key: 'star',
      title: 'STAR Method Structure',
      description: 'Organize responses using logical flow with clear Situation, Task, Action, Result',
      weight: 15,
      icon: <Star className="w-5 h-5 text-purple-600" />,
      score: Number(evaluation.starStructureScore) || 3,
      feedback: evaluation.starStructureFeedback || 'Responses follow logical structure.',
      color: 'purple'
    },
    {
      key: 'evidence',
      title: 'Specific Evidence Usage',
      description: 'Support claims with concrete examples, data, and real-world evidence',
      weight: 15,
      icon: <Lightbulb className="w-5 h-5 text-orange-600" />,
      score: Number(evaluation.specificEvidenceScore) || 3,
      feedback: evaluation.specificEvidenceFeedback || 'Provides adequate examples and evidence.',
      color: 'orange'
    },
    {
      key: 'alignment',
      title: 'Role Alignment',
      description: 'Demonstrate relevant skills and experience for the position with genuine enthusiasm',
      weight: 15,
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      score: Number(evaluation.roleAlignmentScore) || 3,
      feedback: evaluation.roleAlignmentFeedback || 'Experience aligns well with role requirements.',
      color: 'green'
    },
    {
      key: 'outcomes',
      title: 'Outcome-Oriented',
      description: 'Emphasize measurable results, impact, and relevance to business goals',
      weight: 15,
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      score: Number(evaluation.outcomeOrientedScore) || 3,
      feedback: evaluation.outcomeOrientedFeedback || 'Demonstrates focus on measurable outcomes.',
      color: 'indigo'
    },
    {
      key: 'communication',
      title: 'Communication Skills',
      description: 'Convey information clearly and confidently using proper tone and structure',
      weight: 10,
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      score: Number(evaluation.communicationScore) || 3,
      feedback: evaluation.communicationFeedback || 'Clear and professional communication style.',
      color: 'blue'
    },
    {
      key: 'problemSolving',
      title: 'Problem-Solving / Critical Thinking',
      description: 'Analyze situations, make decisions, and provide creative solutions with logical reasoning',
      weight: 10,
      icon: <Brain className="w-5 h-5 text-pink-600" />,
      score: Number(evaluation.problemSolvingScore) || 3,
      feedback: evaluation.problemSolvingFeedback || 'Shows good analytical thinking.',
      color: 'pink'
    },
    {
      key: 'cultural',
      title: 'Cultural Fit / Values Alignment',
      description: 'Demonstrate compatibility with company culture and ability to collaborate effectively',
      weight: 5,
      icon: <Users className="w-5 h-5 text-teal-600" />,
      score: Number(evaluation.culturalFitScore) || 3,
      feedback: evaluation.culturalFitFeedback || 'Demonstrates good cultural alignment.',
      color: 'teal'
    },
    {
      key: 'agility',
      title: 'Learning Agility / Adaptability',
      description: 'Show ability to learn quickly, adjust to new situations, and take initiative',
      weight: 5,
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      score: Number(evaluation.learningAgilityScore) || 3,
      feedback: evaluation.learningAgilityFeedback || 'Shows adaptability and learning mindset.',
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Detailed Criteria Evaluation
        </h3>
        <p className="text-sm text-gray-600">
          Click on each card to view detailed feedback and improvement suggestions
        </p>
      </div>

      {criteriaData.map((criteria) => (
        <Card 
          key={criteria.key}
          className={`border-l-4 ${getScoreColor(criteria.score)} transition-all duration-200 hover:shadow-md`}
        >
          <Collapsible
            open={expandedCards.has(criteria.key)}
            onOpenChange={() => toggleCard(criteria.key)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {criteria.icon}
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {criteria.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Weight: {criteria.weight}% • {criteria.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl font-bold">
                          {criteria.score.toFixed(1)}
                        </span>
                        <span className="text-gray-500">/5</span>
                        {getScoreIcon(criteria.score)}
                      </div>
                      <Progress 
                        value={(criteria.score / 5) * 100} 
                        className="w-20 h-2"
                      />
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      {expandedCards.has(criteria.key) ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="border-t pt-4 space-y-4">
                  {/* Detailed Feedback */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                      Detailed Feedback
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {criteria.feedback}
                      </p>
                    </div>
                  </div>

                  {/* Score Interpretation */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-green-500" />
                      Score Interpretation
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className={`p-2 rounded text-center ${criteria.score >= 4 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        <div className="font-medium">Great (4-5)</div>
                        <div className="text-xs">Exceeds expectations</div>
                      </div>
                      <div className={`p-2 rounded text-center ${criteria.score >= 3 && criteria.score < 4 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                        <div className="font-medium">Average (3)</div>
                        <div className="text-xs">Meets expectations</div>
                      </div>
                      <div className={`p-2 rounded text-center ${criteria.score < 3 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                        <div className="font-medium">Poor (1-2)</div>
                        <div className="text-xs">Below expectations</div>
                      </div>
                    </div>
                  </div>

                  {/* Weighted Contribution */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                      Impact on Overall Score
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Weighted Contribution: {criteria.weight}%
                        </span>
                        <span className="font-medium">
                          {((criteria.score * criteria.weight) / 100).toFixed(2)} points
                        </span>
                      </div>
                      <Progress 
                        value={(criteria.score / 5) * 100} 
                        className="mt-2 h-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}