import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import type { Question } from "@shared/schema";

interface QuestionInterfaceProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
}

export default function QuestionInterface({ question, currentIndex, totalQuestions }: QuestionInterfaceProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900">
          Question {currentIndex} of {totalQuestions}
        </h4>
        <div className="flex items-center space-x-2 text-sm text-neutral-gray">
          <Save className="w-4 h-4" />
          <span>Auto-save enabled</span>
        </div>
      </div>
      
      {/* Question Content */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">Q</span>
          </div>
          <p className="text-gray-900 font-medium">{question.question}</p>
        </div>
      </div>
      
      {/* Question Tags */}
      <div className="flex flex-wrap gap-2">
        {question.tags && Array.isArray(question.tags) && question.tags.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
