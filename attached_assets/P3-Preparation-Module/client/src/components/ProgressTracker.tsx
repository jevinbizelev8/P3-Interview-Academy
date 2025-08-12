import { Check } from "lucide-react";
import type { InterviewStage } from "@shared/schema";

interface ProgressTrackerProps {
  currentStage: InterviewStage;
  currentStep: number;
  totalSteps: number;
}

const stages = [
  { key: 'setup', label: 'Setup & Stage Selection', step: 1 },
  { key: 'practice', label: 'Practice', step: 2 },
  { key: 'review', label: 'Review', step: 3 },
  { key: 'complete', label: 'Complete', step: 4 },
];

export default function ProgressTracker({ currentStage, currentStep, totalSteps }: ProgressTrackerProps) {
  const getStageStatus = (stageKey: string, stageStep: number) => {
    if (stageStep < currentStep) return 'completed';
    if (stageStep === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Interview Preparation Progress</h2>
        <span className="text-sm text-neutral-gray font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      
      <div className="flex items-center space-x-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.key, stage.step);
          
          return (
            <div key={stage.key} className="flex items-center">
              {/* Stage Indicator */}
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'completed'
                      ? 'bg-success-green'
                      : status === 'current'
                      ? 'bg-primary-blue'
                      : 'bg-gray-200'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        status === 'current' ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {stage.step}
                    </span>
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    status === 'completed' ? 'bg-success-green' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
