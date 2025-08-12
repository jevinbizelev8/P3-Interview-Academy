import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session, Question, Response } from '@shared/schema';

interface SessionContextType {
  currentSession: Session | null;
  currentQuestion: Question | null;
  currentResponse: Response | null;
  setCurrentSession: (session: Session | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setCurrentResponse: (response: Response | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentResponse, setCurrentResponse] = useState<Response | null>(null);

  const value = {
    currentSession,
    currentQuestion,
    currentResponse,
    setCurrentSession,
    setCurrentQuestion,
    setCurrentResponse,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
