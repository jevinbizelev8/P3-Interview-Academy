import { useParams } from 'wouter';
import { InterviewCoaching } from '@/components/InterviewCoaching';

export function CoachingSessionPage() {
  const { sessionId } = useParams();
  
  if (!sessionId) {
    return <div>Invalid session ID</div>;
  }

  return <InterviewCoaching sessionId={sessionId} />;
}