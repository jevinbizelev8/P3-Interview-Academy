import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface QuestionNavigationProps {
  sessionId: string;
  currentIndex: number;
  totalQuestions: number;
  canNavigate: boolean;
}

export default function QuestionNavigation({ 
  sessionId, 
  currentIndex, 
  totalQuestions, 
  canNavigate 
}: QuestionNavigationProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PATCH', `/api/sessions/${sessionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId] });
    },
  });

  const handlePrevious = () => {
    if (currentIndex > 0) {
      updateSessionMutation.mutate({ currentQuestionIndex: currentIndex - 1 });
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      updateSessionMutation.mutate({ currentQuestionIndex: currentIndex + 1 });
    } else {
      // Session complete, navigate to review
      updateSessionMutation.mutate({ 
        stage: 'review',
        completedAt: new Date().toISOString()
      });
      setLocation(`/review/${sessionId}`);
    }
  };

  const handleSaveAndSkip = () => {
    handleNext();
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={currentIndex === 0 || updateSessionMutation.isPending}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous Question
      </Button>
      
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          onClick={handleSaveAndSkip}
          disabled={updateSessionMutation.isPending}
        >
          Save & Skip
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canNavigate || updateSessionMutation.isPending}
        >
          {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Complete Session'}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
