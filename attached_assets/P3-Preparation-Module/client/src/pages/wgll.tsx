import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import WGLLSingleQuestion from "@/components/WGLLSingleQuestion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function WGLL() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data: session } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: responses } = useQuery({
    queryKey: ['/api/responses/session', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions } = useQuery({
    queryKey: ['/api/questions', (session as any)?.interviewType, (session as any)?.industry],
    queryFn: async () => {
      if (!(session as any)?.interviewType) return [];
      
      // For subject-matter-expertise interviews, include industry filter
      let url = `/api/questions?type=${(session as any).interviewType}`;
      if ((session as any)?.interviewType === 'subject-matter-expertise' && (session as any)?.industry) {
        url += `&industry=${(session as any).industry}`;
      }
      
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!(session as any)?.interviewType,
  });

  if (!session || !responses || !questions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Loading WGLL Content...</h2>
          </div>
        </main>
      </div>
    );
  }

  const interviewTypeDisplay = {
    'phone-screening': 'Phone/Initial Screening (HR)',
    'functional-team': 'Functional/Team Interview',
    'hiring-manager': 'Hiring Manager Interview',
    'subject-matter-expertise': 'Subject-Matter Expertise Interview',
    'executive-final': 'Executive/Final Round'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/review/${sessionId}`)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">What Good Looks Like (WGLL)</h1>
            <p className="text-gray-600 mt-2">
              Expert model answers for {interviewTypeDisplay[(session as any)?.interviewType as keyof typeof interviewTypeDisplay] || 'Interview Questions'}
            </p>
          </div>
        </div>

        {/* Sequential WGLL Questions */}
        {questions && questions.length > 0 ? (
          <WGLLSingleQuestion
            questions={questions}
            currentIndex={currentQuestionIndex}
            onIndexChange={setCurrentQuestionIndex}
            interviewType={(session as any)?.interviewType || ''}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">No questions available</h2>
            <p className="text-gray-600 mt-2">Please check your session configuration</p>
          </div>
        )}
      </main>
    </div>
  );
}