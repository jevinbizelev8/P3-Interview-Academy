import { Star, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { STARComponentScoring } from "@shared/schema";

interface EvaluationCriteriaProps {
  scores: Partial<STARComponentScoring>;
}

const starCriteria = [
  { 
    key: 'situation', 
    label: 'Situation', 
    description: 'Set proper context with relevant details without rambling',
    guidance: 'Did you provide necessary background? Keep it concise and relevant to the story.'
  },
  { 
    key: 'task', 
    label: 'Task', 
    description: 'Clearly explain your specific responsibility or objective',
    guidance: 'What was your role? What objective were you trying to achieve?'
  },
  { 
    key: 'action', 
    label: 'Action', 
    description: 'Provide specific steps taken, avoiding vague answers',
    guidance: 'What exactly did you do? Be specific about your approach and methods.'
  },
  { 
    key: 'result', 
    label: 'Result', 
    description: 'Quantify outcomes with numbers, metrics, and long-term impact',
    guidance: 'What was the measurable outcome? Include specific numbers and lasting effects.'
  },
  { 
    key: 'overall', 
    label: 'Overall Flow', 
    description: 'How well the story flows as a complete, coherent narrative',
    guidance: 'Does your story connect logically from situation through to results?'
  },
];

export default function EvaluationCriteria({ scores }: EvaluationCriteriaProps) {
  const renderStars = (score: number = 0) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= score
                ? 'text-amber-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-600">
          {score > 0 ? `${score}/5` : '—'}
        </span>
      </div>
    );
  };



  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <h4 className="text-lg font-semibold text-gray-900">STAR Method Evaluation</h4>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="focus:outline-none">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3 bg-gray-900 text-white text-sm rounded-md shadow-lg">
              <p>Your response is evaluated using the STAR method: Situation, Task, Action, Result, and overall narrative flow.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="space-y-5">
          {starCriteria.map((criterion) => {
            const score = (scores as any)?.[criterion.key] || 0;
            return (
              <div key={criterion.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-800">{criterion.label}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="focus:outline-none">
                          <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm p-3 bg-gray-900 text-white text-sm rounded-md shadow-lg">
                        <div className="space-y-2">
                          <p className="font-medium text-white">{criterion.description}</p>
                          <p className="text-xs text-gray-300">{criterion.guidance}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {renderStars(score)}
                </div>
                
                {score === 0 && (
                  <div className="text-xs text-gray-400 ml-1">
                    Provide your response to see evaluation
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {scores && Object.values(scores).some(score => score > 0) && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Average Score</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  {(Object.values(scores).reduce((a, b) => a + (b || 0), 0) / Object.values(scores).filter(s => s > 0).length).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">/5.0</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}