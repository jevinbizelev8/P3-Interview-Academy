import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Star, 
  Lightbulb, 
  Target, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  Brain,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';

interface STARAnalysis {
  situation?: number;
  task?: number;
  action?: number;
  result?: number;
  overall: number;
  feedback?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    overall?: string;
  };
}

interface FeedbackData {
  starAnalysis: STARAnalysis;
  tips: string[];
  modelAnswer: string;
  learningPoints: string[];
  nextSteps: string[];
  strengths: string[];
  improvements: string[];
  responseQuality: {
    clarity: number;
    relevance: number;
    depth: number;
    structure: number;
  };
  culturalContext?: {
    appropriateness: number;
    professionalTone: number;
    localContext: string;
  };
}

interface StructuredFeedbackCardProps {
  feedback: FeedbackData;
  questionText?: string;
  responseText?: string;
  language?: string;
}

export function StructuredFeedbackCard({ 
  feedback, 
  questionText, 
  responseText,
  language = 'en' 
}: StructuredFeedbackCardProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['star']);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    if (score >= 5) return 'Needs Work';
    return 'Requires Improvement';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Response Analysis</CardTitle>
                <p className="text-sm text-gray-600">Comprehensive feedback on your interview response</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(feedback.starAnalysis.overall)}`}>
                {feedback.starAnalysis.overall}/10
              </div>
              <p className="text-sm text-gray-600 mt-1">{getScoreLabel(feedback.starAnalysis.overall)}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* STAR Method Analysis */}
      <Collapsible 
        open={expandedSections.includes('star')} 
        onOpenChange={() => toggleSection('star')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  STAR Method Breakdown
                </CardTitle>
                {expandedSections.includes('star') ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {feedback.starAnalysis.situation !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">Situation</span>
                      <Badge className={getScoreColor(feedback.starAnalysis.situation)}>
                        {feedback.starAnalysis.situation}/10
                      </Badge>
                    </div>
                    <Progress value={feedback.starAnalysis.situation * 10} className="h-2" />
                    {feedback.starAnalysis.feedback?.situation && (
                      <p className="text-sm text-gray-600">{feedback.starAnalysis.feedback.situation}</p>
                    )}
                  </div>
                )}

                {feedback.starAnalysis.task !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-purple-700">Task</span>
                      <Badge className={getScoreColor(feedback.starAnalysis.task)}>
                        {feedback.starAnalysis.task}/10
                      </Badge>
                    </div>
                    <Progress value={feedback.starAnalysis.task * 10} className="h-2" />
                    {feedback.starAnalysis.feedback?.task && (
                      <p className="text-sm text-gray-600">{feedback.starAnalysis.feedback.task}</p>
                    )}
                  </div>
                )}

                {feedback.starAnalysis.action !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-700">Action</span>
                      <Badge className={getScoreColor(feedback.starAnalysis.action)}>
                        {feedback.starAnalysis.action}/10
                      </Badge>
                    </div>
                    <Progress value={feedback.starAnalysis.action * 10} className="h-2" />
                    {feedback.starAnalysis.feedback?.action && (
                      <p className="text-sm text-gray-600">{feedback.starAnalysis.feedback.action}</p>
                    )}
                  </div>
                )}

                {feedback.starAnalysis.result !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-orange-700">Result</span>
                      <Badge className={getScoreColor(feedback.starAnalysis.result)}>
                        {feedback.starAnalysis.result}/10
                      </Badge>
                    </div>
                    <Progress value={feedback.starAnalysis.result * 10} className="h-2" />
                    {feedback.starAnalysis.feedback?.result && (
                      <p className="text-sm text-gray-600">{feedback.starAnalysis.feedback.result}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Response Quality Analysis */}
      <Collapsible 
        open={expandedSections.includes('quality')} 
        onOpenChange={() => toggleSection('quality')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Response Quality Analysis
                </CardTitle>
                {expandedSections.includes('quality') ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Clarity</span>
                    <Badge className={getScoreColor(feedback.responseQuality.clarity)}>
                      {feedback.responseQuality.clarity}/10
                    </Badge>
                  </div>
                  <Progress value={feedback.responseQuality.clarity * 10} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Relevance</span>
                    <Badge className={getScoreColor(feedback.responseQuality.relevance)}>
                      {feedback.responseQuality.relevance}/10
                    </Badge>
                  </div>
                  <Progress value={feedback.responseQuality.relevance * 10} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Depth</span>
                    <Badge className={getScoreColor(feedback.responseQuality.depth)}>
                      {feedback.responseQuality.depth}/10
                    </Badge>
                  </div>
                  <Progress value={feedback.responseQuality.depth * 10} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Structure</span>
                    <Badge className={getScoreColor(feedback.responseQuality.structure)}>
                      {feedback.responseQuality.structure}/10
                    </Badge>
                  </div>
                  <Progress value={feedback.responseQuality.structure * 10} className="h-2" />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Coaching Tips */}
      {feedback.tips.length > 0 && (
        <Collapsible 
          open={expandedSections.includes('tips')} 
          onOpenChange={() => toggleSection('tips')}
        >
          <Card className="border-green-200">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-green-50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-green-500" />
                    Coaching Tips ({feedback.tips.length})
                  </CardTitle>
                  {expandedSections.includes('tips') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Model Answer */}
      {feedback.modelAnswer && (
        <Collapsible 
          open={expandedSections.includes('model')} 
          onOpenChange={() => toggleSection('model')}
        >
          <Card className="border-purple-200">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-purple-50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Model Answer
                  </CardTitle>
                  {expandedSections.includes('model') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {feedback.modelAnswer}
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Learning Points */}
      {feedback.learningPoints.length > 0 && (
        <Collapsible 
          open={expandedSections.includes('learning')} 
          onOpenChange={() => toggleSection('learning')}
        >
          <Card className="border-orange-200">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-orange-50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    Learning Points ({feedback.learningPoints.length})
                  </CardTitle>
                  {expandedSections.includes('learning') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.learningPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {feedback.strengths.length > 0 && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Award className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {feedback.improvements.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cultural Context (for non-English responses) */}
      {feedback.culturalContext && language !== 'en' && (
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <MessageSquare className="h-5 w-5" />
              Cultural Context & Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Cultural Appropriateness</span>
                  <Badge className={getScoreColor(feedback.culturalContext.appropriateness)}>
                    {feedback.culturalContext.appropriateness}/10
                  </Badge>
                </div>
                <Progress value={feedback.culturalContext.appropriateness * 10} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Professional Tone</span>
                  <Badge className={getScoreColor(feedback.culturalContext.professionalTone)}>
                    {feedback.culturalContext.professionalTone}/10
                  </Badge>
                </div>
                <Progress value={feedback.culturalContext.professionalTone * 10} className="h-2" />
              </div>
            </div>
            
            {feedback.culturalContext.localContext && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>Local Context:</strong> {feedback.culturalContext.localContext}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {feedback.nextSteps.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}