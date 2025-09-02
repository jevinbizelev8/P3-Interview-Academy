import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock, Target, Briefcase, Building2 } from 'lucide-react';

interface QuestionCardProps {
  question?: string;
  questionNumber?: number;
  totalQuestions?: number;
  sessionDetails?: {
    jobPosition?: string;
    companyName?: string;
    interviewStage?: string;
    primaryIndustry?: string;
  };
  isActive?: boolean;
}

export function QuestionCard({ 
  question, 
  questionNumber, 
  totalQuestions, 
  sessionDetails,
  isActive = false 
}: QuestionCardProps) {
  if (!question) return null;

  // Clean up the question text by removing markdown and formatting
  const cleanQuestion = (text: string) => {
    return text
      .replace(/\*\*Question:\*\*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/^Question \d+:/gm, '') // Remove "Question X:" prefix
      .replace(/^#{1,6}\s*/gm, '') // Remove markdown headers
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
  };

  const formatStage = (stage: string) => {
    return stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Extract main question and context if present
  const cleanedQuestion = cleanQuestion(question);
  const lines = cleanedQuestion.split('\n').filter(line => line.trim());
  const mainQuestion = lines[0];
  const context = lines.find(line => line.toLowerCase().includes('context:'))?.replace(/^Context:\s*/i, '');

  return (
    <Card className={`w-full transition-all duration-200 ${
      isActive ? 'border-blue-500 shadow-lg' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <CardTitle className="text-lg">
              {questionNumber && totalQuestions ? 
                `Question ${questionNumber}/${totalQuestions}` : 
                'Interview Question'
              }
            </CardTitle>
          </div>
          {isActive && (
            <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
              Current
            </Badge>
          )}
        </div>

        {/* Session context badges */}
        <div className="flex items-center gap-2 mt-2">
          {sessionDetails?.jobPosition && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Briefcase className="h-3 w-3" />
              <span>{sessionDetails.jobPosition}</span>
            </div>
          )}
          {sessionDetails?.companyName && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Building2 className="h-3 w-3" />
              <span>{sessionDetails.companyName}</span>
            </div>
          )}
          {sessionDetails?.interviewStage && (
            <Badge variant="outline" className="text-xs">
              {formatStage(sessionDetails.interviewStage)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Main Question */}
        <div className="mb-4">
          <blockquote className="text-lg font-medium text-gray-900 leading-relaxed border-l-4 border-blue-500 pl-4">
            "{mainQuestion}"
          </blockquote>
        </div>

        {/* Context if provided */}
        {context && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700 text-sm">Why this matters</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {context}
            </p>
          </div>
        )}

        {/* STAR Method Reminder */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 text-sm">STAR Method Reminder</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            <div><strong>S</strong>ituation: Set the context</div>
            <div><strong>T</strong>ask: Your responsibility</div>
            <div><strong>A</strong>ction: Steps you took</div>
            <div><strong>R</strong>esult: Outcome & impact</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}