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
      
      <div className="flex items-center justify-center bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.key, stage.step);
          
          return (
            <div key={stage.key} className="flex items-center">
              {/* Stage Indicator */}
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${
                    status === 'completed'
                      ? 'bg-green-600 border-green-600'
                      : status === 'current'
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-gray-100 border-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-base font-black ${
                        status === 'current' ? 'text-white' : 'text-gray-800'
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
                  className={`w-16 h-1 mx-6 rounded-full ${
                    status === 'completed' ? 'bg-success-green' : 'bg-gray-300'
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
