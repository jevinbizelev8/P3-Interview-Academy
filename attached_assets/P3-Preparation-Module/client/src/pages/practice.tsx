import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import ProgressTracker from "@/components/ProgressTracker";
import StageHeader from "@/components/StageHeader";
import QuestionInterface from "@/components/QuestionInterface";

import ResponseInterface from "@/components/ResponseInterface";
import FeedbackPanel from "@/components/FeedbackPanel";
import QuestionNavigation from "@/components/QuestionNavigation";
import EvaluationCriteria from "@/components/EvaluationCriteria";
import WGLLTeaser from "@/components/WGLLTeaser";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { InterviewType } from "@shared/schema";

const getStageTitle = (interviewType: InterviewType) => {
  const stageTitles = {
    'phone-screening': 'Phone/Initial Screening Preparation Session',
    'functional-team': 'Functional/Team Interview Preparation Session', 
    'hiring-manager': 'Hiring Manager Interview Preparation Session',
    'subject-matter-expertise': 'Subject-Matter Expertise Interview Preparation Session',
    'executive-final': 'Executive/Final Round Preparation Session'
  };
  return stageTitles[interviewType] || 'Interview Preparation Session';
};

const getStageCategory = (interviewType: InterviewType) => {
  const categories = {
    'phone-screening': 'HR Screening',
    'functional-team': 'Team Assessment',
    'hiring-manager': 'Leadership Review',
    'subject-matter-expertise': 'Subject-Matter Expertise',
    'executive-final': 'Executive Decision'
  };
  return categories[interviewType] || 'Interview';
};

const getStageDescription = (interviewType: InterviewType) => {
  const descriptions = {
    'phone-screening': 'Basic qualifications, culture fit, and salary expectations. Focus on clear communication and enthusiasm.',
    'functional-team': 'Team dynamics, collaboration, and role-specific skills. Demonstrate your ability to work effectively with others.',
    'hiring-manager': 'Leadership assessment, strategic thinking, and team fit. Show your potential for growth and leadership.',
    'subject-matter-expertise': 'Deep technical skills, problem-solving, and expertise. Focus on specific examples and quantifiable results.',
    'executive-final': 'Vision alignment, cultural impact, and final decision factors. Demonstrate strategic thinking and long-term value.'
  };
  return descriptions[interviewType] || 'General interview preparation and response practice.';
};

export default function Preparation() {
  const { sessionId } = useParams();
  const { currentSession, currentQuestion, currentResponse, setCurrentSession } = useSession();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions', session?.interviewType, session?.industry, sessionId],
    queryFn: async () => {
      if (!session?.interviewType || !sessionId) return [];
      let url = `/api/questions?type=${session.interviewType}&sessionId=${sessionId}`;
      if (session.industry) {
        url += `&industry=${session.industry}`;
      }
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!session?.interviewType && !!sessionId,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['/api/responses/session', sessionId],
    enabled: !!sessionId,
  });

  if (sessionLoading || questionsLoading || responsesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!session || !questions?.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
            <p className="text-gray-600">The practice session could not be loaded.</p>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestionIndex = session.currentQuestionIndex || 0;
  const question = questions[currentQuestionIndex];
  const response = responses?.find((r: any) => r.questionId === question?.id);

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Questions Available</h2>
            <p className="text-gray-600">No questions found for this interview type.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressTracker 
          currentStage="practice" 
          currentStep={2}
          totalSteps={4}
        />
        
        <StageHeader 
          title={getStageTitle(session.interviewType)}
          subtitle={`${session.position} • ${session.company} • ${getStageCategory(session.interviewType)}`}
          description={getStageDescription(session.interviewType)}
          interviewType={session.interviewType}
        />
        
        <QuestionInterface 
          question={question}
          currentIndex={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
        
        <ResponseInterface 
          sessionId={sessionId!}
          questionId={question.id}
          currentResponse={response}
        />
        
        {response?.feedback && (
          <FeedbackPanel feedback={response.feedback} />
        )}
        
        <QuestionNavigation 
          sessionId={sessionId!}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          canNavigate={!!response?.responseText}
        />
        
        <EvaluationCriteria scores={response?.evaluationScores || {}} />
        
        <WGLLTeaser />
      </main>

      {/* Floating Help Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-primary-blue text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50">
        <span className="text-lg">?</span>
      </button>
    </div>
  );
}
