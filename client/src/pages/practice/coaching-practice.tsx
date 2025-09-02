import { useParams } from "wouter";
import { InterviewCoaching } from "@/components/InterviewCoaching";
import MainNav from "@/components/navigation/main-nav";

export default function CoachingPractice() {
  const { sessionId } = useParams<{ sessionId: string }>();

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <MainNav currentModule="practice" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Session Not Found</h1>
            <p className="text-gray-600 mt-2">Invalid session ID provided.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <MainNav currentModule="practice" />
      <InterviewCoaching sessionId={sessionId} />
    </div>
  );
}