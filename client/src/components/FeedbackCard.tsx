import { Bot, User, ChevronDown } from 'lucide-react';

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
  questionNumber?: number | null;
}

export function FeedbackCard({ feedback, questionNumber }: FeedbackCardProps) {
  if (!feedback) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 text-sm">
              AI Preceptor - Interview Coach
            </span>
            <span className="bg-blue-800 text-white px-2 py-0.5 rounded text-xs font-medium">
              Professional
            </span>
          </div>
          <button className="text-blue-600 hover:text-blue-800">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Feedback Section */}
        {feedback.improvementPoints && feedback.improvementPoints.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 text-sm mb-2">Feedback</h4>
            <div className="text-sm text-gray-700 space-y-1">
              {feedback.improvementPoints.map((point, index) => (
                <div key={index} className="leading-relaxed">
                  {point}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Answer */}
        {feedback.modelAnswer && (
          <div>
            <h4 className="font-medium text-gray-900 text-sm mb-2">Model Answer</h4>
            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border">
              {feedback.modelAnswer}
            </div>
          </div>
        )}

        {/* Learning Tip */}
        <div>
          <h4 className="font-medium text-gray-900 text-sm mb-2">Learning Tip</h4>
          <div className="text-sm text-gray-700 leading-relaxed">
            Structure your responses using the STAR method and include specific metrics to demonstrate measurable impact. Focus on your role and the business outcomes achieved.
          </div>
        </div>

        {/* Next Interview Question */}
        <div>
          <h4 className="font-medium text-gray-900 text-sm mb-2">Next Interview Question</h4>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <input
              type="text"
              placeholder="Share your experience and learning needs..."
              className="w-full bg-transparent text-sm text-gray-600 placeholder-gray-400 border-none outline-none"
              disabled
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press Enter to send • This simulation helps determine your interview competency level and learning objectives
          </div>
        </div>
      </div>
    </div>
  );
}