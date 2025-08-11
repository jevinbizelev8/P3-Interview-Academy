import { Check, Play, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressTrackerProps {
  currentStep: "prepare" | "practice" | "perform";
}

export default function ProgressTracker({ currentStep }: ProgressTrackerProps) {
  const steps = [
    {
      key: "prepare",
      label: "Prepare",
      icon: Check,
      description: "Learn with instant AI coaching",
    },
    {
      key: "practice",
      label: "Practice",
      icon: Play,
      description: "Use AI role-play to rehearse",
    },
    {
      key: "perform",
      label: "Perform",
      icon: Trophy,
      description: "Apply skills confidently",
    },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Interview Practice</h2>
          <p className="text-sm text-gray-600">Follow the P³ framework for effective learning</p>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
          15-20 minutes per session
        </div>
      </div>
      
      <Card>
        <CardContent className="p-1">
          <div className="flex space-x-1">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;
              
              return (
                <div
                  key={step.key}
                  className={`flex-1 text-center py-3 px-4 rounded transition-colors ${
                    isCompleted 
                      ? "bg-green-500 text-white" 
                      : isCurrent 
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <StepIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {isCurrent && (
                    <p className="text-xs mt-1 opacity-90">{step.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
